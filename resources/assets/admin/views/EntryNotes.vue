<template>
<div>
    <div class="entry_info_box entry_submission_activity">
        <div class="entry_info_header">
            <div class="info_box_header">
                {{$t('Submission Notes')}}
            </div>
            <div class="info_box_header_actions">
                <el-button @click="add_note_box = !add_note_box" size="mini" type="primary" icon="el-icon-plus">
                    {{ $t('Add Note') }}
                </el-button>
            </div>
        </div>
        <div v-loading="loading" class="entry_info_body">
            <div class="wpf_entry_details">
                <div v-if="add_note_box" class="wpf_add_note_box">
                    <el-input
                        type="textarea"
                        :autosize="{ minRows: 3}"
                        :placeholder="$t('Please Provide Note Content')"
                        v-model="new_note.content">
                    </el-input>
                    <el-button :loading="isAddingNote" @click="addNewNote()" size="mini" type="primary" plain>{{ $t('Submit Note') }}</el-button>
                </div>
                <template v-if="notes && notes.length">
                    <div v-for="activity in showingNotes" :key="activity.id"
                         class="wpf_each_entry">
                        <div class="wpf_entry_label">
                            {{activity.name}} - {{ activity.created_at }} <span v-show="api_log == 'yes'" class="ff_tag">{{activity.meta_key}}</span>
                        </div>
                        <div class="wpf_entry_value" v-html="activity.value"></div>
                    </div>

                    <el-button size="mini" v-if="notes.length > 5" type="info" @click="initial_limit =  !initial_limit"><span v-if="initial_limit">{{ $t('Load More') }}</span><span v-else>{{ $t('Show Less') }}</span></el-button>

                </template>
                <template v-else>
                    <h3> {{$t('No Notes found')}}</h3>
                </template>
            </div>
        </div>
    </div>
</div>

</template>
<script type="text/babel">
    import chunk from 'lodash/chunk';
    export default {
        name: 'response_notes',
        props: ['entry_id', 'form_id'],
        data() {
            return {
                doingAjax: false,
                notes: [],
                isAddingNote: false,
                add_note_box: false,
                initial_limit: true,
                api_log: 'yes',
                loading: false,
                new_note: {
                    content: '',
                    email_id: '',
                    email_subject: '',
                    status: 'info'
                }
            }
        },
        watch: {
            entry_id() {
                this.fetchNotes();
            },
            api_log() {
                this.fetchNotes();
            }
        },
        computed: {
            showingNotes() {
                if(this.initial_limit) {
                    return chunk(this.notes, 5)[0];
                }
                return this.notes;
            }
        },
        methods: {
            fetchNotes() {
                this.loading = true;
                
                const url = FluentFormsGlobal.$rest.route('getSubmissionNotes', this.entry_id);

                FluentFormsGlobal.$rest.get(url, {
                    api_log: this.api_log
                })
                    .then(notes => {
                        this.notes = notes;
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            addNewNote() {
                this.isAddingNote = true;

                const url = FluentFormsGlobal.$rest.route('storeSubmissionNote', this.entry_id);

                let data = {
                    note: this.new_note,
                    form_id: this.form_id
                };

                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        this.$success(response.message);

                        this.notes.unshift(response.note);

                        this.new_note = {
                            content: '',
                            email_id: '',
                            email_subject: '',
                            status: 'info'
                        };
                    })
                    .catch(error => {
                        
                    })
                    .finally(() =>{
                        this.isAddingNote = false;
                    })
            }
        },
        mounted(){
            this.fetchNotes();
        }
    }
</script> 


<template>
<div>
    <div class="entry_info_box entry_submission_activity">
        <div class="entry_info_header">
            <div class="info_box_header">
                {{$t('Submission Notes')}}
            </div>
            <div class="info_box_header_actions">
                <el-button @click="add_note_box = !add_note_box" size="mini" type="primary">{{ $t('Add Note') }}</el-button>
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
                    <el-button :loading="isAddingNote" @click="addNewNote()" size="small" type="success">{{ $t('Submit Note') }}</el-button>
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
                FluentFormsGlobal.$get({
                    action: 'fluentform-get-entry-notes', 
                    form_id: this.form_id, 
                    entry_id: this.entry_id,
                    api_log: this.api_log
                })
                    .then(response => {
                        this.notes = response.data.notes;
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            addNewNote() {
                this.isAddingNote = true;
                let data = {
                    action: 'fluentform-add-entry-note',
                    note: this.new_note,
                    entry_id: this.entry_id,
                    form_id: this.form_id
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.$notify({
                            title: 'Success',
                            message: response.data.message,
                            type: 'success',
                            offset: 30
                        });
                        this.notes.unshift(response.data.note);
                        this.new_note = {
                            content: '',
                            email_id: '',
                            email_subject: '',
                            status: 'info'
                        };
                    })
                    .fail(error => {
                        
                    })
                    .always(() =>{
                        this.isAddingNote = false;
                    })
            }
        },
        mounted(){
            this.fetchNotes();
        }
    }
</script> 


<template>
    <div class="ff-edit-history-wrap option-fields-section" style="min-height: 100px;">
        <div class="option-fields-section--title active">
            <div >
                <h5>History</h5>
            </div>
            <div>
                <el-button @click="clearHistory" type="danger" plain icon="el-icon-delete" size="mini"></el-button>
            </div>
        </div>
        <ul class="timeline" v-if="Object.keys(historyData).length">
            <li class="timeline_item" v-for="(editHistory, i) in historyData" :key="i" @mouseleave="renderHistory(i, 'leave')"
                @mouseenter="renderHistory(i, 'enter')">
                <div class="timeline_item_style"></div>
                <div class="timeline_item_header">
                    <div class="timeline_content">
                        <span>{{editHistory.change_title}}</span>
                    </div>
                    <div class="timeline-action">
                        <el-button plain @click="renderHistory(i, 'restore')"

                                   size="mini">Restore</el-button>
                    </div>
                </div>
                <div class="timeline_item_content">
            <span class="timeline_date" @click="showDetail(i)">
                {{ editHistory.timestamp }}
                <i :class="showDetails[i] ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i>
            </span>
                    <transition name="slide-fade">
                        <div class="timeline_details" :class="{ 'is-visible': showDetails[i] }">
                            <ul v-if="editHistory.changes">
                                <li class="details_list" v-for="(detail, index) in editHistory.changes" :key="index">
                                    {{detail.info}}
                                </li>
                            </ul>
                        </div>
                    </transition>
                </div>
            </li>
        </ul>
        <div v-else  class="option-fields-section--content">
<!--            todo hide history if its empty-->
            <strong>Unsaved changes are not reflected in the form history. To see your recent changes in the history:</strong>
            <ol>
                <li>Save your current form changes.</li>
                <li>The saved version will then appear in the form history.</li>
                <li>You can now preview or restore from this latest history entry.</li>
            </ol>
        </div>
    </div>
</template>
<script>
    export default {
        name: 'FormHistory',
        props :['history','form_saving'],
        data(){
            return {
                historyData : this.history,
                saving : this.form_saving,
                loading: false,
                form_id : window.FluentFormApp.form_id,
                showDetails : {},
            }
        },
        methods:{
            renderHistory(i,type){
                FluentFormEditorEvents.$emit('editor-history-preview', this.historyData[i].old_data, type, i);
            },
            showDetail(i){
                let state = this.showDetails[i];
                this.showDetails = {};
                this.$set(this.showDetails, i, !state);
            },
            fetchHistory(){
                const url = FluentFormsGlobal.$rest.route('getFormEditHistory',this.form_id);
                FluentFormsGlobal.$rest.get(url)
                    .then(response => {
                       if (response.history) {
                           this.historyData = response.history
                       }
                    })
                    .catch(e => {
                    });
            },
            clearHistory(){
                const url = FluentFormsGlobal.$rest.route('clearFormEditHistory',this.form_id);
                FluentFormsGlobal.$rest.post(url)
                    .then(res => {
                        this.historyData = {};
                        this.$success(res.message);
                    })
                    .catch(error => {
                        this.$fail(error.message);
                    })
            }
        },
        mounted() {
            FluentFormEditorEvents.$on('editor-form-saving', this.fetchHistory);
            this.fetchHistory();
        }
    }
</script>

<template>
    <div class="entry_info_box entry_submission_logs">
        <div class="entry_info_header">
            <div class="info_box_header">
                {{$t('Submission Logs')}}
            </div>
            <div class="info_box_header_actions">
                <el-radio-group fill="#409EFF" v-model="log_type" size="mini">
                    <el-radio-button label="logs">{{$t('General')}}</el-radio-button>
                    <el-radio-button label="api_calls">{{$t('API Calls')}}</el-radio-button>
                </el-radio-group>
            </div>
        </div>
        <div v-loading="loading" class="entry_info_body">
            <div class="wpf_entry_details">
                <template v-if="logs && logs.length">
                    <div v-for="log in logs" class="entry_submission_log wpf_each_entry">
                        <div class="wpf_entry_label">
                            <span class="ff_tag" :class="'log_status_'+log.status">{{log.status}}</span> {{ $t('in') }} <span
                                class="entry_submission_log_component">{{log.title}}</span> {{ $t('at') }}
                            {{log.created_at}}
                            <span class="pull-right">
                              <remove :plain="true" icon="el-icon-delete" @on-confirm="removeLog(log.id)"></remove>
                            </span>
                        </div>
                        <div class="entry_submission_log_des" v-html="log.description"></div>
                    </div>
                </template>
                <template v-else>
                    <h3>{{$t('No Logs found')}}</h3>
                </template>
            </div>
        </div>
    </div>
</template>
<script type="text/babel">
  import remove from "../components/confirmRemove";

  export default {
        name: 'submission_logs',
        props: ['entry_id'],
        components:{
          remove,
        },
        data() {
            return {
                logs: [],
                loading: false,
                log_type: 'logs'
            }
        },
        watch: {
            entry_id() {
                this.fetchLogs();
            },
            log_type() {
                this.fetchLogs();
            }
        },
        methods: {
            fetchLogs() {
                this.loading = true;
                
                const url = FluentFormsGlobal.$rest.route('getSubmissionLogs', this.entry_id);
                
                FluentFormsGlobal.$rest.get(url, {
                    source_type: 'submission_item',
                    log_type: this.log_type
                })
                    .then(logs => {
                        this.logs = logs;
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            
            removeLog(logId) {
                const url = FluentFormsGlobal.$rest.route('deleteSubmissionLogs', this.entry_id);
                
                let data = {
                    log_ids: [logId],
                    log_type: this.log_type
                };

                FluentFormsGlobal.$rest.delete(url, data)
                    .then(response => {
                        this.$success(response.message);
                        this.fetchLogs();
                    })
                    .catch(error => {
                        console.log(error);
                    });
            },
        },
        mounted() {
            this.fetchLogs();
        }
    }
</script>

<template>
    <div class="entry_info_box entry_submission_logs">
        <div class="entry_info_header">
            <div class="info_box_header">
                Submission Logs
            </div>
            <div class="info_box_header_actions">
                <el-radio-group fill="#409EFF" v-model="log_type" size="mini">
                    <el-radio-button label="logs">General</el-radio-button>
                    <el-radio-button label="api_calls">API Calls</el-radio-button>
                </el-radio-group>
            </div>
        </div>
        <div v-loading="loading" class="entry_info_body">
            <div class="wpf_entry_details">
                <template v-if="logs && logs.length && log_type == 'logs'">
                    <div v-for="log in logs" class="entry_submission_log wpf_each_entry">
                        <div class="wpf_entry_label">
                            <span class="ff_tag" :class="'log_status_'+log.status">{{log.status}}</span> in <span
                                class="entry_submission_log_component">{{log.component}} ({{log.title}})</span> at
                            {{log.created_at}}
                        </div>
                        <div class="entry_submission_log_des" v-html="log.description"></div>
                    </div>
                </template>
                <template v-if="logs && logs.length && log_type == 'api_calls'">
                    <div v-for="log in logs" class="entry_submission_log wpf_each_entry">
                        <div class="wpf_entry_label">
                            <span class="ff_tag" :class="'log_status_'+log.status">{{log.status}}</span> in <span
                                class="entry_submission_log_component">{{getReadableName(log.action)}}</span> at
                            {{log.created_at}}
                        </div>
                        <div class="entry_submission_log_des" v-html="log.note"></div>
                    </div>
                </template>
                <template v-if="!logs || !logs.length">
                    <h3>No Logs found</h3>
                </template>
            </div>
        </div>
    </div>
</template>
<script type="text/babel">

    export default {
        name: 'submission_logs',
        props: ['entry_id'],
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
                jQuery.get(ajaxurl, {
                    action: 'fluentform-get-entry-logs',
                    entry_id: this.entry_id,
                    source_type: 'submission_item',
                    log_type: this.log_type
                })
                    .then(response => {
                        this.logs = response.data.logs;
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            getReadableName(actionName) {
                if (!actionName) {
                    return 'n/a';
                }
                return actionName.replace('fluentform_integration_notify_', '')
                    .replace('fluentform_', '')
                    .replace('_notification_feed', '')
                    .replace('_', ' ');

            }
        },
        mounted() {
            this.fetchLogs();
        }
    }
</script>
<style lang="scss">
    .entry_submission_log {
        .wpf_entry_label {
            margin-bottom: 10px;
        }

        &_component {
            font-weight: bold;
            text-transform: capitalize;
        }

        span {
            &:first-child {
                color: white;
                border-radius: 3px;
            }
        }

        .log_status_failed, .log_status_error {
            background: #c23434;
        }

        .log_status_success {
            background: #348938;
        }
    }
</style>

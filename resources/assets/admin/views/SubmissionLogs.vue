<template>
    <div class="entry_info_box entry_submission_logs">
        <card>
            <card-head>
                <card-head-group class="justify-between">
                    <div class="entry_info_box_title">
                        {{ $t("Submission Logs") }}
                    </div>
                    <div class="entry_info_box_actions">
                        <el-radio-group class="el-radio-group-info" v-model="log_type" size="medium">
                            <el-radio-button label="logs">{{$t('General')}}</el-radio-button>
                            <el-radio-button label="api">{{$t('API Calls')}}</el-radio-button>
                        </el-radio-group>
                    </div>
                </card-head-group>
            </card-head>
            <card-body>
                <div class="entry_info_body">
                    <el-skeleton :loading="loading" animated :rows="4">
                        <div class="wpf_entry_details">
                            <template v-if="logs && logs.length">
                                <div
                                    v-for="(log, logKey) in logs"
                                    class="entry_submission_log wpf_each_entry"
                                    :key="logKey"
                                    v-loading="replaying[log.id]"
                                >
                                    <div class="wpf_entry_label">
                                        <span v-html="
                                            $t(
                                                '%s in %s at %s',
                                                `<span class='ff_tag mr-2 log_status_${log.status}'>${log.status}</span>`,
                                                `<span class='entry_submission_log_component'>${log.title}</span>`,
                                                log.created_at
                                            )
                                        ">
                                        </span>
                                        <span class="wpf_entry_remove">
                                             <el-tooltip class="item" placement="bottom" popper-class="ff_tooltip_wrap">
                                                <div slot="content">

                                                    <p>
                                                        {{ $t('Run the API action again') }}
                                                    </p>
                                                </div>

                                                <el-button
                                                        v-if="hasPro && log_type === 'api_calls'"
                                                        class="el-button--icon mr-2"
                                                        @click="
                                                    runAction(
                                                       log
                                                    )
                                                "
                                                        type="success"
                                                        size="mini"
                                                >
                                                Replay
                                            </el-button>
                                            </el-tooltip>


                                            <remove
                                                :plain="true"
                                                @on-confirm="removeLog(log.id)"
                                            >
                                                <el-button
                                                    class="el-button--icon el-button--soft"
                                                    size="mini"
                                                    type="danger"
                                                    icon="el-icon-delete"
                                                />
                                            </remove>
                                        </span>
                                    </div>
                                    <div
                                        class="entry_submission_log_des"
                                        v-html="log.description"
                                    ></div>
                                </div>
                            </template>
                            <p class="fs-17" v-else>
                                {{ $t("Sorry, No Logs found!") }}
                            </p>
                        </div>
                    </el-skeleton>
                </div>
            </card-body>
        </card>
    </div>
</template>
<script type="text/babel">
    import remove from "@/admin/components/confirmRemove";
    import Card from "@/admin/components/Card/Card.vue";
    import CardBody from "@/admin/components/Card/CardBody.vue";
    import CardHead from "@/admin/components/Card/CardHead.vue";
    import CardHeadGroup from "@/admin/components/Card/CardHeadGroup.vue";
    import BtnGroupItem from "@/admin/components/BtnGroup/BtnGroupItem.vue";
    import BtnGroup from "@/admin/components/BtnGroup/BtnGroup.vue";

    export default {
        name: "submission_logs",
        props: ["entry_id", "reload_logs"],
        components: {
            BtnGroup,
            BtnGroupItem,
            remove,
            Card,
            CardHead,
            CardBody,
            CardHeadGroup,
        },
        data() {
            return {
                logs: [],
                loading: false,
                log_type: "logs",
                singleLoading: false,
                replaying: {}
            };
        },
        watch: {
            entry_id() {
                this.fetchLogs();
            },
            log_type() {
                this.fetchLogs();
            },
            reload_logs: {
                handler: function(value) {
                    if (value) {
                        this.fetchLogs();
                        this.$emit('reset_reload_logs');
                    }
                }
            }
        },
        computed: {
            hasPro() {
                return !!window.fluent_form_entries_vars.has_pro;
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
                    type: this.log_type
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
            runAction(log) {
                this.$set(this.replaying, log.id, true);
                const logObj = [
                    {
                        action_id: log.id,
                        feed_id: log.feed_id,
                        form_id: log.form_id,
                        entry_id: log.submission_id,
                        integration_enabled: log.integration_enabled
                    }
                ];
                let data = {
                    action: 'ffpro_post_integration_feed_replay',
                    verify_condition: 'yes',
                    multiple_actions: false,
                    logIds: logObj,
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.$success(response.data.message);
                    })
                    .fail(error => {
                        if (!error.responseJSON && !error.responseText || error.responseText == '0') {
                            alert(this.$t('Looks like you are using older version of fluent forms pro. Please update to latest version'));
                            return;
                        }
                        this.$fail(error.responseJSON.data.message);
                    })
                    .always(() => {
                        this.fetchLogs();
                        this.$set(this.replaying, log.id, false);
                    });
            }
        },
        mounted() {
            this.fetchLogs();
        }
    }
</script>

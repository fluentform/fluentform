<template>
    <div class="ff_email_resend_inline">
        <el-button v-if="element_type == 'button'" @click="openModal()" type="info" size="small">{{btn_text}}
        </el-button>
        <el-dialog
            title="Choose an Action/Integration Feed and Replay"
            top="42px"
            @before-close="resetData()"
            :append-to-body="true"
            :visible.sync="dialogVisible"
            width="60%">
            <template v-if="has_pro">
                <div v-loading="loading" element-loading-text="Loading Feeds..." class="ff_notification_feeds">
                    <el-checkbox style="margin-bottom: 10px;" true-label="yes" false-label="no" v-model="verify_condition">Check Conditional Logic when replaying a feed action</el-checkbox>

                    <el-table border stripe :data="feeds">
                        <el-table-column
                            width="180"
                            label="Integration">
                            <template slot-scope="scope">
                                <img v-if="scope.row.provider_logo" class="general_integration_logo"
                                     :src="scope.row.provider_logo" :alt="scope.row.provider"/>
                                <span class="general_integration_name" v-else>{{scope.row.provider}}</span>
                            </template>
                        </el-table-column>
                        <el-table-column
                            label="Title">
                            <template slot-scope="scope">
                                {{scope.row.name}}
                                <span v-if="scope.row.has_condition"> (Conditional)</span>
                            </template>
                        </el-table-column>
                        <el-table-column
                            label="Status">
                            <template slot-scope="scope">
                                <span v-if="scope.row.enabled">Active</span>
                                <span v-else>Draft</span>
                            </template>
                        </el-table-column>
                        <el-table-column
                            label="Actions">
                            <template slot-scope="scope">
                                <el-button v-loading="sending" @click="replayFeed(scope.row.id)" type="info" size="mini">Replay</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <div v-if="error_message" v-html="error_message" class="ff-error"></div>
                <div v-if="success_message" v-html="success_message" class="ff-success"></div>
            </template>
            <div style="text-align: center" v-else>
                <h3>This feature is available on pro version of Fluent Forms.</h3>
                <a target="_blank"
                   :href="upgrade_url"
                   rel="nofollow"
                   class="el-button el-button--danger">
                    Buy Pro Now
                </a>
            </div>
        </el-dialog>
    </div>
</template>
<script type="text/babel">
    export default {
        name: 'ManualEntryActions',
        props: {
            entry_id: {
                default() {
                    return '';
                }
            },
            form_id: {
                required: true
            },
            entry_ids: {
                default() {
                    return []
                }
            },
            element_type: {
                default() {
                    return 'button'
                }
            },
            btn_text: {
                default() {
                    return 'Entry Actions'
                }
            }
        },
        data() {
            return {
                has_pro: !!window.fluent_form_entries_vars.has_pro,
                dialogVisible: false,
                sending: false,
                error_message: '',
                success_message: '',
                feeds: [],
                loading: false,
                verify_condition: 'yes',
                upgrade_url: window.fluent_form_entries_vars.upgrade_url
            }
        },
        methods: {
            replayFeed(feedId) {
                if (this.sending) {
                    return;
                }
                this.sending = true;
                this.error_message = '';
                this.success_message = '';
                let data = {
                    action: 'ffpro_post_integration_feed_replay',
                    feed_id: feedId,
                    form_id: this.form_id,
                    entry_id: this.entry_id,
                    verify_condition: this.verify_condition
                };
                jQuery.post(window.ajaxurl, data)
                    .then(response => {
                        this.$notify.success(response.data.message);
                    })
                    .fail(error => {
                        if (!error.responseJSON && !error.responseText || error.responseText == '0') {
                            alert('Looks like you are using older version of fluent forms pro. Please update to latest version');
                            return;
                        }
                        this.error_message = error.responseJSON.data.message;
                    })
                    .always(() => {
                        this.sending = false;
                    });
            },
            resetData() {
                this.error_message = '';
                this.success_message = '';
                this.form = {
                    selected_notification_id: '',
                    send_to_type: 'default',
                    send_to_custom_email: ''
                }
            },
            getFeeds() {
                if (window.ff_form_entry_actions) {
                    this.feeds = window.ff_form_entry_actions;
                    return;
                }

                this.loading = true;
                jQuery.get(window.ajaxurl, {
                    action: 'ffpro_get_integration_feeds',
                    form_id: this.form_id
                })
                    .then(response => {
                        window.ff_form_entry_actions = response.data.feeds;
                        this.feeds = response.data.feeds;
                    })
                    .fail((errors) => {
                        if (!error.responseJSON && !error.responseText || error.responseText == '0') {
                            alert('Looks like you are using older version of fluent forms pro. Please update to latest version');
                            return;
                        }
                    })
                    .always(() => {
                        this.loading = false;
                    });

            },
            openModal() {
                this.dialogVisible = true;
                if (this.has_pro) {
                    this.getFeeds();
                }
            }
        }
    }
</script>

<template>
    <div class="ff_email_resend_inline">
        <el-button @click="dialogVisible=true" type="info" size="small">Resend Email Notification</el-button>
        <el-dialog
            title="Choose Email Notification"
            top="42px"
            @before-close="resetData()"
            :append-to-body="true"
            :visible.sync="dialogVisible"
            width="60%">
            <template v-if="has_pro">
                <el-form label-width="120px" ref="form" :model="form" label-position="left">
                    <el-form-item label="Notification">
                        <el-select size="small" placeholder="Select Notification"
                                   v-model="form.selected_notification_id">
                            <el-option v-for="notification in notifications" :value="notification.id"
                                       :label="notification.name" :key="notification.id"></el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item label="Send To">
                        <el-radio-group size="small" v-model="form.send_to_type">
                            <el-radio-button label="default">Default Recipient</el-radio-button>
                            <el-radio-button label="custom">Custom Recipient</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <template v-if="form.send_to_type == 'custom'">
                        <el-form-item label="Recipient">
                            <el-input v-model="form.send_to_custom_email" size="small"
                                      placeholder="Please Type Recipient Email Address"/>
                        </el-form-item>
                    </template>
                </el-form>
                <div v-if="error_message" v-html="error_message" class="ff-error"></div>
                <div v-if="success_message" v-html="success_message" class="ff-success"></div>
                <span slot="footer" class="dialog-footer">
                    <el-button @click="dialogVisible = false">Cancel</el-button>
                    <el-button v-loading="sending" :disabled="!isActive" type="primary" @click="send()">Resend this notification</el-button>
                </span>
            </template>
            <div style="text-align: center" v-else>
                <h3>This feature is available on pro version of fluent forms.</h3>
                <a target="_blank" href="https://wpmanageninja.com/downloads/fluentform-pro-add-on/?utm_source=fluentform&amp;utm_medium=wp&amp;utm_campaign=wp_plugin&amp;utm_term=upgrade&amp;utm_content=pop" class="el-button el-button--danger">
                    Buy Pro Now
                </a>
            </div>
        </el-dialog>
    </div>
</template>
<script type="text/babel">
    export default {
        name: 'resentEmailNotification',
        props: ['entry_id', 'form_id'],
        data() {
            return {
                has_pro: !!window.fluent_form_entries_vars.has_pro,
                dialogVisible: false,
                sending: false,
                error_message: '',
                success_message: '',
                form: {
                    selected_notification_id: '',
                    send_to_type: 'default',
                    send_to_custom_email: ''
                },
                notifications: window.fluent_form_entries_vars.email_notifications
            }
        },
        computed: {
            isActive() {
                if (this.form.send_to_type == 'custom') {
                    return this.form.selected_notification_id && this.form.send_to_custom_email;
                }
                return this.form.selected_notification_id;
            }
        },
        methods: {
            send() {
                if (this.sending) {
                    return;
                }
                this.sending = true;
                this.error_message = '';
                this.success_message = '';
                let data = {
                    action: 'ffpro-resent-email-notification',
                    notification_id: this.form.selected_notification_id,
                    form_id: this.form_id,
                    entry_id: this.entry_id,
                    send_to_type: this.form.send_to_type,
                    send_to_custom_email: this.form.send_to_custom_email,
                    ff_sumulate: 'fluentform_submit'
                };
                jQuery.post(ajaxurl, data)
                    .then(response => {
                        this.$notify.success(response.data.message);
                        this.success_message = response.data.message;
                        this.form = {
                            selected_notification_id: '',
                            send_to_type: 'default',
                            send_to_custom_email: ''
                        };
                        this.$emit('reloadLogs', 1);
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
            }
        }
    }
</script>

<style lang="scss">
    .ff-error {
        background: #FF9800;
        color: white;
        padding: 10px;
    }

    .ff-success {
        padding: 10px;
        background: #4CAF50;
        color: white;
    }
</style>

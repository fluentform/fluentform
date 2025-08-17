<template>
    <div class="ff_email_resend_inline">
        <el-button v-if="element_type === 'button'" @click="dialogVisible=true" type="info" size="large">{{ $t(btn_text) }}</el-button>
        <el-dialog
            top="60px"
            @before-close="resetData()"
            :append-to-body="true"
            v-model="dialogVisible"
            :width="has_pro ? '36%' : '50%'"
        >
            <template #header>
                <h4>{{$t('Choose Email Notification')}}</h4>
            </template>

            <div v-if="has_pro" class="mt-4">
                <el-form ref="form" :model="form" label-position="top">
                    <el-form-item class="ff-form-item" :label="$t('Notification')">
                        <el-select class="w-100" :placeholder="$t('Select Notification')" v-model="form.selected_notification_id">
                            <el-option
                                v-for="notification in notifications" 
                                :value="notification.id"
                                :label="notification.name" 
                                :key="notification.id">
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item class="ff-form-item" :label="$t('Send To')">
                        <el-radio-group v-model="form.send_to_type" class="el-radio-group-info">
                            <el-radio-button value="default">{{ $t('Default Recipient') }}</el-radio-button>
                            <el-radio-button value="custom">{{ $t('Custom Recipient') }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <template v-if="form.send_to_type === 'custom'">
                        <el-form-item class="ff-form-item" :label="$t('Recipient')">
                            <el-input 
                                v-model="form.send_to_custom_email"
                                :placeholder="$t('Please Type Recipient Email Address')"/>
                        </el-form-item>
                    </template>
                </el-form>
                <div v-if="error_message" v-html="error_message" class="ff-error"></div>
                <div v-if="success_message" v-html="success_message" class="ff-success"></div>
                <div class="dialog-footer mt-5">
                    <btn-group class="ff_btn_group_half">
                        <btn-group-item>
                            <el-button @click="dialogVisible = false" type="info" class="el-button--soft">{{ $t('Cancel') }}</el-button>
                        </btn-group-item>
                        <btn-group-item>
                            <el-button v-loading="sending" :disabled="!isActive" type="primary" @click="send()">{{ $t('Resend this notification') }}</el-button>
                        </btn-group-item>
                    </btn-group>
                </div>
            </div>

            <notice class="ff_alert_between mt-4" type="danger-soft" v-else>
                <div>
                    <h6 class="title">{{$t('This is a Pro Feature')}}</h6> 
                    <p class="text">{{$t('Please upgrade to pro to unlock this feature.')}}</p>
                </div>
                <a target="_blank" :href="upgrade_url" class="el-button el-button--danger el-button--small">
                    {{$t('Upgrade to Pro')}}
                </a>
            </notice>
        </el-dialog>
    </div>
</template>
<script>
    import Notice from '@/admin/components/Notice/Notice.vue';
    import BtnGroup from '@/admin/components/BtnGroup/BtnGroup.vue';
    import BtnGroupItem from '@/admin/components/BtnGroup/BtnGroupItem.vue';

    export default {
        name: 'resentEmailNotification',
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
                    return 'Resend Email Notification'
                }
            }
        },
        components: {
            Notice,
            BtnGroup,
            BtnGroupItem
        },
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
                notifications: window.fluent_form_entries_vars.email_notifications,
                upgrade_url: window.fluent_form_entries_vars.upgrade_url
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
                    entry_ids: this.entry_ids,
                    send_to_type: this.form.send_to_type,
                    send_to_custom_email: this.form.send_to_custom_email,
                    ff_sumulate: 'fluentform_submit'
                };
                FluentFormsGlobal.$post(data)
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
                            alert(this.$t('Looks like you are using older version of fluent forms pro. Please update to latest version'));
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

<template>
    <div 
        v-loading="loading" 
        :element-loading-text="$t('Loading Settings...')"
        element-loading-spinner="el-icon-loading"
    >
        <div class="ff_global_setting_option_form_wrap" v-if="app_ready">
            <layout 
                :email_report="email_report" 
                :integration_failure_notification="integration_failure_notification" 
                :data="formSettings" 
                :file_upload_optoins="file_upload_optoins"
                :captcha_status="captcha_status"
            />
        </div>

        <div class="mt-4">
            <el-button type="primary" icon="el-icon-success" @click="save">{{ $t('Save Settings') }}</el-button>
        </div>
    </div>
</template>

<script type="text/babel">
    import Layout from '../components/settings/FormSettings/Layout.vue';

    export default {
        name: "GlobalSettings",
        components: {
            Layout
        },
        data() {
            return {
                loading: true,
                app_ready: false,
                formSettings: {
                    layout: {
                        labelPlacement: 'top',
                        helpMessagePlacement: 'with_label',
                        errorMessagePlacement: 'inline'
                    },
                    misc: {
                        isIpLogingDisabled: false,
                        file_upload_locations: '',
                    },
                },
                email_report: {},
                integration_failure_notification: {},
                file_upload_optoins: [],
                captcha_status: {
                    'hcaptcha': false,
                    'recaptcha': false,
                    'turnstile': false
                },
            }
        },
        methods: {
            fetch() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform-global-settings',
                    key: [
                        '_fluentform_global_form_settings',
                        '_fluentform_email_report_summary',
                        '_fluentform_failed_integration_notification',
                        '_fluentform_reCaptcha_keys_status',
                        '_fluentform_hCaptcha_keys_status',
                        '_fluentform_turnstile_keys_status'
                    ]
                })
                .then(response => {
                    this.loading = false;
                    let settings = response.data._fluentform_global_form_settings || {};
                    if (!settings.layout) {
                        settings.layout = {
                            labelPlacement: 'top',
                            helpMessagePlacement: 'with_label',
                            errorMessagePlacement: 'inline'
                        };
                    }
                    this.formSettings = Object.assign(this.formSettings, settings);
                    let emailReport = response.data._fluentform_email_report_summary;
                    if(!emailReport) {
                        emailReport = {
                            status: 'yes',
                            send_to_type: 'admin_email',
                            custom_recipients: '',
                            sending_day: 'Mon'
                        };
                    }
                    this.email_report = emailReport;
                    let failedNotification = response.data._fluentform_failed_integration_notification;
                    if (!failedNotification) {
                        failedNotification = {
                            status: 'no',
                            send_to_type: 'admin_email',
                            custom_recipients: '',
                        };
                    }
                    this.integration_failure_notification = failedNotification;
                    this.file_upload_optoins = response.data.file_upload_optoins;
                    this.captcha_status = {
                        hcaptcha: response.data._fluentform_hCaptcha_keys_status,
                        recaptcha: response.data._fluentform_reCaptcha_keys_status,
                        turnstile: response.data._fluentform_turnstile_keys_status
                    }
                })
                .fail(e => {
                    this.loading = false;
                })
                .always(() => {
                    this.app_ready = true;
                });
            },
            save() {
                this.loading = true;
                let data = {
                    key: 'SaveGlobalLayoutSettings',
                    value: JSON.stringify(this.formSettings),
                    action: 'fluentform-global-settings-store'
                };

                FluentFormsGlobal.$post(data)
                .done(response => {
                    if (response) {
                        this.loading = false;
                        this.$success(response.data.message);
                    }
                })
                .fail(e => {
                    this.loading = false;

                    this.formSettings.id = id;
                });

                this.saveEmailSummarySettings();
                this.saveFailedIntegrationNotification();
            },
            saveEmailSummarySettings() {
                let data = {
                    key: 'EmailSummarySettings',
                    value: JSON.stringify(this.email_report),
                    action: 'fluentform-global-settings-store'
                };
                FluentFormsGlobal.$post(data)
                .done(response => {

                });
            },
            saveFailedIntegrationNotification() {
                let data = {
                    value: JSON.stringify(this.integration_failure_notification),
                    action: 'fluentform-global-settings-store',
                    key: 'failedIntegrationNotification',
    
                };
                FluentFormsGlobal.$post(data)
                .done(response => {
            
                });
            }
        },
        mounted() {
            this.fetch();
            jQuery('body').addClass('ff_footer_none');
        }
    };
</script>

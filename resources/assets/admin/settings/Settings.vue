<template>
    <div v-loading="loading">
        <!--Save settings-->
        <el-row class="setting_header">
            <el-col :md="18">
                <h2>
                    Global Layout Settings
                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Error Message Placement</h3>
                            <p>These Settings will be used as default settings of a new form.<br/>You can customize
                                layout settings for each page from form's settings page</p>
                        </div>
                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </h2>
            </el-col>
            <el-col :md="6" class="action-buttons clearfix mb15">
                <el-button size="medium" class="pull-right" type="success" icon="el-icon-success" @click="save"
                >Save Settings
                </el-button>
            </el-col>
        </el-row>

        <!--Different form settings section-->
        <el-row style="margin-bottom: 50px;">
            <el-col v-if="app_ready" :md="24">
                <layout :email_report="email_report" :data="formSettings"></layout>
            </el-col>
        </el-row>

        <!--Save settings-->
        <el-row>
            <el-col class="action-buttons clearfix mb15">
                <el-button size="medium" class="pull-right" type="success" icon="el-icon-success" @click="save"
                >Save Settings
                </el-button>
            </el-col>
        </el-row>
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
                    },
                },
                email_report: {}
            }
        },
        methods: {
            fetch() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform-global-settings',
                    key: [
                        '_fluentform_global_form_settings',
                        '_fluentform_email_report_summary'
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
                            this.$notify.success({
                                title: 'Great',
                                message: response.data.message,
                                offset: 30
                            });
                        }
                    })
                    .fail(e => {
                        this.loading = false;

                        this.formSettings.id = id;
                    });

                this.saveEmailSummarySettings();
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
            }
        },
        mounted() {
            this.fetch();
        }
    };
</script>

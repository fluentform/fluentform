<template>
    <el-form ref="form-layout" label-width="205px" label-position="left">
        <!--Label Placement-->
        <el-form-item>
            <template slot="label">
                Label placement

                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <div slot="content">
                        <h3>Form Label Placement</h3>
                        <p>
                            Select the default label placement. Labels can <br>
                            be top aligned above a field, left aligned to the <br>
                            left of a field, or right aligned to the right of a <br>
                            field. This is a global label placement setting.
                        </p>
                    </div>

                    <i class="el-icon-info el-text-info"></i>
                </el-tooltip>
            </template>

            <el-select v-model="layout.labelPlacement">
                <el-option v-for="(label, value) in labelPlacementOptions" :key="value"
                           :label="label" :value="value"
                ></el-option>
            </el-select>
        </el-form-item>

        <!-- Help message placement -->
        <el-form-item>
            <template slot="label">
                Help Message Placement
                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <div slot="content">
                        <h3>Help Message Placement</h3>

                        <p>
                            Where help message will be shown
                        </p>
                    </div>

                    <i class="el-icon-info el-text-info"></i>
                </el-tooltip>
            </template>

            <el-select v-model="layout.helpMessagePlacement">
                <el-option
                    v-for="(label, value) in {'with_label': 'Next to Label', 'under_input': 'Below Input Element'}"
                    :key="value"
                    :label="label" :value="value"
                ></el-option>
            </el-select>
        </el-form-item>

        <!-- Error message placement -->
        <el-form-item>
            <template slot="label">
                Error Message Placement

                <el-tooltip class="item" placement="bottom-start" effect="light">
                    <div slot="content">
                        <h3>Error Message Placement</h3>
                        <p>
                            Where form validation error messages will be shown
                        </p>
                    </div>
                    <i class="el-icon-info el-text-info"></i>
                </el-tooltip>
            </template>

            <el-select v-model="layout.errorMessagePlacement">
                <el-option
                    v-for="(label, value) in {'stackToBottom': 'Stack to Bottom', 'inline': 'Below Input Element'}"
                    :key="value"
                    :label="label" :value="value"
                ></el-option>
            </el-select>
        </el-form-item>

        <!-- Email Summaries-->
        <div class="ff_email_notification_settings">
            <el-row class="setting_header">
                <el-col :md="24">
                    <h2>Email Summaries</h2>
                    <p>Would you like to receive a weekly report showing how your forms are performing? Enable Email
                        Summaries option and you will get a report every week to the provided email address</p>
                </el-col>
            </el-row>
            <el-row style="margin-bottom: 50px;">
                <el-col :md="24">
                    <el-form-item>
                        <template slot="label">
                            Status
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <p>
                                        Determine, If you want to enable/disable email reporting. If enabled, you will
                                        get email summaries
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <el-checkbox true-label="yes" false-label="no" v-model="email_report.status"> Enable Email
                            Summaries Weekly Delivery
                        </el-checkbox>
                    </el-form-item>
                    <template v-if="email_report.status == 'yes'">
                        <el-form-item>
                            <template slot="label">
                                Send To
                                <el-tooltip class="item" placement="bottom-start" effect="light">
                                    <div slot="content">
                                        <p>
                                            Please specify who will get the email summary report
                                        </p>
                                    </div>
                                    <i class="el-icon-info el-text-info"></i>
                                </el-tooltip>
                            </template>
                            <el-radio-group v-model="email_report.send_to_type">
                                <el-radio label="admin_email">Site Admin</el-radio>
                                <el-radio label="custom_email">Custom Email</el-radio>
                            </el-radio-group>
                            <div v-if="email_report.send_to_type == 'custom_email'">
                                <label>Please recipient email address</label>
                                <el-input placeholder="Recipient Email Address"
                                          v-model="email_report.custom_recipients"></el-input>
                                <p>For Multiple please use comma separated values</p>
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <template slot="label">
                                Sending Day
                                <el-tooltip class="item" placement="bottom-start" effect="light">
                                    <div slot="content">
                                        <p>
                                            Select which day the email report will be sent
                                        </p>
                                    </div>
                                    <i class="el-icon-info el-text-info"></i>
                                </el-tooltip>
                            </template>
                            <el-select placeholder="Select Day" v-model="email_report.sending_day">
                                <el-option v-for="(sendDay,dayKey) in sending_days" :key="dayKey" :value="dayKey"
                                           :label="sendDay"></el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item>
                            <template slot="label">
                                Email Subject

                                <el-tooltip class="item" placement="bottom-start" effect="light">
                                    <div slot="content">
                                        <p>
                                            Enter the subject of the email summary
                                        </p>
                                    </div>

                                    <i class="el-icon-info el-text-info"></i>
                                </el-tooltip>
                            </template>

                            <el-input
                                placeholder="Email Subject"
                                v-model="email_report.subject"
                            />
                        </el-form-item>
                    </template>
                </el-col>
            </el-row>
        </div>

        <el-row class="setting_header">
            <el-col :md="18">
                <h2>
                    Miscellaneous
                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Customize Form Settings</h3>
                            <p>These Settings will be used as default settings of a new form where<br/>You can customize
                                many options globally, which will effect all forms.</p>
                        </div>
                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </h2>

            </el-col>
        </el-row>

        <el-row style="margin-bottom: 50px;">
            <el-col :md="24">
                <el-form-item>
                    <template slot="label">
                        Disable IP Logging

                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Disable IP Logging</h3>
                                <p>
                                    If this option is turned off then the IP address of the<br>
                                    user will be saved in the database with form data.
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>

                    <el-switch active-color="#13ce66" v-model="misc.isIpLogingDisabled"></el-switch>

                </el-form-item>

                <el-form-item>
                    <template slot="label">
                        Disable Form Analytics

                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Disable Form Analytics</h3>
                                <p>
                                    By Default, Fluent Forms track unique views and submissions to show form<br>
                                    metrics. You can disable it here.
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>

                    <el-switch active-color="#13ce66" v-model="misc.isAnalyticsDisabled"></el-switch>

                </el-form-item>

                <el-form-item>
                    <template slot="label">
                        Email Footer Text
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Email Footer Text</h3>
                                <p>
                                    By Default, Fluent Forms add your site title as email footer. You can add email
                                    footer text here. (HTML supported)
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>

                    <el-input
                        type="textarea"
                        :rows="3"
                        placeholder="Email Footer Text"
                        v-model="misc.email_footer_text">
                    </el-input>
                </el-form-item>

                <el-form-item>
                    <template slot="label">
                        Enable Honeypot Security

                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Honeypot Security</h3>
                                <p>
                                    If you enable this then Fluent Forms will verify honeypot security. Most of the
                                    time, bots will fail this test.
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>

                    <el-switch active-color="#13ce66" active-value="yes" inactive-value="no"
                               v-model="misc.honeypotStatus"></el-switch>
                    <p>Recommended settings: Enabled</p>
                </el-form-item>

                <template v-if="akismet_available">
                    <el-form-item>
                        <template slot="label">
                            Enable Akismet Integration
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Akismet Integration</h3>
                                    <p>
                                        If you enable this then Fluent Forms will verify the form submission with
                                        Akismet. It will save you from spam form submission.
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <el-switch active-color="#13ce66" active-value="yes" inactive-value="no"
                                   v-model="misc.akismet_status"></el-switch>
                        <p>Recommended settings: Enabled</p>
                    </el-form-item>

                    <el-form-item v-if="misc.akismet_status == 'yes'">
                        <template slot="label">
                            Spam Validation
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Spam Validation</h3>
                                    <p>
                                        Please select what will be happened once a submission marked as spam
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <el-radio-group v-model="misc.akismet_validation">
                            <el-radio label="mark_as_spam">Mark as Spam</el-radio>
                            <el-radio label="validation_failed">Make the form submission as failed</el-radio>
                        </el-radio-group>

                    </el-form-item>

                </template>

                <el-form-item>
                    <template slot="label">
                        Classic Editor Button
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Insert Button on Classic Editor</h3>
                                <p>
                                    If you enable this then Classic editor will have form inserter button
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>

                    <el-switch active-color="#13ce66" active-value="yes" inactive-value="no"
                               v-model="misc.classicEditorButton"></el-switch>
                </el-form-item>

                <el-form-item>
                    <template slot="label">
                        Enable No-Conflict Mode
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>No-Conflict Mode</h3>
                                <p>
                                    If you enable this, then fluent forms will try to prevent other plugin scripts from
                                    loading and remove the conflicts.
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>
                    <el-switch active-color="#13ce66" active-value="yes" inactive-value="no"
                               v-model="misc.noConflictStatus"></el-switch>
                    <p>Recommended settings: Enabled</p>
                </el-form-item>

                <el-form-item>
                    <template slot="label">
                        Enable Auto Tab-Index
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Auto Tab-Index</h3>
                                <p>
                                    If you enable this, then fluent forms will tabindex to form fields automatically.
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>
                    <el-switch active-color="#13ce66" active-value="yes" inactive-value="no"
                               v-model="misc.tabIndex"></el-switch>
                </el-form-item>

                <el-form-item v-if="hasPro">
                    <template slot="label">
                        Geo-Location provider
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Geo-Location provider</h3>
                                <p>
                                    If you use advanced phone field and enable auto country ditect then may configure this.
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>
                    <div class="ff_items_inline">
                        <el-select size="small" v-model="misc.geo_provider">
                            <el-option
                                v-for="(provider, providerUrl) in geo_providers"
                                :key="providerUrl" :value="providerUrl"
                                :label="provider.label"></el-option>
                        </el-select>
                        <template v-if="misc.geo_provider && geo_providers[misc.geo_provider].has_token">
                            <el-input type="password" size="small" placeholder="GEO API Token" v-model="misc.geo_provider_token"></el-input>
                            <p>{{geo_providers[misc.geo_provider].token_instruction}}</p>
                        </template>
                    </div>
                </el-form-item>

            </el-col>
        </el-row>
    </el-form>
</template>

<script type="text/babel">
    export default {
        name: 'FormLayout',
        props: {
            data: {
                required: true
            },
            email_report: {
                required: true
            }
        },
        data() {
            return {
                labelPlacementOptions: {
                    'top': 'Top aligned',
                    'left': 'Left aligned',
                    'right': 'Right aligned'
                },
                helpMessagePlacementOptions: {
                    'with_label': 'Beside Label as Tooltip',
                    'under_input': 'Below Input Box'
                },
                errorMessagesPlacement: {
                    'inline': 'Show error messages after each input',
                    'stackToBottom': 'Show all error messages after submit button as stack'
                },
                akismet_available: window.FluentFormApp.akismet_activated,
                layout: {},
                misc: {},
                sending_days: {
                    Mon: 'Monday',
                    Tue: 'Tuesday',
                    Wed: 'Wednesday',
                    Thu: 'Thursday',
                    Fri: 'Friday',
                    Sat: 'Saturday',
                    Sun: 'Sunday'
                },
                geo_providers: {
                    'ipinfo.io': {
                        label: 'ipinfo.io',
                        has_token: true,
                        token_instruction: 'If you have much more visitor for your phone field form then you may add an API token. It will work even if you do not use a token'
                    }
                },
                hasPro: !!window.FluentFormApp.has_pro
            }
        },
        mounted() {
            this.layout = this.data.layout;

            if (!this.data.misc.akismet_validation) {
                this.$set(this.data.misc, 'akismet_validation', 'mark_as_spam');
            }

            if(!this.data.misc.geo_provider) {
                this.$set(this.data.misc, 'geo_provider', 'ipinfo.io');
            }

            this.misc = this.data.misc;
        }
    }
</script>


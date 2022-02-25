<template>
    <div>
        <el-row class="setting_header">
            <el-col :md="24">
                <h2>Google reCAPTCHA Settings</h2>

                <p>
                    Fluent Forms integrates with reCAPTCHA, a free service that protects your website from spam and
                    abuse. Please note, these settings are required only if you decide to use the reCAPTCHA field.

                    <a href="http://www.google.com/recaptcha/" target="_blank">
                        Read more about reCAPTCHA.
                    </a>
                </p>
                <p><b>Please generate API key and API secret using reCAPTCHA</b></p>
            </el-col>
        </el-row>


        <div class="section-body">
            <el-form label-width="205px" label-position="left">

                <!--Site key-->
                <el-form-item>
                    <template slot="label">
                        reCAPTCHA Version
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <p>
                                    Please select which reCAPTCHA version you would like to use
                                </p>
                            </div>

                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>

                    <el-radio-group @change="load" v-model="reCaptcha.api_version">
                        <el-radio label="v2_visible">Version 2 (Visible reCAPTCHA)</el-radio>
                        <el-radio label="v3_invisible">Version 3 (Invisible reCAPTCHA)</el-radio>
                    </el-radio-group>
                </el-form-item>

                <!--Site key-->
                <el-form-item>
                    <template slot="label">
                        Site Key
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>reCAPTCHA Site Key</h3>
                                <p>
                                    Enter your reCAPTCHA Site Key, if you do not have <br>
                                    a key you can register for one at the provided link. <br>
                                    reCAPTCHA is a free service.
                                </p>
                            </div>

                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>

                    <el-input v-model="reCaptcha.siteKey" @change="load"></el-input>
                </el-form-item>

                <!--Secret key-->
                <el-form-item>
                    <template slot="label">
                        Secret Key
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>reCAPTCHA Secret Key</h3>

                                <p>
                                    Enter your reCAPTCHA Secret Key, if you do not have <br>
                                    a key you can register for one at the provided link. <br>
                                    reCAPTCHA is a free service.
                                </p>
                            </div>

                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>

                    <el-input type="password" v-model="reCaptcha.secretKey" @change="load"></el-input>
                </el-form-item>

                <!--Validate Keys-->
                <el-form-item :class="hidden">
                    <template slot="label" v-if="v2">
                        Validate Keys
                    </template>

                    <div
                        id="reCaptcha" 
                        :data-sitekey="reCaptcha.siteKey"
                        :data-size="size"
                    />
                </el-form-item>

                <el-form-item>
                    <el-button
                        type="danger"
                        icon="el-icon-delete"
                        size="medium"
                        @click="clearSettings"
                        :loading="clearing"
                    >Clear Settings
                    </el-button>

                    <el-button
                        type="success"
                        icon="el-icon-success"
                        size="medium"
                        @click="save"
                        :disabled="disabled"
                        :loading="saving"
                    >Save Settings
                    </el-button>
                </el-form-item>
            </el-form>

            <div v-if="reCaptcha_status && !disabled">
                <p>Your reCAPTCHA is valid</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "reCaptcha",
    props: ['app'],
    data() {
        return {
            reCaptcha: {
                siteKey: '',
                secretKey: '',
            },
            reCaptcha_status: false,
            siteKeyChanged: false,
            disabled: false,
            saving: false,
            clearing: false
        }
    },

    computed: {
        v2() {
            return this.reCaptcha.api_version === 'v2_visible';
        },

        size() {
            return this.v2 ? 'normal' : 'invisible';
        },

        hidden() {
            return this.v2 ? '' : 'mb0';
        }
    },

    methods: {
        load() {
            if (!this.validate()) {
                this.disabled = false;
                this.siteKeyChanged = false;
                return;
            } else {
                this.disabled = true;
                this.siteKeyChanged = true;
                this.reCaptcha_status = false;
            }

            this.$nextTick(() => {
                let id = 'reCaptcha';
                let siteKey = this.reCaptcha.siteKey;
                let $reCaptcha = jQuery('#' + id);
                $reCaptcha.html('');

                window.___grecaptcha_cfg.clients = {};

                let widgetID = grecaptcha.render(id, {
                        'sitekey': siteKey,
                        'callback': (token) => {
                            this.reCaptcha.token = token;
                            this.disabled = false;
                        }
                    });

                if (this.reCaptcha.api_version != 'v2_visible') {
                    grecaptcha.execute(widgetID, {action: 'submit'})
                        .then((token) => {
                            this.reCaptcha.token = token;
                            this.disabled = false;
                        });
                }
            })
        },
        save() {
            if (!this.validate()) {
                return this.$notify.error({
                    title: 'Error!',
                    message: 'Missing required fields.',
                    offset: 30
                });
            }
            this.saving = true;

            FluentFormsGlobal.$post({
                action: 'fluentform-global-settings-store',
                key: 'reCaptcha',
                reCaptcha: this.reCaptcha
            }).then(response => {
                this.reCaptcha_status = response.data.status;
                this.$notify.success({
                    title: 'Success!',
                    message: response.data.message,
                    offset: 30
                });
            })
                .fail(error => {
                    this.reCaptcha_status = parseInt(error.responseJSON.data.status, 10);
                    let title = this.reCaptcha_status === 1 ? 'Warning!' : 'Error!';
                    let method = this.reCaptcha_status === 1 ? 'warning' : 'error';
                    this.$notify[method]({
                        title: title,
                        message: error.responseJSON.data.message,
                        offset: 30
                    });
                }).always(r => {
                this.saving = false;
            });
        },
        clearSettings() {
            this.clearing = true;
            FluentFormsGlobal.$post({
                action: 'fluentform-global-settings-store',
                key: 'reCaptcha',
                reCaptcha: 'clear-settings'
            }).then(response => {
                this.reCaptcha_status = response.data.status;
                this.reCaptcha = {siteKey: '', secretKey: ''};
                this.$notify.success({
                    title: 'Success!',
                    message: response.data.message,
                    offset: 30
                });
            })
                .fail(error => {
                    this.reCaptcha_status = error.responseJSON.data.status;
                    this.$notify.error({
                        title: 'Oops!',
                        message: 'Something went wrong.',
                        offset: 30
                    });
                }).always(r => {
                this.clearing = false;
            });
        },
        validate() {
            return !!(this.reCaptcha.siteKey && this.reCaptcha.secretKey);
        },
        getReCaptchaSettings() {
            FluentFormsGlobal.$get({
                action: 'fluentform-global-settings',
                key: [
                    '_fluentform_reCaptcha_details',
                    '_fluentform_reCaptcha_keys_status'
                ]
            })
                .then(response => {
                    const recaptcha = response.data._fluentform_reCaptcha_details || {siteKey: '', secretKey: ''};
                    if (!recaptcha.api_version) {
                        recaptcha.api_version = 'v2_visible';
                    }
                    this.reCaptcha = recaptcha;
                    this.reCaptcha_status = response.data._fluentform_reCaptcha_keys_status;

                });
        }
    },
    mounted() {
        this.getReCaptchaSettings();
    },
    created() {
        let recaptchaScript = document.createElement('script');

        recaptchaScript.setAttribute('src', 'https://www.google.com/recaptcha/api.js');

        document.body.appendChild(recaptchaScript);
    },
}
</script>

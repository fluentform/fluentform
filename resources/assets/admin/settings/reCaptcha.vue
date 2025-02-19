<template>
    <div class="ff_recaptcha_wrap">
        <el-form label-position="top">
            <card>
                <card-head>
                    <h5 class="title">{{ $t('Google reCAPTCHA Settings') }}</h5>
                    <p class="text">
                        {{$t('Fluent Forms integrates with reCAPTCHA, a free service that protects your website from spam and abuse. Please note, these settings are required only if you decide to use the reCAPTCHA field.')}} 
                        <a href="http://www.google.com/recaptcha/" target="_blank">
                            {{ $t('Read more about reCAPTCHA.') }}
                        </a>
                    </p>
                    <p class="text"><b>{{ $t('Please generate API key and API secret using reCAPTCHA') }}</b></p>
                </card-head>
                <card-body>
                     <!--Site key-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('reCAPTCHA Version') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Please select which reCAPTCHA version you would like to use') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-radio-group @change="load" v-model="reCaptcha.api_version">
                            <el-radio label="v2_visible">{{ $t('Version 2 (Visible reCAPTCHA)') }}</el-radio>
                            <el-radio label="v3_invisible">{{ $t('Version 3 (Invisible reCAPTCHA)') }}</el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <!--Site key-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Site Key') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Enter your reCAPTCHA Site Key, if you do not have a key you can register for one at the provided link. reCAPTCHA is a free service.') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-input v-model="reCaptcha.siteKey" @change="load"></el-input>
                    </el-form-item>

                    <!--Secret key-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Secret Key') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Enter your reCAPTCHA Secret Key, if you do not have a key you can register for one at the provided link, reCAPTCHA is a free service.') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-input type="password" v-model="reCaptcha.secretKey" @change="load"></el-input>
                    </el-form-item>

                    <!--Validate Keys-->
                    <el-form-item :class="hidden">
                        <template slot="label" v-if="v2">
                            {{ $t('Validate Keys') }}
                        </template>

                        <div
                            id="reCaptcha" 
                            :data-sitekey="reCaptcha.siteKey"
                            :data-size="size"
                        />
                    </el-form-item>
                    <notice v-if="reCaptcha_status && !disabled" size="sm" type="success-soft">
                        <p>{{ $t('Your reCAPTCHA is valid') }}</p>
                    </notice>
                </card-body>
            </card>


            <div class="mt-4">
                <el-button
                    type="primary"
                    icon="el-icon-success"
                    @click="save"
                    :disabled="disabled"
                    :loading="saving"
                >{{ $t('Save Settings') }}
                </el-button>
                
                 <el-button
                    type="danger"
                    icon="ff-icon ff-icon-trash"
                    @click="clearSettings"
                    :loading="clearing"
                >{{ $t('Clear Settings') }}
                </el-button>
            </div>
        </el-form>
    </div>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import Notice from '@/admin/components/Notice/Notice.vue';

export default {
    components: { 
        Card, 
        CardHead, 
        CardBody,
        Notice
    },
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
            return this.v2 ? '' : 'mb-0';
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
                return this.$fail(this.$t('Missing required fields.'));
            }
            this.saving = true;

            const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');
            let data = {
                key: 'reCaptcha',
                reCaptcha: this.reCaptcha
            };

            FluentFormsGlobal.$rest.post(url, data)
                .then(response => {
                    this.reCaptcha_status = response.status;
                    if (this.reCaptcha_status == 1) {
                        this.$success(response.message);
                    } else {
                        this.$fail(response.message);
                    }
                })
                .catch(error => {
                    this.reCaptcha_status = parseInt(error.status, 10);
                    this.$fail(error.message);
                })
                .finally(r => {
                    this.saving = false;
                });
        },
        clearSettings() {
            this.clearing = true;
            const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');
            let data = {
                key: 'reCaptcha',
                reCaptcha: 'clear-settings'
            };
            FluentFormsGlobal.$rest.post(url, data)
                .then(response => {
                    this.reCaptcha_status = response.status;
                    this.reCaptcha = {siteKey: '', secretKey: ''};
                    if (this.reCaptcha_status == 1) {
                        this.$success(response.message);
                    } else {
                        this.$fail(response.message);
                    }
                })
                .catch(error => {
                    this.reCaptcha_status = error.status;
                    this.$fail(this.$t('Something went wrong.'));
                })
                .finally(r => {
                    this.clearing = false;
                });
        },
        validate() {
            return !!(this.reCaptcha.siteKey && this.reCaptcha.secretKey);
        },
        getReCaptchaSettings() {
            const url = FluentFormsGlobal.$rest.route('getGlobalSettings');
            let data = {
                key: [
                    '_fluentform_reCaptcha_details',
                    '_fluentform_reCaptcha_keys_status'
                ]
            };
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    const recaptcha = response._fluentform_reCaptcha_details || {siteKey: '', secretKey: ''};
                    if (!recaptcha.api_version) {
                        recaptcha.api_version = 'v2_visible';
                    }
                    this.reCaptcha = recaptcha;
                    this.reCaptcha_status = response._fluentform_reCaptcha_keys_status;
                })
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

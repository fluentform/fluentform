<template>
    <div class="ff_recaptcha_wrap">
        <el-form>
            <div class="ff_card">
                <div class="ff_card_head">
                    <h5 class="title">{{ $t('Google reCAPTCHA Settings') }}</h5>
                    <p class="text">
                        {{$t('Fluent Forms integrates with reCAPTCHA, a free service that protects your website from spam and abuse. Please note, these settings are required only if you decide to use the reCAPTCHA field.')}} 
                        <a href="http://www.google.com/recaptcha/" target="_blank">
                            {{ $t('Read more about reCAPTCHA.') }}
                        </a>
                    </p>
                    <p class="text"><b>{{ $t('Please generate API key and API secret using reCAPTCHA') }}</b></p>
                </div><!-- .ff_card_head  -->
                <div class="ff_card_body">
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title"> {{ $t('reCAPTCHA Version') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Please select which reCAPTCHA version you would like to use') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-radio-group @change="load" v-model="reCaptcha.api_version">
                                <el-radio label="v2_visible">{{ $t('Version 2 (Visible reCAPTCHA)') }}</el-radio>
                                <el-radio label="v3_invisible">{{ $t('Version 3 (Invisible reCAPTCHA)') }}</el-radio>
                            </el-radio-group>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Site Key') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Enter your reCAPTCHA Site Key, if you do not have a key you can register for one at the provided link. reCAPTCHA is a free service.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-input v-model="reCaptcha.siteKey" @change="load"></el-input>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title"> {{ $t('Secret Key') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Enter your reCAPTCHA Secret Key, if you do not have a key you can register for one at the provided link. reCAPTCHA is a free service.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-input type="password" v-model="reCaptcha.secretKey" @change="load"></el-input>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3" v-if="v2">
                            <h6 class="ff_block_title">{{ $t('Validate Keys') }}</h6>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <div id="reCaptcha" :data-sitekey="reCaptcha.siteKey" :data-size="size"/>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                </div><!-- .ff_card_body -->
            </div><!-- .ff_card -->

            <div class="mt-4">
                <el-button
                    type="danger"
                    icon="el-icon-delete"
                    @click="clearSettings"
                    :loading="clearing"
                >{{ $t('Clear Settings') }}
                </el-button>

                <el-button
                    type="primary"
                    icon="el-icon-success"
                    @click="save"
                    :disabled="disabled"
                    :loading="saving"
                >{{ $t('Save Settings') }}
                </el-button>
            </div>
        </el-form>

        <div v-if="reCaptcha_status && !disabled">
            <p>{{ $t('Your reCAPTCHA is valid') }}</p>
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

            FluentFormsGlobal.$post({
                action: 'fluentform-global-settings-store',
                key: 'reCaptcha',
                reCaptcha: this.reCaptcha
            }).then(response => {
                this.reCaptcha_status = response.data.status;
                this.$success(response.data.message);
            })
                .fail(error => {
                    this.reCaptcha_status = parseInt(error.responseJSON.data.status, 10);
                    let method = this.reCaptcha_status === 1 ? '$warning' : '$fail';
                    this[method](error.responseJSON.data.message);
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
                this.$success(response.data.message);
            })
                .fail(error => {
                    this.reCaptcha_status = error.responseJSON.data.status;
                    this.$fail(this.$t('Something went wrong.'));
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

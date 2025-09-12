<template>
    <div class="ff_friendlycaptcha_wrap">
        <el-form label-position="top">
            <card>
                <card-head>
                    <h5 class="title">{{ $t('Friendly Captcha Settings') }}</h5>
                        <p class="text">
                        {{
                            $t('Fluent Forms integrates with Friendly Captcha, a privacy-focused service that protects your website from spam and abuse without tracking users. Please note, these settings are required only if you decide to use the Friendly Captcha field.')
                        }}
                        <a href="https://friendlycaptcha.com/" target="_blank">
                            {{ $t('Read more about Friendly Captcha.') }}
                        </a>
                    </p>
                    <p class="text"><b>{{ $t('Please generate Site Key and API Key using Friendly Captcha Dashboard') }}</b></p>
                </card-head>
                <card-body>
                    <!--Site key-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Site Key') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Enter your Friendly Captcha Site Key, if you do not have a key you can register for one at the provided link. Friendly Captcha offers a free tier.') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-input v-model="friendlyCaptcha.siteKey" @change="load"></el-input>
                    </el-form-item>

                    <!--API key-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('API Key') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Enter your Friendly Captcha API Key, if you do not have a key you can register for one at the provided link.') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-input type="password" v-model="friendlyCaptcha.apiKey" @change="load"></el-input>
                    </el-form-item>

                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Start Mode') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('You can select when the captcha should start solving') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-radio class="mr-3" v-model="friendlyCaptcha.start_mode" label="auto">{{$t('Auto')}}</el-radio>
                        <el-radio class="mr-3" v-model="friendlyCaptcha.start_mode" label="focus">{{$t('Focus')}}</el-radio>
                        <el-radio class="mr-3" v-model="friendlyCaptcha.start_mode" label="none">{{$t('Manual')}}</el-radio>
                    </el-form-item>

                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Theme') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Choose a theme for the field') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-radio v-model="friendlyCaptcha.theme" label="auto">{{ $t('Auto') }}</el-radio>
                        <el-radio v-model="friendlyCaptcha.theme" label="light">{{ $t('Light') }}</el-radio>
                        <el-radio v-model="friendlyCaptcha.theme" label="dark">{{ $t('Dark') }}</el-radio>
                    </el-form-item>

                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('API Endpoint') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Choose the API endpoint region. Use EU for GDPR compliance.') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-radio v-model="friendlyCaptcha.api_endpoint" label="global">{{ $t('Global') }}</el-radio>
                        <el-radio v-model="friendlyCaptcha.api_endpoint" label="eu">{{ $t('EU Only') }}</el-radio>
                    </el-form-item>

                    <notice v-if="friendlyCaptcha_status" size="sm" type="success-soft">
                        <p>{{ $t('Your Friendly Captcha is valid') }}</p>
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
// Cache buster: v2024-01-15-fix
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
    name: "friendlycaptcha",
    props: ["app"],
    data() {
        return {
            friendlyCaptcha: {
                siteKey: "",
                apiKey: "",
                theme: 'auto',
                start_mode: 'focus',
                api_endpoint: 'global',
                token: ""
            },
            friendlyCaptcha_status: false,
            siteKeyChanged: false,
            disabled: false,
            saving: false,
            clearing: false,

        };
    },
    methods: {
        load() {
            if (!this.validate()) {
                this.disabled = false;
                this.siteKeyChanged = false;
                return;
            } else {
                this.disabled = false;
                this.siteKeyChanged = true;
                this.friendlyCaptcha_status = false;
            }
        },
        save() {
            if (!this.validate()) {
                this.$fail(this.$t('Missing required fields.'));
                return;
            }
            this.saving = true;

            const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');
            let data = {
                key: 'friendlyCaptcha',
                friendlycaptcha: this.friendlyCaptcha
            }

            FluentFormsGlobal.$rest.post(url, data)
                .then(response => {
                    this.friendlyCaptcha_status = response.status;
                    if (this.friendlyCaptcha_status == 1) {
                        this.$success(response.message);
                    } else {
                        this.$fail(response.message);
                    }
                    this.siteKeyChanged = false;
                    this.friendlyCaptcha.token = null;
                })
                .catch(error => {
                    this.friendlyCaptcha_status = error.status ? parseInt(error.status, 10) : 0;
                    this.$fail(error.message || this.$t('Something went wrong. Please try again.'));
                })
                .finally(() => {
                    this.saving = false;
                });
        },
        clearSettings() {
            this.clearing = true;

            const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');
            let data = {
                key: 'friendlycaptcha',
                friendlycaptcha: 'clear-settings'
            }

            FluentFormsGlobal.$rest.post(url, data)
                .then(response => {
                    this.friendlyCaptcha_status = response.status;
                    this.friendlyCaptcha = {siteKey: '', apiKey: '', theme: 'auto', start_mode: 'focus', api_endpoint: 'global', token: ''};
                    if (this.friendlyCaptcha_status == 1) {
                        this.$success(response.message);
                    } else {
                        this.$fail(response.message);
                    }
                })
                .catch(error => {
                    this.friendlyCaptcha_status = error.status ? parseInt(error.status, 10) : 0;
                    this.$fail(this.$t('Something went wrong.'));
                })
                .finally(() => {
                    this.clearing = false;
                });
        },
        validate() {
            return !!(this.friendlyCaptcha.siteKey && this.friendlyCaptcha.apiKey);
        },
        getFriendlyCaptchaSettings() {
            const url = FluentFormsGlobal.$rest.route('getGlobalSettings');
            let data = {
                key: [
                    '_fluentform_friendlycaptcha_details',
                    '_fluentform_friendlycaptcha_keys_status'
                ]
            }

            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    const friendlyCaptcha = response._fluentform_friendlycaptcha_details;
                    if (friendlyCaptcha && typeof friendlyCaptcha === 'object') {
                        this.friendlyCaptcha = {
                            siteKey: friendlyCaptcha.siteKey || '',
                            apiKey: friendlyCaptcha.apiKey || '',
                            theme: friendlyCaptcha.theme || 'auto',
                            start_mode: friendlyCaptcha.start_mode || 'focus',
                            api_endpoint: friendlyCaptcha.api_endpoint || 'global',
                            token: ''
                        };
                    }
                    this.friendlyCaptcha_status = response._fluentform_friendlycaptcha_keys_status;
                });
        }
    },
    mounted() {
        this.getFriendlyCaptchaSettings();
    },
    created() {
        // No SDK loading needed for backend validation approach
    },
};
</script>

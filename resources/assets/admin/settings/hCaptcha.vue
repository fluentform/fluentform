<template>
    <div class="ff_hcaptcha_wrap">
        <el-form label-position="top">
            <card>
                <card-head>
                    <h5 class="title">{{ $t('hCaptcha Settings') }}</h5>
                    <p class="text">
                        {{ $t('Fluent Forms integrates with hCaptcha, a free service that protects your website from spam and abuse. Please note, these settings are required only if you decide to use the hCaptcha field.') }}
                        <a href="https://www.hcaptcha.com/" target="_blank">
                            {{ $t('Read more about hCaptcha.') }}
                        </a>
                    </p>
                    <p class="text"><b>{{ $t('Please generate API key and API secret using hCaptcha') }}</b></p>
                </card-head>
                <card-body>
                    <!--Site key-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Site Key') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{
                                            $t('Enter your hCaptcha Site Key, if you do not have a key you can register for one at the provided link,  hCaptcha is a free service.')
                                        }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-input v-model="hCaptcha.siteKey" @change="load"></el-input>
                    </el-form-item>

                    <!--Secret key-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Secret Key') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{
                                            $t('Enter your hCaptcha Secret Key, if you do not have a key you can register for one at the provided link. hCaptcha is a free service.')
                                        }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-input type="password" v-model="hCaptcha.secretKey" @change="load"></el-input>
                    </el-form-item>

                    <!--Validate Keys-->
                    <el-form-item :label="$t('Validate Keys')" v-if="siteKeyChanged">
                        <div class="h-captcha" id="hCaptcha" :data-sitekey="hCaptcha.siteKey"></div>
                    </el-form-item>
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
        <div v-if="hCaptcha_status">
            <p>{{ $t('Your hCaptcha is valid') }}</p>
        </div>
    </div>
</template>

<script>
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';

    export default {

        components: {
            Card,
            CardHead,
            CardBody
        },
        name: "hCaptcha",
        props: ["app"],
        data() {
            return {
                hCaptcha: {
                    siteKey: "",
                    secretKey: "",
                },
                hCaptcha_status: false,
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
                    this.disabled = true;
                    this.siteKeyChanged = true;
                }

                this.$nextTick(() => {
                    let id = "hCaptcha";
                    let $hCaptcha = jQuery("#" + id);
                    let siteKey = this.hCaptcha.siteKey;
                    const self = this;
                    $hCaptcha.html("");
                    const widgetId = hcaptcha.render(id, {
                        sitekey: siteKey,
                    });
                    hcaptcha
                        .execute(widgetId, {async: true})
                        .then(function ({response, key}) {
                            self.hCaptcha.token = response;
                            self.disabled = false;
                        })
                        .catch(function (err) {
                            console.log(err);
                        });
                });
            },
            save() {
                if (!this.validate()) {
                    return this.$fail(this.$t('Missing required fields.'));
                }

                this.saving = true;
                const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');

                let data = {
                    key: "hCaptcha",
                    hCaptcha: this.hCaptcha,
                }

                FluentFormsGlobal.$rest.post(url, data)
                    .then((response) => {
                        this.hCaptcha_status = response.status;
                        this.$success(response.message);
                    })
                    .catch((error) => {
                        this.hCaptcha_status = parseInt(error.status, 10);
                        let method = this.hCaptcha_status === 1 ? "$warning" : "$error";
                        this[method](error.message);
                    })
                    .finally((r) => {
                        this.saving = false;
                    });
            },
            clearSettings() {
                this.clearing = true;
                const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');

                let data = {
                    key: "hCaptcha",
                    hCaptcha: "clear-settings",
                }

                FluentFormsGlobal.$rest.post(url, data)
                    .then((response) => {
                        this.hCaptcha_status = response.status;
                        this.hCaptcha = {siteKey: "", secretKey: ""};
                        this.$success(response.message);
                    })
                    .catch((error) => {
                        this.hCaptcha_status = error.status;
                        this.$fail(this.$t("Something went wrong."));
                    })
                    .finally((r) => {
                        this.clearing = false;
                    });
            },
            validate() {
                return !!(this.hCaptcha.siteKey && this.hCaptcha.secretKey);
            },
            getHCaptchaSettings() {
                const url = FluentFormsGlobal.$rest.route('getGlobalSettings');

                let data = {
                    key: [
                        "_fluentform_hCaptcha_details",
                        "_fluentform_hCaptcha_keys_status",
                    ],
                    hCaptcha: "clear-settings",
                }

                FluentFormsGlobal.$rest.get(url, data)
                    .then((response) => {
                        const hcaptcha = response._fluentform_hCaptcha_details || {
                            siteKey: "",
                            secretKey: "",
                        };
                        this.hCaptcha = hcaptcha;
                        this.hCaptcha_status = response._fluentform_hCaptcha_keys_status;
                    })
            },
        },
        mounted() {
            this.getHCaptchaSettings();
        },
        created() {
            let hCaptchaScript = document.createElement("script");

            hCaptchaScript.setAttribute("src", "https://js.hcaptcha.com/1/api.js");

            document.body.appendChild(hCaptchaScript);
        },
    };
</script>

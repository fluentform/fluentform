<template>
    <div class="ff_cleantalk_wrap">
        <el-form label-position="top">
            <card>
                <card-head>
                    <h5 class="title">{{ $t('CleanTalk Settings') }}</h5>
                    <p class="text">
                        {{
                            $t('Fluent Forms integrates with CleanTalk, a free service that protects your website from spam and abuse. Please note, these settings are required only if you decide to use this.')
                        }}
                        <a href="https://cleantalk.org/" target="_blank">
                            {{ $t('Read more about CleanTalk.') }}
                        </a>
                    </p>
                    <p class="text"><b>{{ $t('Please paste your CleanTalk access key here') }}</b></p>
                </card-head>
                <card-body>
                    <!--Site key-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Access Key') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Enter your CleanTalk access key, if you do not have a key you can register for one at the provided link as CleanTalk is a free service.') }}
                                    </p>
                                </div>


                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-input v-model="cleantalk.accessKey"></el-input>
                    </el-form-item>

                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('CleanTalk Services') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Check which CleanTalk service you want to use') }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-checkbox-group v-model="cleantalk.services">
                            <el-checkbox label="bot_prevention">{{ $t('Bot Prevention') }}</el-checkbox>
                            <el-checkbox label="spam_protection">{{ $t('Anti-spam Protection') }}</el-checkbox>
                        </el-checkbox-group>
                    </el-form-item>

                    <notice v-if="cleantalk_status && !disabled" size="sm" type="success-soft">
                        <p>{{ $t('Your CleanTalk is valid') }}</p>
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
    name: "cleantalk",
    props: ["app"],
    data() {
        return {
            cleantalk: {
                accessKey: "",
                services: [],
            },
            cleantalk_status: false,
            disabled: false,
            saving: false,
            clearing: false,
        };
    },
    methods: {
        save() {
            if (!this.validate()) {
                return this.$fail(this.$t('Missing required fields.'));
            }
            this.saving = true;

            const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');
            let data = {
                key: 'cleantalk',
                cleantalk: this.cleantalk
            }

            FluentFormsGlobal.$rest.post(url, data)
                .then(response => {
                    this.cleantalk_status = response.status;
                    this.$success(response.message);
                })
                .catch(error => {
                    this.cleantalk_status = parseInt(error.status, 10);
                    let method = this.cleantalk_status === 1 ? '$warning' : '$error';
                    this[method](error.message);
                })
                .finally(r => {
                    this.saving = false;
                });
        },
        clearSettings() {
            this.clearing = true;

            const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');
            let data = {
                key: 'cleantalk',
                cleantalk: 'clear-settings'
            }

            FluentFormsGlobal.$rest.post(url, data)
                .then(response => {
                    this.cleantalk_status = response.status;
                    this.cleantalk = {
                        accessKey: "",
                        services: []
                    };
                    this.$success(response.message);
                })
                .catch(error => {
                    this.cleantalk_status = error.status;
                    this.$fail(this.$t('Something went wrong.'));
                })
                .finally(r => {
                    this.clearing = false;
                });
        },
        validate() {
            return !!(this.cleantalk.accessKey);
        },
        getCleanTalkSettings() {
            const url = FluentFormsGlobal.$rest.route('getGlobalSettings');
            let data = {
                key: [
                    '_fluentform_cleantalk_details',
                    '_fluentform_cleantalk_keys_status'
                ]
            }

            FluentFormsGlobal.$rest.get(url, data)
                .then((response) => {
                    this.cleantalk = response._fluentform_cleantalk_details || {
                        accessKey: "",
                        services: ['bot_prevention', 'spam_protection'],
                    };
                    this.cleantalk_status = response._fluentform_cleantalk_keys_status;
                })
        }
    },
    mounted() {
        this.getCleanTalkSettings();
    },
};
</script>

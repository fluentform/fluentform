<template>
    <div class="ff_cleantalk_wrap">
        <el-form label-position="top">
            <card>
                <card-head>
                    <h5 class="title">{{ $t('CleanTalk Settings') }}</h5>
                    <p class="text">
                        {{ $t('Fluent Forms offers seamless integration with CleanTalk, a powerful anti-spam service designed to protect your website from spam submissions and bot attacks. To enable this feature, you\'ll need to configure the CleanTalk settings within Fluent Forms then it will work for all forms.') }}
                        <a href="https://cleantalk.org/help/introduction" target="_blank">
                            {{ $t('Read more about CleanTalk.') }}
                        </a>
                    </p>
                    <p class="text"><b>{{ $t('Please generate access key using CleanTalk') }}</b></p>
                </card-head>
                <card-body>
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Access Key') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p v-html="$t('Enter your access key from CleanTalk, if you do not have a key you can register for one at the provided %s.', '<a href=https://cleantalk.org/my/>link</a>')">
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-input type="password" v-model="cleantalk.accessKey"></el-input>
                    </el-form-item>

                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Spam Validation') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Please select what will be happened once a submission marked as spam') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>
                        <el-radio-group v-model="cleantalk.validation">
                            <el-radio class="mb-2" label="mark_as_spam">{{ $t('Mark as Spam') }}</el-radio>
                            <el-radio class="mb-2" label="validation_failed">{{ $t('Make the Form Submission as Failed') }}</el-radio>
                            <el-radio label="mark_as_spam_and_skip_processing">{{ $t('Mark as Spam and Skip Processing') }}</el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <notice v-if="cleantalk.status" size="sm" type="success-soft">
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
                status: false,
                accessKey: "",
                validation: ""
            },
            siteKeyChanged: false,
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
                key: "cleantalk",
                cleantalk: this.cleantalk,
            }

            FluentFormsGlobal.$rest.post(url, data)
                .then((response) => {
                    this.cleantalk.status = response.status;
                    if (response.status) {
                        this.$success(this.$t("Settings saved successfully."));
                    } else {
                        this.$fail(this.$t(response.message));
                    }
                })
                .catch((error) => {
                    this.cleantalk.status = false;
                    let method = this.cleantalk.status === 1 ? "$warning" : "$fail";
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
                key: "cleantalk",
                cleantalk: "clear-settings",
            }

            FluentFormsGlobal.$rest.post(url, data)
                .then((response) => {
                    this.cleantalk = {
                        accessKey: "", 
                        status: false,
                        validation: ""
                    };
                    this.$success(response.message);
                })
                .catch((error) => {
                    this.cleantalk.status = error.status;
                    this.$fail(this.$t("Something went wrong."));
                })
                .finally((r) => {
                    this.clearing = false;
                });
        },
        validate() {
            return !!(this.cleantalk.accessKey) && !!(this.cleantalk.validation);
        },
        getCleantalkSettings() {
            const url = FluentFormsGlobal.$rest.route('getGlobalSettings');

            let data = {
                key: "_fluentform_cleantalk_details",
            }

            FluentFormsGlobal.$rest.get(url, data)
                .then((response) => {
                    this.cleantalk = response._fluentform_cleantalk_details || {
                        accessKey: "",
                        status: false,
                        validation: ""
                    };
                })
        },
    },
    mounted() {
        this.getCleantalkSettings();
    },
};
</script>

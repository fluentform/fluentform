<template>
    <div class="ff_calculation_spam_wrap">
        <el-form label-position="top">
            <card>
                <card-head>
                    <h5 class="title">{{ $t('Calculation Based Spam Protection Settings') }}</h5>
                    <p class="text">
                        {{ $t('Fluent Forms includes a built-in calculation-based spam protection that requires users to solve a simple math problem before submitting the form. This helps protect your forms from automated spam submissions.') }}
                    </p>
                    <p class="text">
                        <b>{{ $t('This protection method does not require any API keys or external services.') }}</b>
                    </p>
                </card-head>
                <card-body>
                    <!--Enable/Disable-->
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Enable Calculation Spam Protection') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{
                                            $t('Enable this option to activate calculation-based spam protection. When enabled, users will be required to solve a simple math problem before submitting forms that include the calculation spam protection field.')
                                        }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-switch
                            v-model="calculationSpamProtection.enabled"
                            @change="load"
                        ></el-switch>
                    </el-form-item>

                    <!--Difficulty Level-->
                    <el-form-item class="ff-form-item" v-if="calculationSpamProtection.enabled">
                        <template slot="label">
                            {{ $t('Difficulty Level') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{
                                            $t('Choose the difficulty level for the calculation questions. Easy uses numbers 1-9, Medium uses 10-99, and Hard uses 100-999.')
                                        }}
                                    </p>
                                </div>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-select v-model="calculationSpamProtection.difficulty" @change="load">
                            <el-option
                                :label="$t('Easy (1-9)')"
                                value="easy"
                            ></el-option>
                            <el-option
                                :label="$t('Medium (10-99)')"
                                value="medium"
                            ></el-option>
                            <el-option
                                :label="$t('Hard (100-999)')"
                                value="hard"
                            ></el-option>
                        </el-select>
                    </el-form-item>

                    <!--Preview-->
                    <el-form-item :label="$t('Preview')" v-if="calculationSpamProtection.enabled">
                        <div class="ff-calculation-preview-box">
                            <div class="ff-calculation-question-preview">
                                <strong>{{ previewQuestion }}</strong>
                            </div>
                            <p class="ff-calculation-note">
                                {{ $t('Users will see a similar question and must enter the correct answer.') }}
                            </p>
                        </div>
                    </el-form-item>

                    <notice v-if="calculationSpamProtection_status" size="sm" type="success-soft">
                        <p>{{ $t('Calculation spam protection settings saved successfully.') }}</p>
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
        name: "CalculationSpamProtection",
        props: ["app"],
        data() {
            return {
                calculationSpamProtection: {
                    enabled: false,
                    difficulty: 'medium'
                },
                calculationSpamProtectionStatus: false,
                disabled: false,
                saving: false,
                clearing: false,
                previewQuestion: '5 + 3 = ?'
            };
        },
        methods: {
            load() {
                this.updatePreview();
            },
            updatePreview() {
                const difficulties = {
                    easy: { min: 1, max: 9 },
                    medium: { min: 10, max: 99 },
                    hard: { min: 100, max: 999 }
                };
                
                const range = difficulties[this.calculationSpamProtection.difficulty] || difficulties.medium;
                const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                const num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
                const operator = Math.random() > 0.5 ? '+' : '-';
                
                if (operator === '-') {
                    const max = Math.max(num1, num2);
                    const min = Math.min(num1, num2);
                    this.previewQuestion = `${max} ${operator} ${min} = ?`;
                } else {
                    this.previewQuestion = `${num1} ${operator} ${num2} = ?`;
                }
            },
            save() {
                if (!this.calculationSpamProtection.enabled) {
                    this.calculationSpamProtection.difficulty = 'medium';
                }

                this.saving = true;
                const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');

                let data = {
                    key: "CalculationSpamProtection",
                    calculationSpamProtection: this.calculationSpamProtection,
                }
                
                FluentFormsGlobal.$rest.post(url, data)
                    .then((response) => {
                        this.calculationSpamProtectionStatus = response.status;
                        this.$success(response.message);
                    })
                    .catch((error) => {
                        this.calculationSpamProtection_status = parseInt(error.status, 10);
                        this.$fail(error.message);
                    })
                    .finally((r) => {
                        this.saving = false;
                    });
            },
            clearSettings() {
                this.clearing = true;
                const url = FluentFormsGlobal.$rest.route('storeGlobalSettings');

                let data = {
                    key: "CalculationSpamProtection",
                    calculationSpamProtection: "clear-settings",
                }

                FluentFormsGlobal.$rest.post(url, data)
                    .then((response) => {
                        this.calculationSpamProtectionStatus = response.status;
                        this.calculationSpamProtection = {enabled: false, difficulty: 'medium'};
                        this.$success(response.message);
                    })
                    .catch((error) => {
                        this.calculationSpamProtectionStatus = error.status;
                        this.$fail(this.$t("Something went wrong."));
                    })
                    .finally((r) => {
                        this.clearing = false;
                    });
            },
            getCalculationSpamProtectionSettings() {
                const url = FluentFormsGlobal.$rest.route('getGlobalSettings');

                let data = {
                    key: [
                        "_fluentform_calculation_spam_protection_details",
                        "_fluentform_calculation_spam_protection_status",
                    ],
                }

                FluentFormsGlobal.$rest.get(url, data)
                    .then((response) => {
                        const calcSpam = response._fluentform_calculation_spam_protection_details || {
                            enabled: false,
                            difficulty: 'medium'
                        };
                        this.calculationSpamProtection = calcSpam;
                        this.calculationSpamProtectionStatus = response._fluentform_calculation_spam_protection_status;
                        this.updatePreview();
                    })
            },
        },
        mounted() {
            this.getCalculationSpamProtectionSettings();
        },
    };
</script>

<style scoped>
.ff-calculation-preview-box {
    padding: 15px;
    border: 1px solid #e4e7ed;
    border-radius: 4px;
    background: #f5f7fa;
}

.ff-calculation-question-preview {
    font-size: 16px;
    color: #333;
    margin-bottom: 10px;
}

.ff-calculation-note {
    font-size: 12px;
    color: #909399;
    margin: 0;
}
</style>


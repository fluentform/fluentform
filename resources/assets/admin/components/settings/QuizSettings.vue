<template>
    <div class="ff-quiz-settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Quiz Settings') }}</h5>
            </card-head>
            <card-body>
                <div class="ff-quiz-settings-wrapper">
                    <el-skeleton :loading="loading" animated :rows="6">
                        <el-form v-if="settings" label-position="top">
                            <field-mapper
                                :field="{ component: 'checkbox-single', label: $t('Enabled'), checkbox_label:  $t('Enable Quiz Module') }"
                                :editorShortcodes="editorShortcodes"
                                :errors="errors"
                                v-model="settings.enabled"
                            >
                            </field-mapper>
                            <div  v-if="settings.enabled">
                                <field-mapper
                                    v-for="field in settingsFields"
                                    :key="field.key"
                                    :field="field"
                                    :errors="errors"
                                    :editorShortcodes="editorShortcodes"
                                    v-model="settings[field.key]"
                                />
                                <el-form-item class="ff-form-item">
                                    <template slot="label">
                                        {{ $t('Grade System') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p>{{ $t('Result will be showed in grade when the score type is set as grade in the score input field') }}</p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </template>
                                    <table>
                                        <tr>
                                            <td><span class="lead-title mb-2">{{ $t('Grade Label') }}</span></td>
                                            <td><span class="lead-title mb-2">{{ $t('Minimum Range') }}</span></td>
                                            <td><span class="lead-title mb-2">{{ $t('Max Range') }}</span></td>
                                        </tr>
                                        <tr v-for="(item, itemIdex) in settings.grades" :key="itemIdex">
                                            <td>
                                                <el-input size="small" v-model="settings.grades[itemIdex].label"/>
                                            </td>
                                            <td>
                                                <el-input size="small" type="number" v-model="settings.grades[itemIdex].min"/>
                                            </td>
                                            <td>
                                                <el-input size="small" type="number" v-model="settings.grades[itemIdex].max"/>
                                            </td>
                                            <td>
                                                <action-btn class="ml-2 mb-1">
                                                    <action-btn-add @click="addItem(itemIdex)"></action-btn-add>
                                                    <action-btn-remove v-if="settings.grades.length > 1" @click="removeItem(itemIdex)"></action-btn-remove>
                                                </action-btn>
                                            </td>
                                        </tr>
                                    </table>
                                </el-form-item>
                                <el-form-item :label="$t('Quiz Questions')" class="quiz-questions ff-form-item">
                                    <p v-if="resultType == 'personality'">{{ $t('Personality quiz has no right or wrong answer. Enable the questions and make sure the answer values match the personality option values. Ranking questions use position-based scores, so the value placed higher can contribute more to the final result.') }}</p>
                                    <template v-if="quizFields">
                                        <div v-if="regularQuizFieldEntries.length" class="quiz-question-section">
                                            <div class="quiz-question-section__title">{{ $t('Standard Questions') }}</div>
                                            <div
                                                v-for="([key, input]) in regularQuizFieldEntries"
                                                :key="key"
                                                class="quiz-question-section__item"
                                            >
                                                <quiz-input
                                                    :input="getInput(key)"
                                                    :original_input="input"
                                                    :is_personality_quiz="resultType =='personality'"
                                                ></quiz-input>
                                            </div>
                                        </div>
                                        <div v-if="rankingQuizFieldEntries.length" class="quiz-question-section quiz-question-section--ranking">
                                            <div class="quiz-question-section__title">{{ $t('Ranking Questions') }}</div>
                                            <p class="quiz-question-section__description" v-if="resultType == 'personality'">
                                                {{ $t('Ranking questions award the configured position score to the personality value placed in each rank. Higher ranks can contribute more points by default, and you can adjust each position score if needed.') }}
                                            </p>
                                            <p class="quiz-question-section__description" v-else>
                                                {{ $t('Ranking questions use an ordered answer. Normal scoring requires the full order to match, and advanced scoring awards points only when an option is placed in its configured position.') }}
                                            </p>
                                            <div
                                                v-for="([key, input]) in rankingQuizFieldEntries"
                                                :key="key"
                                                class="quiz-question-section__item quiz-question-section__item--ranking"
                                            >
                                                <quiz-input
                                                    :input="getInput(key)"
                                                    :original_input="input"
                                                    :is_personality_quiz="resultType =='personality'"
                                                ></quiz-input>
                                            </div>
                                        </div>
                                    </template>
                                </el-form-item>
                            </div>
                            <div class="mt-4">
                                <el-button
                                    :loading="saving"
                                    type="primary"
                                    icon="el-icon-success"
                                    @click="saveSettings">
                                    {{ $t('%s Settings', saving ? 'Saving' : 'Save') }}
                                </el-button>
                                <el-tooltip class="item" effect="dark" :content="$t('Click to reset the settings if any quiz inputs name has been changed from the editor')" placement="top-start" v-if="settings.enabled">
                                    <el-button
                                        type="danger"
                                        icon="el-icon-delete"
                                        :loading="saving"
                                        @click="deleteSettings">
                                        {{ $t('%s Quiz Settings', deleting ? 'Resetting' : 'Reset') }}
                                    </el-button>
                                </el-tooltip>
                            </div>
                        </el-form>
                    </el-skeleton>
                </div>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
    import DropdownLabelRepeater from './GeneralIntegration/_DropdownLabelRepeater';
    import FieldGeneral from './GeneralIntegration/_FieldGeneral';
    import inputPopover from '../input-popover.vue';
    import FieldMapper from "./GeneralIntegration/FieldMapper";
    import QuizInput from "./QuizInput";
    import BtnGroup from '@/admin/components/BtnGroup/BtnGroup.vue';
    import BtnGroupItem from '@/admin/components/BtnGroup/BtnGroupItem.vue';
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';
    import ActionBtn from '@/admin/components/ActionBtn/ActionBtn.vue';
    import ActionBtnAdd from '@/admin/components/ActionBtn/ActionBtnAdd.vue';
    import ActionBtnRemove from '@/admin/components/ActionBtn/ActionBtnRemove.vue';

    export default {
        name: 'QuizSettings',
        props: ['form', 'editorShortcodes', 'inputs'],
        components: {
            DropdownLabelRepeater,
            FieldGeneral,
            inputPopover,
            FieldMapper,
            QuizInput,
            Card,
            CardHead,
            CardBody,
            CardHeadGroup,
            BtnGroup,
            BtnGroupItem,
            ActionBtn,
            ActionBtnAdd,
            ActionBtnRemove
        },
        data() {
            return {
                saving: false,
                deleting: false,
                settings: false,
                loading: false,
                settingsFields: [],
                quizFields: {},
                errors: new Errors()
            }
        },
        computed: {
            resultType() {
                return this.settings ? this.settings.result_type : '';
            },
            regularQuizFieldEntries() {
                if (!this.quizFields) {
                    return [];
                }

                return Object.entries(this.quizFields).filter(([, input]) => {
                    return !this.isRankingField(input);
                });
            },
            rankingQuizFieldEntries() {
                if (!this.quizFields) {
                    return [];
                }

                return Object.entries(this.quizFields).filter(([, input]) => {
                    return this.isRankingField(input);
                });
            }
        },
        methods: {
            isRankingField(input) {
                return input && input.element === 'input_ranking';
            },
            getInput(key) {
                if (this.settings.saved_quiz_fields[key]) {
                    return this.settings.saved_quiz_fields[key];
                }
                this.$set(this.settings.saved_quiz_fields, key, this.quizFields[key]);
                return this.settings.saved_quiz_fields[key];
            },
            getSettings() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'ff_get_quiz_module_settings',
                    form_id: this.form.id,
                })
                    .then(response => {
                        const settings = response.data.settings;
                        if (Array.isArray(settings.saved_quiz_fields)) {
                            settings.saved_quiz_fields = Object.assign({}, settings.saved_quiz_fields);
                        }
                        this.settings = settings;
                        this.quizFields = response.data.quiz_fields;
                        this.settingsFields = response.data.settings_fields;
                    })
                    .fail(error => {
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            saveSettings() {
                this.saving = true;
                FluentFormsGlobal.$post({
                    action: 'ff_store_quiz_module_settings',
                    form_id: this.form.id,
                    settings: JSON.stringify(this.settings)
                })
                    .then(response => {
                        this.$success(response.data.message);
                    })
                    .fail(error => {
                        this.errors.record(e.responseJSON.errors);
                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            deleteSettings() {
                this.deleting = true;
                this.$confirm(
                    this.$t('This will permanently reset the quiz settings. Continue?'),
                    this.$t('Warning'),
                    {
                        confirmButtonText: this.$t('Reset'),
                        cancelButtonText: this.$t('Cancel'),
                        confirmButtonClass: 'el-button--soft el-button--danger',
                        cancelButtonClass: 'el-button--soft el-button--success',
                        type: 'warning'
                    }).then(() => {
                    FluentFormsGlobal.$post({
                        action: 'ff_delete_quiz_module_settings',
                        form_id: this.form.id,
                        settings: JSON.stringify(this.settings)
                    })
                        .then(response => {
                            this.$success(response.data.message);
                            this.getSettings();
                        })
                        .fail(error => {
                            this.errors.record(error.responseJSON.errors);
                        })
                        .always(() => {
                            this.deleting = false;
                        });
                }).catch(() => {
                    this.deleting = false;
                })
            },
            addItem(index) {
                this.settings.grades.splice(index + 1, 0, {
                    label: 'Grade',
                    min: 70,
                    max: 89
                });
            },
            removeItem(index) {
                this.settings.grades.splice(index, 1);
            }
        },
        mounted() {
            this.getSettings();
            jQuery('head title').text('Quiz Settings - Fluent Forms');
        }
    }
</script>

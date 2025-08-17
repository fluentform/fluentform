<template>
    <div class="ff-quiz-settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t("Quiz Settings") }}</h5>
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
                            <div v-if="settings.enabled">
                                <field-mapper
                                    v-for="field in settingsFields"
                                    :key="field.key"
                                    :field="field"
                                    :errors="errors"
                                    :editorShortcodes="editorShortcodes"
                                    v-model="settings[field.key]"
                                />
                                <el-form-item class="ff-form-item">
                                    <template #label>
                                        {{ $t("Grade System") }}
                                        <el-tooltip class="item" placement="bottom-start"
                                                    popper-class="ff_tooltip_wrap">
                                            <template #content>
                                                <p>{{
                                                        $t("Result will be showed in grade when the score type is set as grade in the score input field")
                                                    }}</p>
                                            </template>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </template>
                                    <table>
                                        <tbody>
                                        <tr>
                                            <td><span class="lead-title mb-2">{{ $t("Grade Label") }}</span></td>
                                            <td><span class="lead-title mb-2">{{ $t("Minimum Range") }}</span></td>
                                            <td><span class="lead-title mb-2">{{ $t("Max Range") }}</span></td>
                                        </tr>
                                        <tr v-for="(item, itemIndex) in settings.grades" :key="itemIndex">
                                            <td>
                                                <el-input size="small" v-model="settings.grades[itemIndex].label" />
                                            </td>
                                            <td>
                                                <el-input size="small" type="number"
                                                          v-model="settings.grades[itemIndex].min" />
                                            </td>
                                            <td>
                                                <el-input size="small" type="number"
                                                          v-model="settings.grades[itemIndex].max" />
                                            </td>
                                            <td>
                                                <action-btn class="ml-2 mb-1">
                                                    <action-btn-add @click="addItem(itemIndex)"></action-btn-add>
                                                    <action-btn-remove v-if="settings.grades.length > 1"
                                                                       @click="removeItem(itemIndex)"></action-btn-remove>
                                                </action-btn>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </el-form-item>
                                <el-form-item :label="$t('Quiz Questions')" class="quiz-questions ff-form-item">
                                    <p v-if="resultType == 'personality'">
                                        {{ $t("Personality quiz has no right or wrong answer, just enable the questions. Make sure the answers value match with the personality options values. That is all.")
                                        }}</p>
                                    <template v-if="quizFields">
                                        <div v-for="(input, key) in quizFields" :key="key">
                                            <quiz-input :input="getInput(key)" :original_input="quizFields[key]"
                                                        :is_personality_quiz="resultType =='personality'"></quiz-input>
                                        </div>
                                    </template>
                                </el-form-item>
                            </div>
                            <div class="mt-4">
                                <el-button
                                    :loading="saving"
                                    type="primary"
                                    @click="saveSettings"
                                    size="large"
                                >
                                    <template #icon>
                                        <i class="el-icon-success"></i>
                                    </template>
                                    {{ saving ? $t("Saving ") : $t("Save ") }} {{ $t("Settings") }}
                                </el-button>
                                <el-tooltip class="item" effect="dark"
                                            :content="$t('Click to reset the settings if any quiz inputs name has been changed from the editor')"
                                            placement="top-start" v-if="settings.enabled">
                                    <el-button
                                        type="danger"
                                        :loading="saving"
                                        @click="deleteSettings"
                                        size="large"
                                    >
                                        <template #icon>
                                            <i class="el-icon-delete"></i>
                                        </template>
                                        {{ deleting ? $t("Resetting ") : $t("Reset ") }} {{ $t("Quiz Settings") }}
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

<script>
import DropdownLabelRepeater from "./GeneralIntegration/_DropdownLabelRepeater.vue";
import FieldGeneral from "./GeneralIntegration/_FieldGeneral.vue";
import inputPopover from "../input-popover.vue";
import FieldMapper from "./GeneralIntegration/FieldMapper.vue";
import QuizInput from "./QuizInput.vue";
import BtnGroup from "@/admin/components/BtnGroup/BtnGroup.vue";
import BtnGroupItem from "@/admin/components/BtnGroup/BtnGroupItem.vue";
import Card from "@/admin/components/Card/Card.vue";
import CardBody from "@/admin/components/Card/CardBody.vue";
import CardHead from "@/admin/components/Card/CardHead.vue";
import CardHeadGroup from "@/admin/components/Card/CardHeadGroup.vue";
import ActionBtn from "@/admin/components/ActionBtn/ActionBtn.vue";
import ActionBtnAdd from "@/admin/components/ActionBtn/ActionBtnAdd.vue";
import ActionBtnRemove from "@/admin/components/ActionBtn/ActionBtnRemove.vue";

export default {
    name: "QuizSettings",
    props: ["form", "editorShortcodes", "inputs"],
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
            resultType: "",
            settingsFields: [],
            quizFields: {},
            errors: new Errors()
        };
    },
    computed: {},
    methods: {
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
                action: "ff_get_quiz_module_settings",
                form_id: this.form.id
            })
                .then(response => {
                    this.settings = response.data.settings;
                    this.quizFields = response.data.quiz_fields;
                    this.settingsFields = response.data.settings_fields;
                    this.resultType = response.data.settings.result_type;
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
                action: "ff_store_quiz_module_settings",
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
                this.$t("This will permanently reset the quiz settings. Continue?"),
                this.$t("Warning"),
                {
                    confirmButtonText: this.$t("Reset"),
                    cancelButtonText: this.$t("Cancel"),
                    confirmButtonClass: "el-button--soft el-button--danger",
                    cancelButtonClass: "el-button--soft el-button--success",
                    type: "warning"
                }).then(() => {
                FluentFormsGlobal.$post({
                    action: "ff_delete_quiz_module_settings",
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
            });
        },
        addItem(index) {
            this.settings.grades.splice(index + 1, 0, {
                label: "Grade",
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
        jQuery("head title").text("Quiz Settings - Fluent Forms");
    }
};
</script>

<template>
    <div class="ff-quiz-settings">
        <el-row class="setting_header">
            <el-col :md="12">
                <h2>{{ $t('Quiz Settings') }}</h2>
            </el-col>
            <el-col :md="12" class="action-buttons clearfix mb15">
                <el-button
                    :loading="saving"
                    class="pull-right"
                    size="medium"
                    type="success"
                    icon="el-icon-success"
                    @click="saveSettings">
                    {{ saving ? $t('Saving') : $t('Save') }} {{ $t('Settings') }}
                </el-button>
            </el-col>
        </el-row>
        <div v-loading="loading" class="ff-quiz-settings-wrapper">
            <el-form v-if="settings" label-width="160px" label-position="left">
    
             
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
                    <el-form-item >
                        <template slot="label">
                            {{ $t('Grade System') }}
                            <el-tooltip
                                class="item"
                                effect="light"
                                placement="bottom-start"
                            >
                                <div slot="content">
                                    <p>Result will be showed in grade when the score type is set as grade in the score input field</p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <table>
                            <tr>
                                <td><b>{{ $t('Grade Label') }}</b></td>
                                <td><b>{{ $t('Minimum Range') }}</b></td>
                                <td><b>{{ $t('Max Range') }}</b></td>
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
                                    <el-button-group>
                                        <el-button size="mini" type="success" @click="addItem(itemIdex)">+</el-button>
                                        <el-button size="mini" type="danger" :disabled="settings.grades.length == 1"
                                                   @click="removeItem(itemIdex)">-
                                        </el-button>
                                    </el-button-group>
                                </td>
                            </tr>
        
                        </table>
                    </el-form-item>
                    <el-form-item :label="$t('Quiz Questions')"  class="quiz-questions">
                        <div v-if="quizFields" v-for="(input, key) in quizFields" :key="key">
                            <quiz-input :input="getInput(key)" :original_input="quizFields[key]"></quiz-input>
                        </div>
                    </el-form-item>
                </div>
                <div style="margin-top: 30px" class="action_right">
                    <el-button
                        :loading="saving"
                        class="pull-right"
                        size="medium"
                        type="success"
                        icon="el-icon-success"
                        @click="saveSettings">
                        {{ saving ? $t('Saving') : $t('Save') }} {{ $t('Settings') }}
                    </el-button>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script type="text/babel">
import DropdownLabelRepeater from './GeneralIntegration/_DropdownLabelRepeater';
import FieldGeneral from './GeneralIntegration/_FieldGeneral';
import inputPopover from '../input-popover.vue';
import FieldMapper from "./GeneralIntegration/FieldMapper";
import QuizInput from "./QuizInput";


export default {
    name: 'QuizSettings',
    props: ['form', 'editorShortcodes', 'inputs'],
    components: {
        DropdownLabelRepeater,
        FieldGeneral,
        inputPopover,
        FieldMapper,
        QuizInput
    },
    data() {
        return {
            saving: false,
            settings: false,
            loading: false,
            settingsFields: [],
            quizFields: {},
            errors: new Errors()
        }
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
                action: 'ff_get_quiz_module_settings',
                form_id: this.form.id,
            })
                .then(response => {
                    this.settings = response.data.settings;
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
                    this.$notify.success(response.data.message);
                })
                .fail(error => {
                    this.errors.record(e.responseJSON.errors);
                })
                .always(() => {
                    this.saving = false;
                });
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

<template>
    <div v-loading="loading" element-loading-text="Loading Settings..." style="min-height: 100px;">
        <el-row class="setting_header">
            <el-col :md="16">
                <h2>Conversational Form</h2>
                <p>
                    Create interactive conversational form using one question at a time approach to boost form completion.
                </p>
            </el-col>

            <!--Save settings-->
            <el-col v-if="!error_text" :md="8" class="action-buttons clearfix mb15">
                <el-button
                        :loading="saving"
                        class="pull-right"
                        size="medium"
                        type="success"
                        icon="el-icon-success"
                        @click="saveSettings">
                    {{saving ? 'Saving' : 'Save'}} Settings
                </el-button>
                <a v-show="share_url && settings.status == 'yes'"
                   style="margin-right: 10px"
                   target="_blank"
                   rel="noopener"
                   :href="share_url"
                   class="el-button pull-right el-button--danger el-button--mini"
                >
                    <i class="dashicons dashicons-share"/>
                </a>
            </el-col>
        </el-row>

        <div v-if="settings" class="ff_landing_settings_wrapper">
            <el-form ref="form" :model="settings" label-width="205px" label-position="right">
                <el-checkbox v-model="settings.status" true-label="yes" false-label="no">
                    Enable Conversational Form Mode
                </el-checkbox>

                <div v-if="settings.status == 'yes'" class="ff_conversational_page_items">
                    <field-mapper
                            v-for="field in settings_fields"
                            :field="field"
                            :editorShortcodes="editorShortcodes"
                            :errors="errors"
                            :key="field.key"
                            v-model="settings[field.key]"
                    >
                    </field-mapper>

                    <el-form-item v-if="share_url && settings.status == 'yes'" label="Page URL">
                        <input class="el-input__inner" readonly type="text" :value="share_url" />
                    </el-form-item>

                    <el-form-item>
                        <el-button
                                :loading="saving"
                                class="pull-right"
                                size="medium"
                                type="success"
                                icon="el-icon-success"
                                @click="saveSettings">
                            {{saving ? 'Saving' : 'Save'}} Settings
                        </el-button>
                    </el-form-item>
                </div>
            </el-form>
        </div>

        <p>{{error_text}}</p>
    </div>
</template>

<script type="text/babel">
    import PhotoUploader from '../../../common/PhotoUploader';
    import FieldMapper from "./GeneralIntegration/FieldMapper";
    export default {
        name: 'landing_pages',
        components: {
            PhotoUploader,
            FieldMapper
        },
        data() {
            return {
                settings_fields : [],
                editorShortcodes : [],
                errors : new Errors(),
                loading : false,
                saving : false,
                settings : false,
                form_id : window.FluentFormApp.form_id,
                error_text : '',
                share_url : '',

            }
        },
        methods: {
            saveSettings() {
                this.saving = true;

                let data = {
                    action: 'ff_store_conversational_form_settings',
                    form_id: this.form_id,
                    settings: this.settings
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.share_url = response.data.share_url;
                        this.$notify.success({
                            title: 'Success',
                            message: response.data.message,
                            offset: 30
                        });
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            fetchSettings() {
                this.loading = true;

                let data = {
                    action: 'ff_get_conversational_form_settings',
                    form_id: this.form_id
                };

                FluentFormsGlobal.$get(data)
                    .then(response => {
                        this.share_url = response.data.share_url;
                        this.settings = response.data.settings;
                    })
                    .fail(error => {
                        if (!error.responseJSON) {
                            this.error_text = 'Looks like you do not have latest version of Fluent Forms Pro Installed. Please install latest version of Fluent Forms Pro to use this feature';
                            return;
                        }
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            getFields() {
                this.loading = true;
                FluentFormsGlobal.$get({
                       action: 'ff_get_conversational_form_fields',
                     })
                    .then(response => {
                        this.settings_fields = response.data.settings_fields;
                    })
                    .fail((error) => {
                        console.log(error);
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
        },
        mounted() {
            this.getFields();
            this.fetchSettings();
        }
    };
</script>


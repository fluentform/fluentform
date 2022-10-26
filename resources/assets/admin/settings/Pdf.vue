<template>
    <div>
        <el-row class="setting_header">
            <el-col :md="18">
                <h2>{{ $t('Global PDF Settings') }}</h2>
                <p>{{
                        $t('This global settings will be set as default for your new PDF feed for any form.Then you can customize for a specific PDF generator feed')
                    }}</p>
            </el-col>
            <el-col class="action-buttons clearfix mb15 text-right" :md="6">
                <el-button
                        class="pull-right"
                        size="small"
                        type="primary"
                        icon="el-icon-success"
                        @click="save"
                >{{ $t('Save Settings') }}
                </el-button>
            </el-col>
        </el-row>
        <div v-loading="loading" class="section-body">
            <el-form label-position="left" label-width="205px">
                <field-mapper
                        v-for="field in fields"
                        :key="field.key"
                        :field="field"
                        :errors="errors"
                        v-model="settings[field.key]"
                />
            </el-form>
            <!--Save settings-->
            <el-row>
                <el-col class="action-buttons clearfix mb15">
                    <el-button
                            size="small"
                            class="pull-right"
                            type="primary"
                            icon="el-icon-success"
                            @click="save"
                    >{{ $t('Save Settings') }}
                    </el-button>
                </el-col>
            </el-row>
        </div>
    </div>
</template>

<script type="text/babel">
    import FieldMapper from "./../components/settings/GeneralIntegration/FieldMapper";
    import Errors from '../../common/Errors';
    export default {
        name: "fluentorm_pdf",
        props: ["app"],
        components: {
            FieldMapper
        },
        data() {
            return {
                loading: false,
                settings: {},
                fields: {},
                errors: new Errors()
            };
        },
        methods: {
            save() {
                this.saving = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_pdf_admin_ajax_actions',
                    route: 'save_global_settings',
                    settings: this.settings
                })
                    .then(response => {
                        this.$success(response.data.message);
                    })
                    .fail(e => {
                        this.$fail(this.$t('Global settings save error, please reload.'));
                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            getGlobalPdfSettings() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform_pdf_admin_ajax_actions',
                    route: 'get_global_settings'
                })
                    .then(response => {
                        this.settings = response.data.settings;
                        this.fields = response.data.fields;
                    })
                    .fail(e => {
                        this.$fail(this.$t('Global settings fetch error, please reload.'));
                    })
                    .always(() => {
                        this.loading = false;
                    });
            }
        },
        mounted() {
            this.getGlobalPdfSettings();
        }
    };
</script>

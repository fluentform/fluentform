<template>
    <div>
        <el-row class="admin_menu_header">
            <el-col :md="24">
                <h3>Export Forms</h3>
                <p>
                    Select the forms you would like to export. When you click the download button below,
                    Fluent Forms will create a JSON file for you to save to your computer. Once you've
                    saved the downloaded file, you can use the Import tool to import the forms.
                </p>
            </el-col>
        </el-row>

        <el-form label-width="205px" label-position="left">
            <!--Select Forms-->
            <el-form-item>
                <template slot="label">
                    Select Forms

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Export Selected Forms</h3>
                            <p>
                                Select the forms you would like to export.
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <el-select v-model="selected" multiple filterable style="width: 100%">
                    <el-option v-for="(form, index) in forms" :key="index"
                               :label="'#'+ form.id +' - ' +form.title" :value="form.id"
                    ></el-option>
                </el-select>
            </el-form-item>

            <el-form-item>
                <el-button size="medium" class="pull-right" type="success" icon="el-icon-success" @click="exportForms">
                    Export
                </el-button>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
    export default {
        name: "ExportForms",
        props: ['app'],
        data() {
            return {
                forms: this.app.forms,
                selected: [],
            }
        },
        methods: {
            exportForms() {
                if (this.selected.length) {
                    const data = {
                        action: 'fluentform-export-forms',
                        forms: this.selected,
                        format: 'json',
                        fluent_forms_admin_nonce: window.fluent_forms_global_var.fluent_forms_admin_nonce
                    };
                    location.href = ajaxurl + '?' + jQuery.param(data);
                }
            }
        }
    }
</script>

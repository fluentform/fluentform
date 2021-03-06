<template>
    <div>
        <el-row class="admin_menu_header">
            <el-col :md="24">
                <h3>Import Forms</h3>
                <p>
                    Select the Fluent Forms export file (.json) you would like to import. When you click the import button below,
                    Fluent Forms will import the forms.
                </p>
            </el-col>
        </el-row>

        <el-form v-if="!importedForms" label-width="205px" label-position="left">
            <!--Select File-->
            <el-form-item>
                <template slot="label">
                    Select File
                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Select File</h3>
                            <p>
                                Click the Choose File button to upload a <br>
                                Fluent Forms export file from your computer.
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <input type="file" id="fileUpload" @click="clear">
            </el-form-item>
            <el-form-item>
                <el-button size="medium" class="pull-right" type="success" icon="el-icon-success"
                           @click="importForms" :loading="importing"
                >
                    Import
                </el-button>
            </el-form-item>
        </el-form>

        <div v-else>
            <table class="wp-list-table widefat fixed striped pages">
                <thead>
                    <tr>
                        <td>ID</td>
                        <td>Title</td>
                        <td>Action</td>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(form, formId) in importedForms">
                        <td>{{formId}}</td>
                        <td>{{form.title}}</td>
                        <td><a class="el-button el-button--success el-button--mini" :href="form.edit_url">Edit Form</a></td>
                    </tr>
                </tbody>
            </table>
        </div>

    </div>
</template>

<script>
    export default {
        name: "ImportForms",
        props: ['app'],
        data() {
            return {
                forms: this.app.forms,
                selected: [],
                importing: false,
                importedForms: false
            }
        },
        methods: {
            importForms() {
                this.importing = true;

                var file = jQuery('#fileUpload')[0].files[0];

                if (!file) {
                    this.importing = false;
                    return;
                }


                var data = new FormData();
                data.append('format', 'json');
                data.append('file', file);
                data.append('action', 'fluentform-import-forms');
                data.append('fluent_forms_admin_nonce', window.fluent_forms_global_var.fluent_forms_admin_nonce);

                jQuery.ajax({
                    url: ajaxurl,
                    data: data,
                    type: 'POST',
                    contentType: false,
                    processData: false,
                    success: (response) => {
                        this.importing = false;
                        this.importedForms = response.inserted_forms;
                        this.$notify.success({
                            title: 'Success',
                            message: response.message,
                            offset: 30
                        });

                        this.clear();
                    },
                    error: (error) => {
                        this.importing = false;

                        this.$notify.error({
                            title: 'Error',
                            message: error.responseJSON.message,
                            offset: 30
                        });

                        this.clear();
                    }
                });
            },
            clear() {
                jQuery('#fileUpload').val('');
            }
        }
    }
</script>

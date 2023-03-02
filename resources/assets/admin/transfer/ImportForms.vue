<template>
    <div>
        <el-row class="admin_menu_header">
            <el-col :md="24">
                <h3>{{ $t('Import Forms') }}</h3>
                <p>
                    {{
                        $t('Select the Fluent Forms export file(.json) you would like to import. When you click the import button below, Fluent Forms will import the forms.')
                    }}
                </p>
            </el-col>
        </el-row>

        <el-form v-if="!importedForms" label-width="205px" label-position="left">
            <!--Select File-->
            <el-form-item>
                <template slot="label">
                    {{ $t('Select File') }}
                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>{{ $t('Select File') }}</h3>
                            <p>
                                {{ $t('Click the Choose File button to upload a') }}<br>
                                {{ $t('Fluent Forms export file from your computer.') }}
                            </p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <input type="file" id="fileUpload" @click="clear">
            </el-form-item>
            <el-form-item>
                <el-button size="small" class="pull-right" type="primary" icon="el-icon-success"
                           @click="importForms" :loading="importing"
                >
                    {{ $t('Import') }}
                </el-button>
            </el-form-item>
        </el-form>

        <div v-else>
            <table class="wp-list-table widefat fixed striped pages">
                <thead>
                <tr>
                    <td>{{ $t('ID') }}</td>
                    <td>{{ $t('Title') }}</td>
                    <td>{{ $t('Action') }}</td>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(form, formId) in importedForms">
                    <td>{{ formId }}</td>
                    <td>{{ form.title }}</td>
                    <td><a class="el-button el-button--primary el-button--mini" :href="form.edit_url"><i
                            class="el-icon-edit"></i> {{ $t('Edit') }}</a></td>
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
                data.query_timestamp = Date.now();

                const headers = {"X-WP-Nonce": window.fluent_forms_global_var.rest.nonce};

                const route = FluentFormsGlobal.$rest.route('importForms');
                const url = `${window.fluent_forms_global_var.rest.url}/${route}`;

                return new Promise((resolve, reject) => {
                    window.jQuery
                        .ajax({
                            url: url,
                            type: 'POST',
                            data: data,
                            headers: headers,
                            contentType: false,
                            processData: false,
                        })
                        .then(response => {
                            this.importing = false;
                            this.importedForms = response.inserted_forms;
                            this.$success(response.message);
                            this.clear();
                        })
                        .fail(errors => {
                            console.log(errors)
                        });
                });

            },
            clear() {
                jQuery('#fileUpload').val('');
            }
        }
    }
</script>

<template>
    <div class="ff_import_forms">
        <div class="ff_card">
            <div class="ff_card_head">
                <h5 class="title">{{ $t('Import Forms') }}</h5>
                <p class="text" style="max-width: 660px;">
                    {{
                        $t('Select the Fluent Forms export file(.json) you would like to import. When you click the import button below, Fluent Forms will import the forms.')
                    }}
                </p>
            </div><!-- ff_card_head -->
            <div class="ff_card_body">
                <el-form v-if="!importedForms">
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title"> {{ $t('Select File') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Click the Choose File button to upload a Fluent Forms export file from your computer.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <input class="file-input ff_input_width" type="file" id="fileUpload" @click="clear">
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->

                    <div class="ff_block_item">
                        <el-button type="primary" icon="el-icon-success" @click="importForms" :loading="importing">
                            {{ $t('Import Forms') }}
                        </el-button>
                    </div>
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
                            <tr v-for="(form, formId) in importedForms" :key="formId">
                                <td>{{formId}}</td>
                                <td>{{form.title}}</td>
                                <td><a class="el-button el-button--primary el-button--mini" :href="form.edit_url"><i class="el-icon el-icon-edit"></i> <span>{{ $t('Edit') }}</span></a></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div><!-- .ff_card_body -->
        </div><!-- .ff_card -->
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
                        this.$success(response.message);
                        this.clear();
                    },
                    error: (error) => {
                        this.importing = false;
                        this.$fail(error.responseJSON.message);
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

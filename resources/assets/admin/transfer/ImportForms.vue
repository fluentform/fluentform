<template>
    <div class="ff_import_forms">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Import Forms') }}</h5>
                <p class="text" style="max-width: 700px;">
                    {{
                        $t('Select the Fluent Forms export file(.json) you would like to import. When you click the import button below, Fluent Forms will import the forms.')
                    }}
                </p>
            </card-head>
            <card-body>
                <el-form v-if="!importedForms" label-position="top">
                    <!--Select File-->
                    <el-form-item class="ff-form-item">
                        <template #label>
                            {{ $t('Select File') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <template #content>
                                    <p>
                                        {{ $t('Click the Choose File button to upload a Fluent Forms export file from your computer') }}
                                    </p>
                                </template>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <input type="file" id="fileUpload" class="file-input ff_input_width" @click="clear">
                    </el-form-item>
                    <el-button type="primary" @click="importForms" :loading="importing" size="large">
                        <template #icon>
                            <i class="el-icon-success"></i>
                        </template>
                        {{ $t('Import Forms') }}
                    </el-button>
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
            </card-body>
        </card>
    </div>
</template>

<script>
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';

    export default {
        name: "ImportForms",
        props: ['app'],
        components: {
            Card, 
            CardHead, 
            CardBody 
        },
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

                let data = new FormData();
                data.append('format', 'json');
                data.append('file', file);
                data.append('action', 'fluentform-import-forms');
	            data.append('fluent_forms_admin_nonce', window.fluent_forms_global_var.fluent_forms_admin_nonce);

	            jQuery
		            .ajax({
			            url: ajaxurl,
			            type: 'POST',
			            data: data,
			            contentType: false,
			            processData: false,
                        success: (response) => {
	                        this.clear();
	                        this.$emit('forms-imported', true)
	                        this.importedForms = response.inserted_forms;
	                        this.$success(response.message);
                        },
                        error: (error) => {
	                        this.clear();
	                        this.$emit('forms-imported', false)
							const errorMessage = error?.message || error?.responseJSON?.message;
	                        errorMessage && this.$fail(errorMessage);
                        }
		            });
            },
            clear() {
                this.importing = false;
                jQuery('#fileUpload').val('');
            }
        }
    }
</script>

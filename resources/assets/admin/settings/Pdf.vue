<template>
    <div class="ff_pdf_wrap">
        <el-skeleton :loading="loading" animated :rows="10" :class="loading ? 'ff_card' : ''">
            <card>
                <card-head>
                    <h5 class="title">{{ $t('Global PDF Settings') }}</h5>
                    <p class="text">{{$t('Configure global PDF settings and create custom templates')}}</p>
                </card-head>
                <card-body v-loading="loading">
                    <el-tabs v-model="activeTab" type="border-card">
                        <el-tab-pane :label="$t('Basic Settings')" name="basic">
                            <el-form class="ff_pdf_form_wrap" label-position="top">
                                <field-mapper
                                    v-for="field in fields"
                                    :key="field.key"
                                    :field="field"
                                    :errors="errors"
                                    v-model="settings[field.key]"
                                />
                            </el-form>
                        </el-tab-pane>
                        
                        <el-tab-pane :label="$t('Template Builder')" name="builder">
                            <div class="form-fields-debug" style="margin-bottom: 10px; padding: 10px; background: #f5f5f5; font-size: 12px;">
                                <strong>Debug Info:</strong><br>
                                Form ID: {{ getFormIdFromContext() }}<br>
                                Form Fields Count: {{ formFields.length }}<br>
                                Sample Fields Count: {{ sampleFormFields.length }}
                            </div>
                            
                            <pdf-builder
                                :form-fields="formFields"
                                :template-data="templateData"
                                :form-id="getFormIdFromContext()"
                                @save="saveTemplate"
                                @preview="previewTemplate"
                            />
                        </el-tab-pane>
                    </el-tabs>
                </card-body>
            </card>
            <div v-if="activeTab === 'basic'">
                <el-button
                    type="primary"
                    icon="el-icon-success"
                    @click="save"
                    :loading="saving"
                >
                    {{ $t('Save Settings') }}
                </el-button>
            </div>
        </el-skeleton>
    </div>
</template>

<script type="text/babel">
    import FieldMapper from "@/admin/components/settings/GeneralIntegration/FieldMapper";
    import Errors from '@/common/Errors';
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import PdfBuilder from '@/admin/components/PdfBuilder/PdfBuilder.vue';

    export default {
        name: "fluentorm_pdf",
        props: ["app"],
        components: {
            FieldMapper,
            Card, 
            CardHead, 
            CardBody,
            PdfBuilder
        },
        data() {
            return {
                loading: false,
                saving: false,
                activeTab: 'basic',
                settings: {},
                fields: {},
                templateData: {},
                errors: new Errors(),
                sampleFormFields: []
            };
        },

        computed: {
            formFields() {
                // For global settings, we'll use sample fields since we don't have a specific form context
                const sampleFields = [
                    { 
                        name: 'names[first_name]', 
                        label: 'First Name', 
                        element: 'input_text',
                        attributes: { type: 'text', placeholder: 'First Name' }
                    },
                    { 
                        name: 'names[last_name]', 
                        label: 'Last Name', 
                        element: 'input_text',
                        attributes: { type: 'text', placeholder: 'Last Name' }
                    },
                    { 
                        name: 'email', 
                        label: 'Email Address', 
                        element: 'input_email',
                        attributes: { type: 'email', placeholder: 'Email Address' }
                    },
                    { 
                        name: 'subject', 
                        label: 'Subject', 
                        element: 'input_text',
                        attributes: { type: 'text', placeholder: 'Subject' }
                    },
                    { 
                        name: 'message', 
                        label: 'Your Message', 
                        element: 'textarea',
                        attributes: { placeholder: 'Your Message', rows: 4 }
                    },
                    { 
                        name: 'phone', 
                        label: 'Phone Number', 
                        element: 'input_text',
                        attributes: { type: 'text', placeholder: 'Phone Number' }
                    },
                    { 
                        name: 'company', 
                        label: 'Company', 
                        element: 'input_text',
                        attributes: { type: 'text', placeholder: 'Company' }
                    }
                ];
                
                console.log('Using sample form fields for global template:', sampleFields);
                return sampleFields;
            }
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

            saveTemplate(templateData) {
                this.saving = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_pdf_admin_ajax_actions',
                    route: 'save_global_template',
                    template: templateData
                })
                    .then(response => {
                        this.$success(this.$t('Template saved successfully'));
                        this.templateData = templateData;
                    })
                    .fail(e => {
                        this.$fail(this.$t('Template save error'));
                    })
                    .always(() => {
                        this.saving = false;
                    });
            },

            previewTemplate(templateData) {
                // Use the correct AJAX URL
                const ajaxUrl = window.ajaxurl || window.FluentFormsGlobal?.ajaxurl || '/wp-admin/admin-ajax.php';
                const previewUrl = ajaxUrl + '?action=fluentform_pdf_admin_ajax_actions&route=preview_template';
                
                console.log('Preview URL:', previewUrl); // Debug log
                
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = previewUrl;
                form.target = '_blank';
                
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = 'template_data';
                input.value = JSON.stringify(templateData);
                
                // Add nonce for security
                const nonceInput = document.createElement('input');
                nonceInput.type = 'hidden';
                nonceInput.name = '_wpnonce';
                nonceInput.value = window.fluent_forms_global_var?.fluent_forms_admin_nonce || '';
                
                form.appendChild(input);
                form.appendChild(nonceInput);
                
                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
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
                        this.templateData = response.data.template || {};
                        
                        console.log('Global settings response:', response.data);
                        
                        // Try to get form fields from the current context
                        this.getFormFields();
                    })
                    .fail(e => {
                        this.$fail(this.$t('Global settings fetch error, please reload.'));
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },

            getFormFields() {
                // Check if we have a form ID from the current page context
                const formId = this.getFormIdFromContext();
                
                if (!formId) {
                    console.log('No form ID found, using sample fields');
                    return;
                }

                console.log('Fetching form fields for form ID:', formId);

                // Use the same pattern as PdfFeed.vue
                FluentFormsGlobal.$get({
                    form_id: formId,
                    action: 'fluentform_pdf_admin_ajax_actions',
                    route: 'get_feed'
                })
                    .then(response => {
                        console.log('Form fields response:', response);
                        this.sampleFormFields = response.data?.form_fields || [];
                        
                        if (this.sampleFormFields.length === 0) {
                            console.log('No form fields returned, trying alternative method');
                            this.getFormFieldsAlternative(formId);
                        }
                    })
                    .catch(e => {
                        console.error('Failed to fetch form fields:', e);
                        this.getFormFieldsAlternative(formId);
                    });
            },

            getFormFieldsAlternative(formId) {
                // Try the form parser approach
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_form_inputs',
                    form_id: formId,
                    with: ['element', 'settings', 'attributes']
                })
                    .then(response => {
                        console.log('Alternative form fields response:', response);
                        if (response.data?.fields) {
                            this.sampleFormFields = this.parseFormFields(response.data.fields);
                        }
                    })
                    .catch(e => {
                        console.error('Alternative form fields fetch failed:', e);
                    });
            },

            parseFormFields(fields) {
                return Object.values(fields).map(field => {
                    const name = field.attributes?.name || field.element;
                    const label = field.settings?.label || field.settings?.admin_field_label || name;
                    
                    return {
                        name: name,
                        label: label,
                        element: field.element,
                        settings: field.settings,
                        attributes: field.attributes
                    };
                }).filter(field => field.name); // Filter out fields without names
            },

            getFormIdFromContext() {
                // Try multiple ways to get the form ID
                if (this.app?.form_id) {
                    return this.app.form_id;
                }
                
                // Check URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const formId = urlParams.get('form_id');
                if (formId) {
                    return formId;
                }
                
                // Check if it's in the global context
                if (window.FluentFormApp?.form_id) {
                    return window.FluentFormApp.form_id;
                }
                
                // Check route parameters
                if (this.$route?.params?.form_id) {
                    return this.$route.params.form_id;
                }
                
                console.log('Could not determine form ID from context');
                return null;
            }
        },
        mounted() {
            console.log('Pdf.vue mounted with app:', this.app); // Debug log
            this.getGlobalPdfSettings();
        }
    };
</script>

<style scoped>
.ff_pdf_wrap {
  min-height: 100vh;
}
</style>

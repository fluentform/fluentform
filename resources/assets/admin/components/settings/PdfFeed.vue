<template>
    <div v-loading="loading" class="ff_feed_editor ff_full_width_feed">
        <el-tabs type="border-card" v-model="activeTab">
            <el-tab-pane :label="$t('PDF Content')" name="content">
                <el-form v-if="feed.settings" label-position="top">
                    <field-mapper
                        :field="{ component: 'value_text', label: $t('Feed Title'), placeholder: $t('Feed Title') }"
                        :editorShortcodes="editorShortcodes"
                        :errors="errors"
                        v-model="feed.name"
                    />

                    <field-mapper
                        v-for="field in settings_fields"
                        :key="field.key"
                        :field="field"
                        :errors="errors"
                        :editorShortcodes="editorShortcodes"
                        v-model="feed.settings[field.key]"
                     />
                </el-form>
                <el-button class="mt-4" v-loading="saving" @click="saveFeed()" type="primary" icon="el-icon-success">
                    {{ $t('Save Feed') }}
                </el-button>
            </el-tab-pane>

            <el-tab-pane :label="$t('Appearance')" name="appearance">
                <el-form v-if="feed.appearance" label-position="top">
                    <field-mapper
                        v-for="field in appearance_fields"
                        :key="field.key"
                        :field="field"
                        :errors="errors"
                        :editorShortcodes="editorShortcodes"
                        v-model="feed.appearance[field.key]"
                    />
                </el-form>
                <el-button class="mt-4" v-loading="saving" @click="saveFeed()" type="primary" icon="el-icon-success">
                    {{ $t('Save Feed') }}
                </el-button>
            </el-tab-pane>

            <!-- NEW: Custom Builder Tab -->
            <el-tab-pane :label="$t('Custom Builder')" name="builder">
                <div class="builder-notice" v-if="!isCustomTemplate">
                    <el-alert
                        :title="$t('Custom Builder Available')"
                        type="info"
                        :description="$t('Switch to custom builder mode to create drag-and-drop PDF layouts')"
                        show-icon
                    />
                    <el-button 
                        @click="enableCustomBuilder" 
                        type="primary" 
                        class="mt-3"
                        icon="el-icon-magic-stick"
                    >
                        {{ $t('Enable Custom Builder') }}
                    </el-button>
                </div>

                <pdf-builder
                    v-else
                    :form-fields="processedFormFields"
                    :template-data="feed.custom_layout || {}"
                    :form-id="form_id"
                    :editor-shortcodes="editorShortcodes"
                    @save="saveCustomLayout"
                    @preview="previewCustomLayout"
                />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script type="text/babel">
import FieldMapper from "./GeneralIntegration/FieldMapper";
import PdfBuilder from '@/admin/components/PdfBuilder/PdfBuilder.vue';

export default {
    name: 'EditAddPdf',
    props: ['edit_id', 'form_id', 'editorShortcodes', 'inputs'],
    components: {
        FieldMapper,
        PdfBuilder
    },
    data() {
        return {
            loading: true,
            saving: false,
            activeTab: 'content',
            feed: {},
            settings_fields: [],
            appearance_fields: [],
            formFields: [],
            errors: new Errors()
        }
    },
    computed: {
        isCustomTemplate() {
            return this.feed.template_type === 'custom' || this.feed.custom_layout;
        },
        
        processedFormFields() {
            // Convert inputs object to array format expected by PdfBuilder
            if (!this.inputs) {
                return this.formFields; // Fallback to API response
            }
            
            return Object.entries(this.inputs).map(([key, field]) => {
                return {
                    name: field.attributes?.name || key,
                    label: field.admin_label || field.attributes?.placeholder || key,
                    element: field.element,
                    attributes: field.attributes,
                    options: field.options
                };
            });
        }
    },
    methods: {
        getFeed() {
            this.loading = true;
            FluentFormsGlobal.$get({
                form_id: this.form_id,
                feed_id: this.edit_id,
                action: 'fluentform_pdf_admin_ajax_actions',
                route: 'get_feed'
            })
                .then(response => {
                    this.feed = response.data.feed;
                    this.settings_fields = response.data.settings_fields;
                    this.appearance_fields = response.data.appearance_fields;
                    this.formFields = response.data.form_fields || [];
                    
                    console.log('Feed data loaded:', {
                        feed: this.feed,
                        formFields: this.formFields,
                        processedFormFields: this.processedFormFields
                    });
                })
                .fail((error) => {
                    console.log(error);
                })
                .always(() => {
                    this.loading = false;
                });
        },

        enableCustomBuilder() {
            this.$confirm(
                this.$t('Switching to custom builder will override current template settings. Continue?'),
                this.$t('Enable Custom Builder'),
                {
                    confirmButtonText: this.$t('Continue'),
                    cancelButtonText: this.$t('Cancel'),
                    type: 'warning'
                }
            ).then(() => {
                this.feed.template_type = 'custom';
                this.feed.custom_layout = {
                    layout: [],
                    pageSize: 'a4',
                    orientation: 'portrait'
                };
                this.saveFeed();
            });
        },

        saveCustomLayout(layoutData) {
            this.feed.custom_layout = layoutData;
            this.feed.template_type = 'custom';
            this.saveFeed();
        },

        previewCustomLayout(layoutData) {
            // Try multiple ways to get the correct AJAX URL
            let ajaxUrl = null;
            
            if (window.ajaxurl) {
                ajaxUrl = window.ajaxurl;
            } else if (window.FluentFormsGlobal?.ajaxurl) {
                ajaxUrl = window.FluentFormsGlobal.ajaxurl;
            } else if (window.fluent_forms_global_var?.ajaxurl) {
                ajaxUrl = window.fluent_forms_global_var.ajaxurl;
            } else {
                // Construct from current URL
                const currentUrl = new URL(window.location.href);
                ajaxUrl = `${currentUrl.protocol}//${currentUrl.host}/wp-admin/admin-ajax.php`;
            }
            
            console.log('Using AJAX URL:', ajaxUrl);
            
            // Alternative approach: Use FluentFormsGlobal.$post if available
            if (typeof FluentFormsGlobal !== 'undefined' && FluentFormsGlobal.$post) {
                this.previewWithAjax(layoutData);
                return;
            }
            
            const previewUrl = ajaxUrl + '?action=fluentform_pdf_admin_ajax_actions&route=preview_custom_layout';
            
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = previewUrl;
            form.target = '_blank';
            
            const layoutInput = document.createElement('input');
            layoutInput.type = 'hidden';
            layoutInput.name = 'layout_data';
            layoutInput.value = JSON.stringify(layoutData);
            
            const feedInput = document.createElement('input');
            feedInput.type = 'hidden';
            feedInput.name = 'feed_id';
            feedInput.value = this.edit_id;
            
            const formInput = document.createElement('input');
            formInput.type = 'hidden';
            formInput.name = 'form_id';
            formInput.value = this.form_id;
            
            const nonceInput = document.createElement('input');
            nonceInput.type = 'hidden';
            nonceInput.name = '_wpnonce';
            nonceInput.value = window.fluent_forms_global_var?.fluent_forms_admin_nonce || '';
            
            form.appendChild(layoutInput);
            form.appendChild(feedInput);
            form.appendChild(formInput);
            form.appendChild(nonceInput);
            
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        },

        previewWithAjax(layoutData) {
            // Alternative approach using AJAX to get preview URL
            FluentFormsGlobal.$post({
                form_id: this.form_id,
                feed_id: this.edit_id,
                action: 'fluentform_pdf_admin_ajax_actions',
                route: 'get_preview_url',
                layout_data: layoutData
            })
                .then(response => {
                    if (response.data.preview_url) {
                        window.open(response.data.preview_url, '_blank');
                    } else {
                        this.$fail(this.$t('Preview URL not available'));
                    }
                })
                .fail((error) => {
                    console.error('Preview failed:', error);
                    this.$fail(this.$t('Preview failed. Please try again.'));
                });
        },

        saveFeed() {
            this.saving = true;
            FluentFormsGlobal.$post({
                form_id: this.form_id,
                feed_id: this.edit_id,
                action: 'fluentform_pdf_admin_ajax_actions',
                route: 'save_feed',
                feed: this.feed
            })
                .then(response => {
                    this.$success(response.data.message);
                })
                .fail((error) => {
                    this.$fail(error.responseJSON.data.message);
                })
                .always(() => {
                    this.saving = false;
                });
        }
    },
    mounted() {
        this.getFeed();
        
        // Debug: Log available global variables
        console.log('Available global variables:', {
            ajaxurl: window.ajaxurl,
            FluentFormsGlobal: window.FluentFormsGlobal,
            fluent_forms_global_var: window.fluent_forms_global_var
        });
    }
}
</script>

<style scoped>
.builder-notice {
    text-align: center;
    padding: 40px 20px;
}

.ff_full_width_feed {
    min-height: 600px;
}
</style>

<template>
    <div v-loading="loading" class="ff_feed_editor ff_full_width_feed">
        <el-tabs class="ff-pdf-settings" type="border-card" v-model="activeTab">
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

            <!-- Custom Builder Tab - Only show for custom builder template -->
            <el-tab-pane class="ff-pdf-custom-builder-tab" v-if="isCustomBuilderTemplate" :label="$t('Custom Builder')" name="builder">
                <pdf-builder
                    :form-fields="processedFormFields"
                    :template-data="feed.custom_layout || {}"
                    :form-id="form_id"
                    :editor-shortcodes="editorShortcodes"
                    :appearance="feed.appearance"
                    @save="saveCustomLayout"
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
        isCustomBuilderTemplate() {
            return this.feed.template_key === 'custom';
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
                })
                .fail((error) => {
                    console.log(error);
                })
                .always(() => {
                    this.loading = false;
                });
        },

        saveCustomLayout(layoutData) {
            this.feed.custom_layout = layoutData;
            this.saveFeed();
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

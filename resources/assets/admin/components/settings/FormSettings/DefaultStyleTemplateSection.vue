
<template>
    <card id="default-style-template">
        <card-head>
            <card-head-group>
                <h5 class="title">{{ $t('Default Style Template') }}</h5>
                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                    <div slot="content">
                        <p>
                            {{ $t('Set default styles (CSS, JavaScript, and Form Styler settings) that will be automatically applied to all newly created forms.') }}
                        </p>
                    </div>
                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                </el-tooltip>
            </card-head-group>
        </card-head>
        <card-body>
            <el-skeleton :loading="loading" animated :rows="5">
                <template v-if="app_ready">
                    <!-- Enable/Disable Toggle -->
                    <div class="el-form-item-wrap">
                        <el-form-item class="ff-form-item-flex ff-form-item mb-3 ff-form-setting-label-width">
                            <template slot="label">
                                <span>
                                    {{ $t('Enable Default Style Template') }}
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                        <div slot="content">
                                            <p>
                                                {{ $t('When enabled, all newly created forms will automatically inherit the styles configured below.') }}
                                            </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-switch
                                active-value="yes"
                                inactive-value="no"
                                class="el-switch-lg"
                                v-model="settings.enabled"
                            ></el-switch>
                        </el-form-item>
                    </div>

                    <template v-if="settings.enabled === 'yes'">
                        <!-- Copy from Existing Form -->
                        <div class="el-form-item-wrap">
                            <el-form-item class="ff-form-item">
                                <template slot="label">
                                    <span>
                                        {{ $t('Copy Styles from Existing Form') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p>
                                                    {{ $t('Select a form to copy its custom CSS, JavaScript, and Form Styler settings as the default template.') }}
                                                </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </span>
                                </template>
                                <el-row :gutter="10">
                                    <el-col :span="18">
                                        <el-select
                                            v-model="selectedFormId"
                                            :placeholder="$t('Select a form')"
                                            filterable
                                            clearable
                                            class="w-100"
                                        >
                                            <el-option
                                                v-for="form in forms"
                                                :key="form.id"
                                                :label="form.title"
                                                :value="form.id"
                                            >
                                                <span>{{ form.title }}</span>
                                                <span style="float: right; color: #8492a6; font-size: 13px">ID: {{ form.id }}</span>
                                            </el-option>
                                        </el-select>
                                    </el-col>
                                    <el-col :span="6">
                                        <el-button
                                            type="primary"
                                            @click="copyFormStyles"
                                            :disabled="!selectedFormId"
                                            :loading="loadingFormStyles"
                                        >
                                            {{ $t('Copy Styles') }}
                                        </el-button>
                                    </el-col>
                                </el-row>
                            </el-form-item>
                        </div>


                        <!-- Display Copied Styles Info -->
                        <notice v-if="copiedFromForm" type="success" class="mb-3">
                            <p style="margin: 0;">
                                <i class="el-icon-success" style="margin-right: 8px;"></i>
                                <strong>{{ $t('Styles copied from: ') }}</strong>{{ copiedFromForm }}
                            </p>
                        </notice>

                        <!-- Custom CSS Section -->
                        <div class="el-form-item-wrap">
                            <el-form-item class="ff-form-item">
                                <template slot="label">
                                    <span>
                                        {{ $t('Additional Custom CSS') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p>
                                                    {{ $t('Add additional custom CSS that will be applied to all new forms. This will be added on top of any copied styles. Use .fluent_form_FF_ID as selector where FF_ID will be replaced with form ID.') }}
                                                </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </span>
                                </template>
                                <ace-editor-css
                                    v-if="showEditors"
                                    editor_id="default_template_additional_css"
                                    mode="css"
                                    v-model="settings.additional_css"
                                    :aceLoaded="aceLoaded"
                                />
                            </el-form-item>
                        </div>

                        <!-- Custom JS Section -->
                        <div class="el-form-item-wrap">
                            <el-form-item class="ff-form-item">
                                <template slot="label">
                                    <span>
                                        {{ $t('Additional Custom JavaScript') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p>
                                                    {{ $t('Add additional custom JavaScript that will be applied to all new forms. This will be added on top of any copied styles.') }}
                                                </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </span>
                                </template>
                                <ace-editor-js
                                    v-if="showEditors"
                                    editor_id="default_template_additional_js"
                                    mode="javascript"
                                    v-model="settings.additional_js"
                                    :aceLoaded="aceLoaded"
                                />
                            </el-form-item>
                        </div>

                        <!-- Form Styler Section (Pro Feature) -->
                        <template v-if="hasPro">
                            <div class="el-form-item-wrap">
                                <el-form-item class="ff-form-item-flex ff-form-item mb-3 ff-form-setting-label-width">
                                    <template slot="label">
                                        <span>
                                            {{ $t('Include Form Styler Settings') }}
                                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                                <div slot="content">
                                                    <p>
                                                        {{ $t('Enable this to include Form Styler theme and styles in the default template.') }}
                                                    </p>
                                                </div>
                                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                            </el-tooltip>
                                        </span>
                                    </template>
                                    <el-switch
                                        active-value="yes"
                                        inactive-value="no"
                                        class="el-switch-lg"
                                        v-model="settings.styler_enabled"
                                    ></el-switch>
                                </el-form-item>
                            </div>

                            <template v-if="settings.styler_enabled === 'yes'">
                                <div class="el-form-item-wrap">
                                    <el-form-item class="ff-form-item">
                                        <template slot="label">
                                            {{ $t('Form Styler Theme') }}
                                        </template>
                                        <el-input
                                            v-model="settings.styler_theme"
                                            :placeholder="$t('Enter theme name (e.g., default, modern, classic)')"
                                        ></el-input>
                                    </el-form-item>
                                </div>

                                <div class="el-form-item-wrap">
                                    <el-form-item class="ff-form-item">
                                        <template slot="label">
                                            {{ $t('Form Styler Styles (JSON)') }}
                                        </template>
                                        <el-input
                                            type="textarea"
                                            :rows="6"
                                            v-model="styler_styles_json"
                                            :placeholder="$t('Enter Form Styler styles as JSON')"
                                        ></el-input>
                                    </el-form-item>
                                </div>
                            </template>
                        </template>

                        <!-- Clear Settings Button -->
                        <div class="el-form-item-wrap">
                            <el-button
                                type="danger"
                                plain
                                size="small"
                                @click="clearSettings"
                            >
                                {{ $t('Clear Default Style Template') }}
                            </el-button>
                        </div>
                    </template>
                </template>
            </el-skeleton>
        </card-body>
    </card>
</template>

<script type="text/babel">
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';
    import Notice from '@/admin/components/Notice/Notice.vue';
    import AceEditorCss from '@/common/_ace_editor_css';
    import AceEditorJs from '@/common/_ace_editor_js';

    export default {
        name: "DefaultStyleTemplateSection",
        components: {
            Card,
            CardHead,
            CardBody,
            CardHeadGroup,
            Notice,
            AceEditorCss,
            AceEditorJs
        },
        props: {
            default_style_template: {
                required: true
            }
        },
        data() {
            return {
                loading: false,
                app_ready: true,
                showEditors: false,
                aceLoaded: false,
                ace_path: window.FluentFormApp?.ace_path_url || window.fluent_forms_global_var?.ace_path_url || '',
                forms: window.fluent_forms_global_var?.forms || [],
                selectedFormId: null,
                loadingFormStyles: false,
                copiedFromForm: '',
                styler_styles_json: '',
                hasPro: !!(window.FluentFormApp?.has_pro || window.fluent_forms_global_var?.hasPro)
            }
        },
        computed: {
            settings: {
                get() {
                    return this.default_style_template;
                },
                set(value) {
                    // Emit changes to parent
                    this.$emit('update:default_style_template', value);
                }
            }
        },
        watch: {
            'settings.styler_styles': {
                handler(newVal) {
                    try {
                        this.styler_styles_json = JSON.stringify(newVal, null, 2);
                    } catch (e) {
                        this.styler_styles_json = '';
                    }
                },
                deep: true
            },
            'styler_styles_json': {
                handler(newVal) {
                    try {
                        this.settings.styler_styles = JSON.parse(newVal);
                    } catch (e) {
                        // Invalid JSON, keep the old value
                    }
                }
            }
        },
        methods: {
            copyFormStyles() {
                if (!this.selectedFormId) {
                    return;
                }

                this.loadingFormStyles = true;
                const url = FluentFormsGlobal.$rest.route('getFormSettings', this.selectedFormId);

                FluentFormsGlobal.$rest.get(url)
                    .then(response => {
                        const formSettings = response.form_settings || {};

                        // Copy custom CSS
                        if (formSettings._custom_form_css) {
                            this.settings.custom_css = formSettings._custom_form_css;
                        }

                        // Copy custom JS
                        if (formSettings._custom_form_js) {
                            this.settings.custom_js = formSettings._custom_form_js;
                        }

                        // Copy Form Styler settings if Pro is available
                        if (this.hasPro) {
                            if (formSettings._ff_selected_style) {
                                this.settings.styler_theme = formSettings._ff_selected_style;
                                this.settings.styler_enabled = 'yes';
                            }

                            if (formSettings._ff_form_styles) {
                                try {
                                    this.settings.styler_styles = typeof formSettings._ff_form_styles === 'string'
                                        ? JSON.parse(formSettings._ff_form_styles)
                                        : formSettings._ff_form_styles;
                                } catch (e) {
                                    this.settings.styler_styles = {};
                                }
                            }
                        }

                        // Store the source form ID
                        this.settings.source_form_id = this.selectedFormId;

                        // Update the copied from form name
                        this.updateCopiedFromFormName(this.selectedFormId);

                        this.$success(this.$t('Styles copied successfully! Click "Save Settings" to apply.'));
                    })
                    .catch(e => {
                        this.$fail(e.message || this.$t('Failed to copy form styles'));
                    })
                    .finally(() => {
                        this.loadingFormStyles = false;
                    });
            },
            updateCopiedFromFormName(formId) {
                const form = this.forms.find(f => f.id == formId);
                if (form) {
                    this.copiedFromForm = form.title + ' (ID: ' + formId + ')';
                }
            },
            clearSettings() {
                this.$confirm(
                    this.$t('This will clear all default style template settings. Are you sure?'),
                    this.$t('Warning'),
                    {
                        confirmButtonText: this.$t('Yes, Clear'),
                        cancelButtonText: this.$t('Cancel'),
                        type: 'warning'
                    }
                ).then(() => {
                    this.settings = {
                        enabled: 'no',
                        custom_css: '',
                        custom_js: '',
                        styler_enabled: 'no',
                        styler_theme: '',
                        styler_styles: {},
                        source_form_id: null
                    };
                    this.copiedFromForm = '';
                    this.selectedFormId = null;
                    this.$success(this.$t('Default style template cleared. Click "Save Settings" to apply changes.'));
                }).catch(() => {
                    // User cancelled
                });
            },
            initAce() {
                console.log('initAce called');
                console.log('ace_path:', this.ace_path);
                console.log('typeof ace:', typeof ace);

                if (typeof ace == 'undefined') {
                    // If ace_path is empty, try to construct it from script tags
                    if (!this.ace_path) {
                        console.log('ace_path is empty, trying to construct from script tags');
                        const scriptTags = document.querySelectorAll('script[src*="fluentform"]');
                        console.log('Found script tags:', scriptTags.length);

                        if (scriptTags.length > 0) {
                            for (let i = 0; i < scriptTags.length; i++) {
                                const scriptSrc = scriptTags[i].src;
                                console.log('Script', i, ':', scriptSrc);
                                if (scriptSrc.includes('/public/')) {
                                    const publicIndex = scriptSrc.indexOf('/public/');
                                    const pluginUrl = scriptSrc.substring(0, publicIndex + 8);
                                    this.ace_path = pluginUrl + 'libs/ace';
                                    console.log('Constructed ace_path:', this.ace_path);
                                    break;
                                }
                            }
                        }
                    }

                    if (this.ace_path) {
                        const scriptUrl = this.ace_path + '/ace.min.js';
                        console.log('Loading ACE from:', scriptUrl);
                        jQuery.get(scriptUrl, () => {
                            console.log('ACE loaded successfully');
                            this.aceLoaded = true;
                        }).fail((jqxhr, settings, exception) => {
                            console.error('Failed to load ACE:', exception);
                            console.error('Status:', jqxhr.status);
                            console.error('URL:', scriptUrl);
                        });
                    } else {
                        console.error('ACE editor path not available');
                    }
                } else {
                    console.log('ACE already loaded');
                    this.aceLoaded = true;
                }
            }
        },
        mounted() {
            this.initAce();
            this.showEditors = true;

            // Restore the copied from form name if source_form_id exists
            if (this.settings.source_form_id) {
                this.updateCopiedFromFormName(this.settings.source_form_id);
            }
        }
    }
</script>


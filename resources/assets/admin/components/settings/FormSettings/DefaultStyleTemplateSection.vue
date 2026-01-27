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
                                v-model="default_style_template.enabled"
                            ></el-switch>
                        </el-form-item>
                    </div>

                    <template v-if="default_style_template.enabled === 'yes'">
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
                                                :value="parseInt(form.id)"
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


                        <!-- Custom CSS Section -->
                        <div class="el-form-item-wrap">
                            <el-form-item class="ff-form-item">
                                <template slot="label">
                                    <span>
                                        {{ $t('Custom CSS') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p>
                                                    {{ $t('Custom CSS that will be applied to all new forms. Use .fluent_form_FF_ID as selector where FF_ID will be replaced with form ID.') }}
                                                </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </span>
                                </template>
                                <ace-editor-css
                                    editor_id="default_template_custom_css"
                                    mode="css"
                                    v-model="default_style_template.custom_css"
                                    :aceLoaded="aceLoaded"
                                />
                            </el-form-item>
                        </div>
                        <template >
                        <div class="el-form-item-wrap">
                          <el-form-item class="ff-form-item">
                            <template slot="label">
                              {{ $t('Form Styler Theme') }}
                            </template>
                            <el-select
                              v-model="default_style_template.styler_theme"
                              :placeholder="$t('Select a theme')"
                              class="w-100"
                            >
                              <el-option
                                v-for="(preset, key) in stylePresets"
                                :key="key"
                                :value="key"
                                :label="preset.label"
                              ></el-option>
                            </el-select>
                          </el-form-item>
                        </div>

                      </template>

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
                                        v-model="default_style_template.styler_enabled"
                                    ></el-switch>
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
        </card-body>
    </card>
</template>

<script type="text/babel">
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';
    import AceEditorCss from '@/common/_ace_editor_css';
    import notifier from '@/admin/notifier';

    export default {
        name: "DefaultStyleTemplateSection",
        mixins: [notifier],
        components: {
            Card,
            CardHead,
            CardBody,
            CardHeadGroup,
            AceEditorCss
        },
        props: {
            default_style_template: {
                required: true
            }
        },
        data() {
            return {
                aceLoaded: false,
                ace_path: window.FluentFormApp?.ace_path_url || window.fluent_forms_global_var?.ace_path_url || '',
                forms: window.fluent_forms_global_var?.forms || [],
                selectedFormId: null,
                loadingFormStyles: false,
                styler_styles_json: '',
                hasPro: !!(window.FluentFormApp?.has_pro || window.fluent_forms_global_var?.hasPro),
                stylePresets: {
                    'ffs_default': { label: 'Default' },
                    'ffs_inherit_theme': { label: 'Inherit Theme Style' }
                }
            }
        },
        watch: {
            'default_style_template.styler_styles': {
                handler(newVal) {
                    try {
                        this.styler_styles_json = JSON.stringify(newVal, null, 2);
                    } catch (e) {
                        this.styler_styles_json = '';
                    }
                },
                deep: true,
                immediate: true
            },
            'styler_styles_json': {
                handler(newVal) {
                    try {
                        this.$set(this.default_style_template, 'styler_styles', JSON.parse(newVal));
                    } catch (e) {
                        // Invalid JSON, keep the old value
                    }
                }
            },
            selectedFormId(newVal) {
                this.$set(this.default_style_template, 'source_form_id', newVal);
            }
        },
        methods: {
            copyFormStyles() {
                if (!this.selectedFormId) {
                    return;
                }

                this.loadingFormStyles = true;
                const url = FluentFormsGlobal.$rest.route('getFormSettingsCustomizer', this.selectedFormId);

                FluentFormsGlobal.$rest.get(url)
                    .then(response => {
                        // Copy custom CSS
                        this.$set(this.default_style_template, 'custom_css', response.css || '');
                        this.$set(this.default_style_template, 'styler_theme', response.styler_theme);

                        // Copy Form Styler theme if Pro is available
                        if (this.hasPro) {
                            if(response.styler_theme) {
                                this.$set(this.default_style_template, 'styler_enabled', 'yes');
                            }
                            if(response.styler_styles) {
                                this.$set(this.default_style_template, 'styler_styles', response.styler_styles);
                            }
                        }

                        this.$success(this.$t('Styles copied successfully! Click "Save Settings" to apply.'));
                    })
                    .catch(e => {
                        console.log(e);
                        this.$fail(e.message || this.$t('Failed to copy form styles'));
                    })
                    .finally(() => {
                        this.loadingFormStyles = false;
                    });
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
                    Object.assign(this.default_style_template, {
                        enabled: 'no',
                        custom_css: '',
                        styler_enabled: 'no',
                        styler_theme: '',
                        styler_styles: {}
                    });
                    this.selectedFormId = null;
                    this.styler_styles_json = '';
                    this.$success(this.$t('Default style template cleared. Click "Save Settings" to apply changes.'));
                }).catch(() => {
                    // User cancelled
                });
            },
            initAce() {
                if (typeof ace == 'undefined') {
                    if (this.ace_path) {
                        const scriptUrl = this.ace_path + '/ace.min.js';
                        jQuery.get(scriptUrl, () => {
                            this.aceLoaded = true;
                        });
                    }
                } else {
                    this.aceLoaded = true;
                }
            },
            fetchStylePresets() {
                // Fetch available style presets using the first form
                if (this.forms.length > 0) {
                    const formId = this.forms[0].id;
                    const url = FluentFormsGlobal.$rest.route('getPresetSettings', formId);
                    FluentFormsGlobal.$rest.get(url)
                        .then(response => {
                            if (response.presets) {
                                this.stylePresets = response.presets;
                            }
                        })
                        .catch(() => {
                            // Keep default presets on error
                        });
                }
            }
        },
        mounted() {
            this.initAce();
            this.fetchStylePresets();
            this.selectedFormId = this.default_style_template.source_form_id || null;
        }
    }
</script>




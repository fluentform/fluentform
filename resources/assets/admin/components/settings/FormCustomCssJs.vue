<template>
    <div class="custom_css_js">
        <card>
            <card-head>
                <h5 class="title"> {{ $t('Custom CSS & JS') }}</h5>
            </card-head>
            <card-body>
                <div class="edit_form_warpper">
                    <el-skeleton :loading="fetching" animated :rows="6">
                        <div class="all_payforms_wrapper payform_section">
                            <div class="payform_section_body">
                                <!-- AI Form Styler Component -->
                                <ai-form-styler
                                    :form_id="form_id"
                                    @styles-applied="onStylesApplied"
                                />

                                <div class="wpf_settings_section mb-6">
                                    <div class="sub_section_header">
                                        <h6 class="mb-2">{{ $t('Custom CSS') }}</h6>
                                        <p>{{ $t('You can write your custom CSS here for this form. This css will be applied in this current form only.') }}</p>
                                    </div>
                                    <hr class="mt-3 mb-3"/>
                                    <div v-if="showEditors" class="sub_section_body">
                                        <p
                                            class="mb-4"
                                            v-html="
                                                $t(
                                                    'You may add %s as your css selector prefix to target this specific form. Alternatively, you can use %s where %s will be replaced with your form id dynamically.',
                                                    `<code>.fluent_form_${form_id}</code>`,
                                                    '<code>.fluent_form_FF_ID</code>',
                                                    '<b>FF_ID</b>'
                                                )
                                            "
                                        >
                                        </p>
                                        <ace-editor-css editor_id="wpf_custom_css" mode="css" v-model="custom_css" :aceLoaded="aceLoaded" />
                                        <p
                                            class="mt-2"
                                            v-html="
                                            $t(
                                                'Please don\'t include %s tag',
                                                '<code>&amp;lt;style&amp;gt;&amp;lt;/style&amp;gt;</code>'
                                            )"
                                        >
                                        </p>
                                    </div>
                                </div>

                                <div class="wpf_settings_section">
                                    <div class="sub_section_header">
                                        <h6 class="mb-2">{{ $t('Custom Javascript') }}</h6>
                                        <p>{{ $t('Your additional JS code will run after this form initialized. Please provide valid javascript code. Invalid JS code may break the Form.') }}</p>
                                        <p v-if="is_conversion_form" style="color: red">{{ $t('Please note that, In Conversational Form Style, Custom Javascript will not work') }}</p>
                                    </div>
                                    <hr class="mt-3 mb-3"/>
                                    <div v-if="showEditors" class="sub_section_body">
                                        <div class="js_instruction mb-4">
                                            <p
                                                v-html="
                                                $t(
                                                    'The Following Javascript variables are available that you can use %s %s$form:%s The Javascript(jQuery) DOM object of the Form',
                                                    '</br>',
                                                    '<b>',
                                                    '</b>',
                                                )"
                                            >
                                            </p>
                                        </div>
                                        <ace-editor-js editor_id="wpf_custom_js" mode="javascript" v-model="custom_js" :aceLoaded="aceLoaded" />
                                        <p
                                            class="mt-2"
                                            v-html="
                                            $t(
                                                'Please don\'t include %s tag',
                                                '<code>&amp;lt;script&amp;gt;&amp;lt;/script&amp;gt;</code>'
                                            )"
                                        >
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-skeleton>
                </div>
            </card-body>
        </card>

        <el-button v-loading="saving"
            @click="saveSettings()"
            class="payform_action"
            type="primary"
            icon="el-icon-success">
            {{ $t( 'Save CSS & JS' ) }}
        </el-button>
    </div>
</template>

<script type="text/babel">
    import AceEditorCss from '@/common/_ace_editor_css';
    import AceEditorJs from '@/common/_ace_editor_js';
    import Card from '@/admin/components/Card/Card.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import AiFormStyler from './AiFormStyler.vue';

    export default {
        name: 'custom_css_js',
        components: {
            AceEditorCss,
            AceEditorJs,
            Card,
            CardHead,
            CardBody,
            AiFormStyler
        },
        props: ['form_id'],
        data() {
            return {
                fetching: false,
                saving: false,
                custom_css: '',
                custom_js: '',
                is_conversion_form: !!window.FluentFormApp.is_conversion_form,
                showEditors: false,
                aceLoaded: false,
                ace_path: window.FluentFormApp.ace_path_url,
            }
        },
        methods: {
            fetchSettings() {
                this.fetching = true;

                const url = FluentFormsGlobal.$rest.route('getFormSettingsCustomizer', this.form_id);

                FluentFormsGlobal.$rest.get(url)
                    .then(response => {
                        this.custom_css = response.css;
                        this.custom_js = response.js;
                        this.showEditors = true;
                    })
                    .catch(error => {

                    })
                    .finally(() => {
                        this.fetching = false;
                    });
            },
            saveSettings() {
                this.saving = true;

                const data = {
                    css: this.custom_css,
                    js: this.custom_js
                };

                const url = FluentFormsGlobal.$rest.route('storeFormSettingsCustomizer', this.form_id);

                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        this.$success(response.message);
                    })
                    .catch(error => {
                        this.$fail(error.message);
                    })
                    .finally(() => {
                        this.saving = false;
                    });
            },
            onStylesApplied(css) {
                // When AI styles are applied, refresh the custom CSS to show the new styles
                this.custom_css = css;

                // Force refresh of the page to show the applied styles
                setTimeout(() => {
                    window.location.reload();
                }, 1500);

                this.$success(this.$t('AI styles have been applied! The page will refresh to show the changes.'));
            },
            initAce() {
                if (typeof ace == 'undefined') {
                    jQuery.get(this.ace_path + '/ace.min.js', () => {
                        this.aceLoaded = true;
                    });
                } else {
                    this.aceLoaded = true;
                }
            }
        },
        mounted() {
            this.initAce();
            this.fetchSettings();
            jQuery('head title').text('Custom CSS & JS - Fluent Forms');
        }
    }
</script>

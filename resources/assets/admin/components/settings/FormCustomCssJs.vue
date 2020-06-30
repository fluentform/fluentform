<template>
    <div class="custom_css_js">

        <el-row class="setting_header">
            <el-col :md="12">
                <h2> {{ $t('Custom CSS and JS') }}</h2>
            </el-col>
            <el-col :md="12" class="action-buttons clearfix mb15 text-right">
                <el-button v-loading="saving" @click="saveSettings()" class="payform_action" size="small"
                           type="primary">
                    {{ $t( 'Save CSS and JS' ) }}
                </el-button>
            </el-col>
        </el-row>

        <div v-loading="fetching" class="edit_form_warpper">
            <div class="all_payforms_wrapper payform_section">
                <div class="payform_section_body">
                    <div class="wpf_settings_section">
                        <div class="sub_section_header">
                            <h3>Custom CSS</h3>
                            <p>You can write your custom CSS here for this form. This css will be applied in this
                                current form only.</p>
                        </div>
                        <hr/>
                        <div v-if="!fetching" class="sub_section_body">
                            <p>You may add <code>.fluent_form_{{form_id}} </code> as your css selector prefix to
                                target this specific form. Alternatively, you can use <code>.fluent_form_FF_ID</code> where <b>FF_ID</b> will be replaced with your form id dynamically</p>
                            <ace-editor-css editor_id="wpf_custom_css" mode="css" v-model="custom_css"/>
                            <br/>
                            <span>Please don't include <code>&lt;style&gt;&lt;/style&gt;</code> tag</span>
                        </div>
                    </div>

                    <div class="wpf_settings_section">
                        <div class="sub_section_header">
                            <h3>Custom Javascript</h3>
                            <p>Your additional JS code will run after this form initialized. Please provide valid
                                javascript code. Invalid JS code may break the Form.</p>
                        </div>
                        <hr/>
                        <div v-if="!fetching" class="sub_section_body">
                            <div class="js_instruction">
                                The Following Javascript variables are available that you can use:<br />
                                <b>$form</b>: The Javascript (jQuery) DOM object of the Form
                            </div>
                            <br/>
                            <ace-editor-js editor_id="wpf_custom_js" mode="javascript" v-model="custom_js"/>
                            <br/>
                            <span>Please don't include <code>&lt;script>&lt;/script&gt;</code> tag</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script type="text/babel">
    import AceEditorCss from '../../../common/_ace_editor_css';
    import AceEditorJs from '../../../common/_ace_editor_js';

    export default {
        name: 'custom_css_js',
        components: {
            AceEditorCss,
            AceEditorJs
        },
        props: ['form_id'],
        data() {
            return {
                fetching: false,
                saving: false,
                custom_css: '',
                custom_js: ''
            }
        },
        methods: {
            fetchSettings() {
                this.fetching = true;
                jQuery.get(window.ajaxurl, {
                    action: 'fluentform-get-form-custom_css_js',
                    form_id: this.form_id
                })
                    .then(response => {
                        this.custom_css = response.data.custom_css;
                        this.custom_js = response.data.custom_js;
                    })
                    .fail(error => {
                        this.$showAjaxError(error);
                    })
                    .always(() => {
                        this.fetching = false;
                    });
            },
            saveSettings() {
                this.saving = true;
                jQuery.post(window.ajaxurl, {
                    action: 'fluentform-save-form-custom_css_js',
                    form_id: this.form_id,
                    custom_css: this.custom_css,
                    custom_js: this.custom_js
                })
                    .then(response => {
                        this.$notify.success(response.data.message);
                    })
                    .fail(error => {
                        this.$showAjaxError(error);
                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            $showAjaxError(error) {
                if (error.responseJSON && error.responseJSON.message) {
                    this.$notify.error(error.responseJSON.message);
                } else if (error.responseText) {
                    this.$notify.error(error.responseText);
                } else {
                    this.$notify.error('Something is wrong when doing ajax request! Please try again');
                }
            }
        },
        mounted() {
            this.fetchSettings();
            jQuery('head title').text('Custom CSS & JS - Fluent Forms');
        }
    }
</script>

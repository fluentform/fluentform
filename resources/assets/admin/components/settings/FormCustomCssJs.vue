<template>
    <div class="custom_css_js">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Custom CSS & JS') }}</h5>
            </card-head>
            <card-body>
                <div class="edit_form_warpper">
                    <el-skeleton :loading="fetching" animated :rows="6">
                        <div class="ff_wrapper ff_section">
                            <div class="ff_section_body">
                                <!-- CSS Editor Section -->
                                <div class="wpf_settings_section mb-6">
                                    <div class="sub_section_header">
                                        <h6 class="mb-2">{{ $t('Custom CSS') }}</h6>
                                        <p>{{ $t('You can write your custom CSS here for this form. This css will be applied in this current form only.') }}</p>
                                    </div>
                                    <hr class="mt-3 mb-3"/>
                                    <div class="sub_section_body">
                                        <p class="mb-4">{{ $t('You may add ') }}<code>.fluent_form_{{ form_id }} </code>{{ $t('as your css selector prefix to target this specific form.') }}</p>
                                        <v-ace-editor
                                            v-model:value="custom_css"
                                            lang="css"
                                            theme="monokai"
                                            style="height: 400px"
                                        />
                                        <p class="mt-2">{{ $t('Please don\'t include ') }}<code>&lt;style&gt;&lt;/style&gt;</code> tag</p>
                                    </div>
                                </div>

                                <!-- JS Editor Section -->
                                <div class="wpf_settings_section">
                                    <div class="sub_section_header">
                                        <h6 class="mb-2">{{ $t('Custom Javascript') }}</h6>
                                        <p>{{ $t('Your additional JS code will run after this form initialized. Please provide valid javascript code. Invalid JS code may break the Form.') }}</p>
                                        <p v-if="is_conversion_form" style="color: red">{{ $t('Please note that, In Conversational Form Style, Custom Javascript will not work') }}</p>
                                    </div>
                                    <hr class="mt-3 mb-3"/>
                                    <div class="sub_section_body">
                                        <div class="js_instruction mb-4">
                                            <p>{{ $t('The Following Javascript variables are available that you can use') }}:</p>
                                            <p><b>$form</b>: {{ $t('The Javascript(jQuery) DOM object of the Form') }}</p>
                                        </div>
                                        <v-ace-editor
                                            v-model:value="custom_js"
                                            lang="javascript"
                                            theme="monokai"
                                            style="height: 400px"
                                        />
                                        <p class="mt-2">{{ $t('Please don\'t include ') }} <code>&lt;script>&lt;/script&gt;</code> tag</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </el-skeleton>
                </div>
            </card-body>
        </card>

        <el-button v-loading="saving" @click="saveSettings()" class="ff_action" type="primary" size="large">
            <template #icon>
                <i class="el-icon-success"></i>
            </template>
            {{ $t('Save CSS & JS') }}
        </el-button>
    </div>
</template>

<script>
import AceEditorCss from '@/common/_ace_editor_css.vue';
import AceEditorJs from '@/common/_ace_editor_js.vue';
import Card from '@/admin/components/Card/Card.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import { VAceEditor } from 'vue3-ace-editor';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';

export default {
    name: 'custom_css_js',
    components: {
        AceEditorCss,
        AceEditorJs,
        Card,
        CardHead,
        CardBody,
        VAceEditor
    },
    props: ['form_id'],
    data() {
        return {
            fetching: false,
            saving: false,
            custom_css: '',
            custom_js: '',
            is_conversion_form: !!window.FluentFormApp.is_conversion_form,
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
    },
    mounted() {
        // this.initAce();
        this.fetchSettings();
        jQuery('head title').text('Custom CSS & JS - Fluent Forms');
    }
}
</script>
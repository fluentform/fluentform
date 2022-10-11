<template>
    <div class="fcc_conversational_design">
        <template v-if="!loading">
            <div class="ffc_design_sidebar">
                <div class="ffc_sidebar_header">
                    <ul>
                        <li :class="{ffc_active : active_tab == 'design'}" @click="active_tab = 'design'">{{ $t('Design') }}</li>
                        <li :class="{ffc_active : active_tab == 'meta'}" @click="active_tab = 'meta'">{{ $t('Meta') }}</li>
                        <li :class="{ffc_active : active_tab == 'share'}" @click="active_tab = 'share'">{{ $t('Share') }}</li>
                    </ul>
                </div>
                <div v-loading="saving" class="ffc_sidebar_body">
                    <design-elements :has_pro="has_pro" :fonts="fonts" v-if="active_tab == 'design'" :design_settings="design_settings"/>
                    <div style="padding-top: 20px;" v-else-if="active_tab == 'meta'">
                        <p>{{ $t('Set your social sharing meta texts and form messages here') }}</p>
                    </div>
                    <div style="padding-top: 20px;" v-else-if="active_tab == 'share'">
                        <p>{{ $t('Share your form by unique URL or copy and paste the ') }}<em>shorcode</em>{{ $t(' to embed in your page and post') }}</p>
                    </div>
                    <div v-if="(active_tab == 'design' && has_pro) || active_tab == 'meta'" class="ffc_design_submit">
                        <el-button type="primary" @click="saveDesignSettings()">{{ $t('Save Settings') }}</el-button>
                    </div>
                </div>
            </div>
            <div class="ffc_design_container">
                <design-preview :meta_settings="meta_settings" :has_pro="has_pro" v-if="active_tab == 'design'" :fonts="fonts" @css_generated="(css) => { generated_css = css; }"
                                :design_settings="design_settings"
                                :form_id="form_id"/>
                <meta-setting-view v-else-if="active_tab == 'meta'" :meta_settings="meta_settings"/>
                <sharing-view v-else-if="active_tab == 'share'" :form_id="form_id" :share_url="share_url" :meta_settings="meta_settings"/>
            </div>
        </template>
        <h3 v-else>{{ $t('Loading Design... Please wait') }}</h3>
    </div>
</template>

<script type="text/babel">
import DesignPreview from './DesignPreview';
import DesignElements from './DesignElements';
import MetaSettingView from './MetaSettings';
import SharingView from './SharingView';

export default {
    name: 'ConversationalDesign',
    components: {
        DesignPreview,
        DesignElements,
        MetaSettingView,
        SharingView
    },
    data() {
        return {
            active_tab: 'design',
            form_id: window.ffc_conv_vars.form_id,
            design_settings: {},
            meta_settings: {},
            generated_css: '',
            saving: false,
            loading: true,
            share_url: '',
            has_pro: !!window.ffc_conv_vars.has_pro,
            fonts: window.ffc_conv_vars.fonts
        }
    },
    methods: {
        saveDesignSettings() {
            this.saving = true;

            let data = {
                action: 'ff_store_conversational_form_settings',
                form_id: this.form_id,
                design_settings: this.design_settings,
                meta_settings: this.meta_settings,
                generated_css: this.generated_css
            };

            this.setBaseUrl();

            FluentFormsGlobal.$post(data)
                .then(response => {
                    this.$notify.success({
                        title: 'Success',
                        message: response.data.message,
                        offset: 30
                    });
                })
                .fail(error => {
                    console.log(error);
                })
                .always(() => {
                    this.saving = false;
                });
        },
        fetchSettings() {
            this.loading = true;

            let data = {
                action: 'ff_get_conversational_form_settings',
                form_id: this.form_id
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    const designSettings = response.data.design_settings;
                    designSettings.background_brightness = parseInt(designSettings.background_brightness);
                    this.design_settings = designSettings;
                    this.meta_settings = response.data.meta_settings;
                    this.has_pro = !!response.data.has_pro;
                    this.setBaseUrl();
                })
                .fail(error => {
                    console.log(error);
                })
                .always(() => {
                    this.loading = false;
                });
        },
        setBaseUrl() {
            let baseUrl = window.ffc_conv_vars.preview_url;
            if (this.meta_settings.share_key) {
                baseUrl += '&form='+ this.meta_settings.share_key;
            }
            this.share_url = baseUrl;
        }
    },
    mounted() {
        this.fetchSettings();
    }
}
</script>

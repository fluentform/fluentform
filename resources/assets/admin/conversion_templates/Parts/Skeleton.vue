<template>
    <div class="fcc_conversational_design">
        <template v-if="!loading">
            <el-alert
                v-if="settings_error"
                class="mb-4"
                type="error"
                show-icon
                :closable="false"
                :title="settings_error"
            />
            <card class="ffc_design_sidebar">
                <div class="ffc_sidebar_header">
                    <tab class="ff_tab_center">
                        <tab-item :class="{active : active_tab == 'design'}" @click="active_tab = 'design'">
                            <a href="#" class="ff_tab_link" @click.prevent>{{ $t('Design') }}</a>
                        </tab-item>
                        <tab-item :class="{active : active_tab == 'meta'}" @click="active_tab = 'meta'">
                            <a href="#" class="ff_tab_link" @click.prevent>{{ $t('Meta') }}</a>
                        </tab-item>
                        <tab-item :class="{active : active_tab == 'share'}" @click="active_tab = 'share'">
                            <a href="#" class="ff_tab_link" @click.prevent>{{ $t('Share') }}</a>
                        </tab-item>
                    </tab>
                </div>
                <div v-loading="saving" class="ffc_sidebar_body">
                    <design-elements :has_pro="has_pro" :fonts="fonts" v-if="active_tab == 'design'" :design_settings="design_settings"/>
                    <div v-else-if="active_tab == 'meta'">
                        <p>{{ $t('Set your social sharing meta texts and form messages here') }}</p>
                    </div>
                    <div v-else-if="active_tab == 'share'">
                        <p
                            v-html="
                                $t(
                                    'Share your form by unique URL (Pro) or copy and paste the %1$sshortcode%2$s to embed in your page and post',
                                    '<em>',
                                    '</em>'
                                )
                            "
                        >
                        </p>
                        <el-form v-if="has_pro_share_page" label-position="top" class="mt-4">
                            <el-form-item class="ff-form-item">
                                <template slot="label">
                                    {{ $t('Pretty URL') }}
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                        <div slot="content">
                                            <p>{{ $t('Enable a clean, memorable URL for this conversational form.') }}</p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                    </el-tooltip>
                                </template>
                                <el-switch
                                    v-model="pretty_url.enabled"
                                    active-text=""
                                    inactive-text=""
                                ></el-switch>
                            </el-form-item>

                            <el-form-item v-if="pretty_url.enabled" class="ff-form-item">
                                <template slot="label">
                                    {{ $t('URL Slug') }}
                                </template>
                                <el-input
                                    v-model="pretty_url.slug"
                                    :placeholder="$t('my-form')"
                                    @input="sanitizePrettyUrlSlug"
                                />
                                <p class="text-note mt-1" v-if="pretty_url.slug">
                                    {{ prettyUrlPreview }}
                                </p>
                            </el-form-item>
                        </el-form>
                    </div>
                    <div v-if="!settings_error && ((active_tab == 'design' && has_pro) || active_tab == 'meta' || (active_tab == 'share' && has_pro_share_page))" class="ffc_design_submit">
                        <el-tooltip placement="top" popper-class="ff_tooltip_wrap">
                            <div slot="content">
                                {{ saveShortcutTooltip }}
                            </div>
                            <el-button icon="el-icon-success" size="medium" type="primary" @click="saveDesignSettings()">
                                {{ $t('Save Settings') }}
                            </el-button>
                        </el-tooltip>
                    </div>
                </div>
            </card>
            <div class="ffc_design_container">
                <design-preview :meta_settings="meta_settings" :has_pro="has_pro" v-if="active_tab == 'design'" :fonts="fonts" @css_generated="(css) => { generated_css = css; }"
                                :design_settings="design_settings"
                                :form_id="form_id"/>
                <meta-setting-view v-else-if="active_tab == 'meta'" :meta_settings="meta_settings"/>
                <sharing-view
                    v-else-if="active_tab == 'share'"
                    :form_id="form_id"
                    :share_url="share_url"
                    :meta_settings="meta_settings"
                    :has-pro-share-page="has_pro_share_page"
                />
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
import Tab from '@/admin/components/Tab/Tab.vue';
import TabItem from '@/admin/components/Tab/TabItem.vue';
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import { bindKeyboardSaveShortcut, getKeyboardSaveShortcutLabel } from '@/admin/helpers';

export default {
    name: 'ConversationalDesign',
    components: {
        DesignPreview,
        DesignElements,
        MetaSettingView,
        SharingView,
        Tab,
        TabItem,
        Card,
        CardBody
    },
    data() {
        return {
            active_tab: 'design',
            form_id: window.ffc_conv_vars.form_id,
            design_settings: {},
            meta_settings: {},
            form_settings: {},
            pretty_url: {
                available: false,
                slug: '',
                enabled: false,
                pretty_url: '',
                base_slug: 'form'
            },
            generated_css: '',
            saving: false,
            loading: true,
            settings_error: '',
            share_url: '',
            has_pro: !!window.ffc_conv_vars.has_pro,
            has_pro_share_page: !!window.ffc_conv_vars.has_pro_share_page,
            fonts: window.ffc_conv_vars.fonts,
            unbindKeyboardSaveShortcut: null
        }
    },
    methods: {
        saveDesignSettings() {
            if (this.settings_error) {
                this.$fail(this.settings_error);
                return;
            }

            this.saving = true;

            let data = {
                design_settings: this.design_settings,
                meta_settings: this.meta_settings,
                form_settings: this.form_settings,
                pretty_url: {
                    slug: this.pretty_url.slug,
                    enabled: this.pretty_url.enabled
                },
                generated_css: this.generated_css
            };

            this.setBaseUrl();

            FluentFormsGlobal.$rest.post(FluentFormsGlobal.$rest.route('storeFormSettingsConversationalDesign', this.form_id), data)
                .then(response => {
                    if (response.pretty_url) {
                        this.setPrettyUrl(response.pretty_url);
                    }
                    this.setBaseUrl();
                    this.$success(response.message);
                })
                .catch(error => {
                    this.$fail(error.message);
                })
                .finally(() => {
                    this.saving = false;
                });
        },
        fetchSettings() {
            this.loading = true;
            FluentFormsGlobal.$rest.get(FluentFormsGlobal.$rest.route('getFormSettingsConversationalDesign', this.form_id))
                .then(response => {
                    this.settings_error = '';
                    const designSettings = response.design_settings;
                    designSettings.background_brightness = parseInt(designSettings.background_brightness);
                    this.design_settings = designSettings;
                    this.meta_settings = response.meta_settings;
                    this.form_settings = this.normalizeFormSettings(response.form_settings || {});
                    this.has_pro = !!response.has_pro;
                    this.has_pro_share_page = !!response.has_pro_share_page;
                    this.setPrettyUrl(response.pretty_url || {});
                    this.setBaseUrl();
                })
                .catch(error => {
                    this.settings_error = (error && (error.message || (error.data && error.data.message)))
                        || this.$t('Unable to load settings. Please refresh and try again.');
                    this.$fail(this.settings_error);
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        setBaseUrl() {
            let baseUrl = window.ffc_conv_vars.preview_url;
            if (this.pretty_url.enabled && this.pretty_url.pretty_url) {
                baseUrl = this.pretty_url.pretty_url;
            }
            if (this.meta_settings.share_key) {
                baseUrl = this.addQueryArg(baseUrl, 'form', this.meta_settings.share_key);
            }
            this.share_url = baseUrl;
        },
        setPrettyUrl(prettyUrl) {
            this.pretty_url = Object.assign(
                {},
                this.pretty_url,
                {
                    available: false,
                    slug: '',
                    enabled: false,
                    pretty_url: '',
                    base_slug: 'form'
                },
                prettyUrl || {}
            );
        },
        sanitizePrettyUrlSlug(value) {
            this.pretty_url.slug = value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-/, '');
        },
        addQueryArg(url, key, value) {
            if (!value) {
                return url;
            }

            const separator = url.indexOf('?') === -1 ? '?' : '&';
            return url + separator + encodeURIComponent(key) + '=' + encodeURIComponent(value);
        },
        canUseKeyboardSaveShortcut() {
            if (this.loading || this.saving || this.settings_error) {
                return false;
            }

            return (this.active_tab === 'design' && this.has_pro)
                || this.active_tab === 'meta'
                || (this.active_tab === 'share' && this.has_pro_share_page);
        },
        normalizeFormSettings(settings) {
            const defaults = {
                restrictions: {
                    limitNumberOfEntries: {
                        enabled: false,
                        numberOfEntries: null,
                        period: 'total',
                        limitReachedMsg: 'Maximum number of entries exceeded.',
                    },
                    scheduleForm: {
                        enabled: false,
                        start: null,
                        end: null,
                        selectedDays: null,
                        pendingMsg: 'Form submission is not started yet.',
                        expiredMsg: 'Form submission is now closed.',
                    },
                    requireLogin: {
                        enabled: false,
                        requireLoginMsg: 'You must be logged in to submit the form.',
                    },
                    denyEmptySubmission: {
                        enabled: false,
                        message: "Sorry, you cannot submit an empty form. Let's hear what you wanna say."
                    }
                }
            };

            settings.restrictions = Object.assign({}, defaults.restrictions, settings.restrictions || {});
            Object.keys(defaults.restrictions).forEach(key => {
                settings.restrictions[key] = Object.assign(
                    {},
                    defaults.restrictions[key],
                    settings.restrictions[key] || {}
                );
            });

            return settings;
        },
    },
    computed: {
        saveShortcutTooltip() {
            return this.$t('Save settings') + ' (' + getKeyboardSaveShortcutLabel() + ')';
        },
        prettyUrlPreview() {
            const base = window.location.origin + '/' + (this.pretty_url.base_slug || 'form') + '/';
            return base + (this.pretty_url.slug || 'my-form') + '/';
        }
    },
    mounted() {
        this.fetchSettings();
        this.unbindKeyboardSaveShortcut = bindKeyboardSaveShortcut(
            () => this.saveDesignSettings(),
            {
                enabled: () => this.canUseKeyboardSaveShortcut()
            }
        );
    },
    beforeDestroy() {
        if (this.unbindKeyboardSaveShortcut) {
            this.unbindKeyboardSaveShortcut();
            this.unbindKeyboardSaveShortcut = null;
        }
    }
}
</script>

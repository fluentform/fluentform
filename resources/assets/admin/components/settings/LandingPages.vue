<template>
    <div v-loading="loading" element-loading-text="Loading Settings..." style="min-height: 100px;">
        <el-row class="setting_header">
            <el-col :md="16">
                <h2>Landing Page</h2>
                <p>Create completely custom "distraction-free" form landing pages to boost conversions</p>
            </el-col>

            <!--Save settings-->
            <el-col v-if="!error_text" :md="8" class="action-buttons clearfix mb15">
                <el-button
                        :loading="saving"
                        class="pull-right"
                        size="medium"
                        type="success"
                        icon="el-icon-success"
                        @click="saveSettings">
                    {{saving ? 'Saving' : 'Save'}} Settings
                </el-button>
                <a v-show="share_url && settings.status == 'yes'" style="margin-right: 10px" target="_blank" rel="noopener" :href="final_share_url" class="el-button pull-right el-button--danger el-button--mini">
                    <span class="dashicons dashicons-share"></span>
                </a>
            </el-col>
        </el-row>

        <div v-if="settings" class="ff_landing_settings_wrapper">
            <el-form ref="form" :model="settings" label-width="205px" label-position="right">

                <el-checkbox v-model="settings.status" true-label="yes" false-label="no">
                    Enable Form Landing Page Mode
                </el-checkbox>

                <div v-if="settings.status == 'yes'" class="ff_landing_page_items">

                    <el-form-item>
                        <template slot="label">
                            Form Page Title
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Form Title</h3>
                                    <p>
                                        This will show at the top of your page
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <el-input placeholder="eg: My Awesome Form" v-model="settings.title"/>
                    </el-form-item>

                    <el-form-item>
                        <template slot="label">
                            Description
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Description</h3>
                                    <p>
                                        This will show at the top of your page after form title
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <wp-editor v-model="settings.description" />
                    </el-form-item>

                    <el-form-item>
                        <template slot="label">
                            Color Scheme
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Color Scheme</h3>
                                    <p>
                                        Choose the color option for the page's background
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <el-radio-group v-model="settings.color_schema">
                            <el-radio v-for="(colorName, colorCode) in color_schemas" :key="colorCode" :label="colorCode">{{colorName}}</el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <el-form-item v-if="settings.color_schema == 'custom'">
                        <template slot="label">
                            Custom Color
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <h3>Custom Color</h3>
                                    <p>
                                        Choose Custom Color for your form page
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <el-color-picker v-model="settings.custom_color"></el-color-picker>
                    </el-form-item>

                    <el-form-item v-if="false">
                        <template slot="label">
                            Page Design Style
                        </template>
                        <el-radio-group v-model="settings.design_style">
                            <el-radio v-for="(layoutName, layoutCode) in layouts" :key="layoutCode" :label="layoutCode">{{layoutName}}</el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <el-row :gutter="20">
                        <el-col :span="8">
                            <el-form-item>
                                <template slot="label">
                                    Form Logo
                                    <el-tooltip class="item" placement="bottom-start" effect="light">
                                        <div slot="content">
                                            <h3>Logo</h3>
                                            <p>
                                                You may upload your logo and it will show on the top of the page
                                            </p>
                                        </div>
                                        <i class="el-icon-info el-text-info"></i>
                                    </el-tooltip>
                                </template>
                                <photo-uploader enable_clear="yes" design_mode="horizontal" v-model="settings.logo" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item>
                                <template slot="label">
                                    Featured Image
                                    <el-tooltip class="item" placement="bottom-start" effect="light">
                                        <div slot="content">
                                            <h3>Featured Image</h3>
                                            <p>
                                                Featured Image will be shown in social media share preview
                                            </p>
                                        </div>
                                        <i class="el-icon-info el-text-info"></i>
                                    </el-tooltip>
                                </template>
                                <photo-uploader enable_clear="yes" design_mode="horizontal" v-model="settings.featured_image" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item>
                                <template slot="label">
                                    Background Image
                                    <el-tooltip class="item" placement="bottom-start" effect="light">
                                        <div slot="content">
                                            <h3>Background Image</h3>
                                            <p>
                                                Page Background Image
                                            </p>
                                        </div>
                                        <i class="el-icon-info el-text-info"></i>
                                    </el-tooltip>
                                </template>
                                <photo-uploader enable_clear="yes" design_mode="horizontal" v-model="settings.background_image" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-form-item v-if="share_url && settings.status == 'yes'">
                        <template slot="label">
                            Security Code
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <p>
                                        A Salt to secure your share url so nobody can guess by form ID.
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>
                        <el-input v-model="settings.share_url_salt" />
                    </el-form-item>
                    <el-form-item v-if="share_url && settings.status == 'yes'" label="Landing Page URL">
                        <input class="el-input__inner" readonly type="text" :value="final_share_url" />
                    </el-form-item>

                    <el-form-item>
                        <el-button
                                :loading="saving"
                                class="pull-right"
                                size="medium"
                                type="success"
                                icon="el-icon-success"
                                @click="saveSettings">
                            {{saving ? 'Saving' : 'Save'}} Settings
                        </el-button>
                    </el-form-item>
                </div>
            </el-form>
        </div>

        <p>{{error_text}}</p>
    </div>
</template>

<script type="text/babel">
    import WpEditor from '../../../common/_wp_editor';
    import PhotoUploader from '../../../common/PhotoUploader';

    export default {
        name: 'landing_pages',
        components: {
            WpEditor,
            PhotoUploader
        },
        data() {
            return {
                loading: false,
                saving: false,
                settings: false,
                form_id: window.FluentFormApp.form_id,
                error_text: '',
                share_url: '',
                color_schemas: {
                    '#4286c4' : 'Blue',
                    '#32373c' : 'Dark Gray',
                    '#67c23a' : 'Green',
                    '#19a59f': 'darkcyan',
                    '#d34342' : 'Red',
                    '#999999' : 'Gray',
                    'custom': 'Custom'
                },
                layouts: {
                    modern: 'Modern',
                    classic: 'Classic'
                }
            }
        },
        computed: {
            final_share_url() {
                if(this.settings.share_url_salt) {
                    return this.share_url + '&form='+this.settings.share_url_salt;
                } else {
                    return this.share_url;
                }
            }
        },
        watch: {
            'settings.share_url_salt': function (value, oldValue){
                this.settings.share_url_salt = this.string_to_slug(value);
            }
        },
        methods: {
            saveSettings() {
                this.saving = true;

                let data = {
                    action: 'ff_store_landing_page_settings',
                    form_id: this.form_id,
                    settings: this.settings
                };

                jQuery.post(window.ajaxurl, data)
                    .then(response => {
                        this.share_url = response.data.share_url;
                        this.$notify.success({
                            title: 'Success',
                            message: response.data.message,
                            offset: 30
                        });
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            fetchSettings() {
                this.loading = true;
                
                let data = {
                    action: 'ff_get_landing_page_settings',
                    form_id: this.form_id
                };

                jQuery.get(window.ajaxurl, data)
                    .then(response => {
                        this.share_url = response.data.share_url;
                        this.settings = response.data.settings;
                    })
                    .fail(error => {
                        if (!error.responseJSON) {
                            this.error_text = 'Looks like you do not have latest version of Fluent Forms Pro Installed. Please install latest version of Fluent Forms Pro to use this feature';
                            return;
                        }
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            string_to_slug (text) {
                return text
                    .toString()                     // Cast to string
                    .toLowerCase()                  // Convert the string to lowercase letters
                    .normalize('NFD')       // The normalize() method returns the Unicode Normalization Form of a given string.
                    .replace(/\s+/g, '-')           // Replace spaces with -
                    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
                    .replace(/\-\-+/g, '-');        // Replace multiple - with single -

            }
        },
        mounted() {
            this.fetchSettings();
            jQuery('head title').text('Landing Page Settings - Fluent Forms');
        }
    };
</script>

<style lang="scss">
    .ff_landing_page_items {
        margin-top: 30px;
    }
</style>

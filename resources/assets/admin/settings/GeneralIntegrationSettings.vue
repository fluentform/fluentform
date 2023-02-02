<template>
    <div class="ff_general_integration_wrap">
        <div class="ff_card" v-if="settings.hide_on_valid && integration.status">
            <div class="ff_card_head">
                <h5 class="title">{{ settings.menu_title }}</h5>
                <p class="text" v-html="settings.menu_description"></p>
            </div><!-- .ff_card_head -->
            <div class="ff_card_body">
                <div class="ff_state_box success">
                    <div class="mb-4 ff_icon_btn mx-auto success">
                        <i class="el-icon el-icon-check"></i>
                    </div>
                    <h6 class="mb-4" v-html="settings.discard_settings.section_description"></h6>
                    <el-button @click="disconnect(settings.discard_settings.data)" type="danger">
                        {{ settings.discard_settings.button_text }}
                    </el-button>
                    <el-button v-if="settings.discard_settings.show_verify" v-loading="saving" @click="save()" type="primary"
                        icon="el-icon-success">
                        {{ $t('Verify Connection Again') }}
                    </el-button>
                </div>
            </div>
        </div><!-- .ff_card -->

        <div v-else v-loading="loading" class="ff_general_integration_body">
            <template v-if="settings.config_instruction && !integration.status">
                <div class="integration_instraction mb-4" v-html="settings.config_instruction"></div>
            </template>
            <el-form>
                <div class="ff_card mb-4">
                    <div class="ff_card_head">
                        <h5 class="title">{{ settings.menu_title }}</h5>
                        <p class="text" v-html="settings.menu_description"></p>
                    </div><!-- .ff_card_head -->
                    <div class="ff_card_body">
                        <div class="ff_block_item" v-for="(field,fieldKey) in settings.fields" :key="fieldKey">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ field.label }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper" v-if="field.label_tips">
                                    <div slot="content">
                                        <p v-html="field.label_tips"></p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <template v-if="field.type == 'select'">
                                    <el-select v-model="integration[fieldKey]">
                                        <el-option
                                            v-for="(optionName, optionValue) in field.options"
                                            :key="optionValue"
                                            :label="optionName"
                                            :value="optionValue"></el-option>
                                    </el-select>
                                </template>
                                <template v-else-if="field.type == 'link'">
                                    <a :target="field.target" :class="field.btn_class" :href="field.link">{{ field.link_text }}</a>
                                    <p>{{ field.tips }}</p>
                                </template>
                                <template v-else-if="field.type == 'checkbox-single'">
                                    <el-checkbox v-model="integration[fieldKey]">
                                        {{field.checkbox_label}}
                                    </el-checkbox>
                                </template>
                                <template v-else>
                                    <el-input :placeholder="field.placeholder" :type="field.type" v-model="integration[fieldKey]"></el-input>
                                    <p v-if="field.tips">{{ field.tips }}</p>
                                </template>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                        
                        <div v-if="integration.status">
                            <p><i class="el-icon-success mr-1"></i> {{ settings.valid_message }}</p>
                        </div>
                        <div v-else>
                            <p><i class="el-icon-error mr-1"></i> {{ settings.invalid_message }}</p>
                        </div>
                    </div><!-- .ff_card_body -->
                </div><!--.ff_card -->

                <el-button v-loading="saving" type="primary" icon="el-icon-success" @click="save">
                    {{ settings.save_button_text }}
                </el-button>
            </el-form>
        </div>

        <p v-if="error_message">{{ error_message }}</p>
    </div>
</template>

<script type="text/babel">
import VideoDoc from '@/common/VideoInstruction.vue';

export default {
    name: "generalIntegration",
    props: ['app', 'settings_key'],
    components: {
        VideoDoc
    },
    data() {
        return {
            integration: {},
            loading: false,
            saving: false,
            settings: {},
            error_message: ''
        }
    },
    watch: {
        settings_key() {
            this.integration = {};
            this.settings = {};
            this.getIntegrationSettings();
        }
    },
    methods: {
        save() {
            this.saving = true;
            FluentFormsGlobal.$post({
                action: 'fluentform_post_global_integration_settings',
                settings_key: this.settings_key,
                integration: this.integration
            })
                .then(response => {
                    this.$success(response.data.message);
                    if (response.data.redirect_url) {
                        window.location.href = response.data.redirect_url;
                        return;
                    }

                    this.integration.status = response.data.status;

                    if (this.settings.reload_on_save) {
                        this.getIntegrationSettings();
                    }
                })
                .fail(error => {
                    this.integration.status = false;
                    this.fail(error.responseJSON.data.message);
                })
                .always(() => {
                    this.saving = false;
                });
        },
        getIntegrationSettings() {
            this.loading = true;
            FluentFormsGlobal.$get({
                action: 'fluentform_get_global_integration_settings',
                settings_key: this.settings_key
            })
                .then(response => {
                    this.integration = response.data.integration;
                    this.settings = response.data.settings;
                })
                .fail(error => {
                    this.error_message = error.responseJSON.data.message;
                })
                .always(() => {
                    this.loading = false;
                });
        },
        disconnect(data) {
            this.integration = data;
            this.save();
        }
    },
    mounted() {
        this.getIntegrationSettings();
    }
}
</script>

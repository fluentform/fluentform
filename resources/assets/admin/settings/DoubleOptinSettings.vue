<template>
    <div 
        v-loading="loading" 
        :element-loading-text="$t('Loading Settings...')"
        element-loading-spinner="el-icon-loading"
        class="ff_double_optin_wrap"
    >
        <el-form v-if="settings" :data="settings">
            <div class="ff_card mb-4">
                <div class="ff_card_head">
                    <h5 class="title"> {{ $t('Global Double Optin Settings') }}</h5>
                </div><!-- .ff_card_head  -->
                <div class="ff_card_body">
                    <div class="ff_block_item">
                        <el-checkbox true-label="yes" false-label="no" v-model="settings.enabled">
                            {{ $t('Enable Double Optin Module') }}
                        </el-checkbox>
                    </div><!-- .ff_block_item -->
                    <template v-if="settings.enabled == 'yes'">
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Global Email Subject') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Email Subject for double optin email.') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-input :placeholder="$t('Email Subject')" v-model="settings.email_subject"/>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                        
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Global Optin Email Body') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Enter the content you would like the user to send via email for confirmation.') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-input v-if="settings.asPlainText == 'yes'" v-model="settings.email_body" type="textarea" :rows="12"></el-input>
                                <wp-editor v-else :height="250" v-model="settings.email_body"/>
                                <el-checkbox class="mt-3" true-label="yes" false-label="no" v-model="settings.asPlainText">
                                    {{ $t('Send Email as RAW HTML Format') }}
                                </el-checkbox>
                                <p class="mt-2">{{ $t('Use #confirmation_url# smartcode for double optin confirmation URL') }}</p>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->

                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('From Name') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Enter the name you would like the notification email sent from') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-input placeholder="From Name" v-model="settings.fromName"/>
                                <p v-if="settings.fromName" class="mt-1">{{ $t('It will only be visible in the email if "From Email" value is available') }}</p>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                        
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title"> {{ $t('From Email') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Enter the email address you would like the notification email sent from.') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-input :placeholder="$t('From Email')" v-model="settings.fromEmail"/>
                                <p v-if="settings.fromEmail" class="mt-1">{{$t('It\'s not recommended to change from email. Please use your domain\'s email / SMTP main email. Otherwise email may failed to send.')}}</p>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->

                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title">{{ $t('Reply To') }}</h6>
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                    <div slot="content">
                                        <p>{{ $t('Enter the email address you would like to be used as the reply to address for the notification email.') }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                </el-tooltip>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-input :placeholder="$t('Reply To Email')" v-model="settings.replyTo"/>
                            </div><!-- .ff_block_item_body -->
                        </div><!-- .ff_block_item -->
                        
                        <div class="ff_block_item_wrap">
                            <el-checkbox true-label="yes" false-label="no" v-model="settings.auto_delete_status">
                                {{ $t('Automatically delete unconfirmed entries if not confirmed in certain days') }}
                            </el-checkbox>
                            <div class="ff_block_item mt-3" v-if="settings.auto_delete_status == 'yes'">
                                <div class="ff_block_title_group mb-3">
                                    <h6 class="ff_block_title"> {{ $t('Waiting Days') }}</h6>
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                        <div slot="content">
                                            <p>{{ $t('How many days, it will wait before deleting the unconfirmed entries') }}</p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                                    </el-tooltip>
                                </div><!-- .ff_block_title_group -->
                                <div class="ff_block_item_body">
                                    <el-input-number v-model="settings.auto_delete_day_span" :min="1"></el-input-number>
                                </div><!-- .ff_block_item_body -->
                            </div><!-- .ff_block_item -->
                        </div><!-- .ff_block_item_wrap -->
                    </template>
                </div><!-- .ff_card_body -->
            </div><!-- .ff_card -->
            <el-button v-if="hasPro && settings.enabled == 'yes'" v-loading="saving" type="primary" icon="el-icon-success" @click="save">
                {{ $t('Save Settings') }}
            </el-button>
        </el-form>

        <div class="ff_card" v-else>
            <div class="ff_card_head">
                <h5 class="title"> {{ $t('Global Double Optin Settings') }}</h5>
            </div><!-- .ff_card_head  -->
            <div class="ff_card_body">
                <div v-if="!hasPro">
                    <p class="text-danger"><i class="el-icon el-icon-lock mr-1"></i> {{ $t('This is a pro feature. Please upgrade to pro to enable this feature.') }}</p>
                </div>
                <div v-else-if="need_update">
                    <h4>{{ $t('Please update Fluent Forms Pro Addon to latest version.') }}</h4>
                </div>
            </div>
        </div><!-- .ff_card -->
    </div><!-- .ff_card -->
</template>

<script type="text/babel">
    import wpEditor from '../../common/_wp_editor';

    export default {
        name: 'DoubleOptinSettings',
        components: {
            wpEditor
        },
        data() {
            return {
                settings: false,
                hasPro: !!window.FluentFormApp.has_pro,
                loading: true,
                saving: false,
                need_update: false
            }
        },
        methods: {
            save() {
                this.saving = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_save_global_double_optin',
                    settings: this.settings
                })
                    .then((response) => {
                        this.$success(response.data.message);
                    })
                    .fail((errors) => {
                        console.log(errors);
                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            fetch() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_global_double_optin'
                })
                    .then(response => {
                        this.settings = response.data.settings;
                    })
                    .fail((errors) => {
                        if (errors.status == 400) {
                            this.need_update = true;
                        }
                    })
                    .always(() => {
                        this.loading = false;
                    });
            }
        },
        mounted() {
            if (this.hasPro) {
                this.fetch();
            } else {
                this.loading = false;
            }

            jQuery('body').addClass('ff_footer_none');
        }
    }
</script>

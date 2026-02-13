<template>
    <div class="ffc_sharing_settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Share Your Form') }}</h5>
            </card-head>
            <card-body>
                <!-- Pretty URL Section -->
                <card border>
                    <h5 class="mb-2">{{ $t('Pretty URL') }}</h5>
                    <p class="mb-3">{{ $t('Create a clean, memorable URL for your conversational form.') }}</p>

                    <div v-if="!has_pro" class="fcc_pro_message">
                        {{ $t('Pretty URLs are available in Pro.') }}
                        <a target="_blank" rel="noopener" href="https://fluentforms.com" class="el-button el-button--success el-button--small">
                            {{ $t('Get Fluent Forms Pro') }}
                        </a>
                    </div>

                    <template v-else>
                        <el-form label-position="top">
                            <el-form-item class="ff-form-item mb-2">
                                <template slot="label">
                                    {{ $t('Enable Pretty URL') }}
                                </template>
                                <el-switch
                                    v-model="localPrettyUrl.enabled"
                                    active-text=""
                                    inactive-text=""
                                ></el-switch>
                            </el-form-item>

                            <el-form-item v-if="localPrettyUrl.enabled" class="ff-form-item mb-2">
                                <template slot="label">
                                    {{ $t('URL Slug') }}
                                </template>
                                <el-input
                                    v-model="localPrettyUrl.slug"
                                    :placeholder="$t('my-form')"
                                    @input="sanitizeSlug"
                                />
                                <p class="text-note mt-1" v-if="localPrettyUrl.slug">
                                    {{ prettyUrlPreview }}
                                </p>
                            </el-form-item>

                            <el-form-item>
                                <el-button
                                    :loading="saving"
                                    type="primary"
                                    icon="el-icon-success"
                                    size="small"
                                    @click="savePrettyUrl"
                                >
                                    {{ $t('%s Pretty URL', saving ? 'Saving' : 'Save') }}
                                </el-button>
                            </el-form-item>
                        </el-form>

                        <div v-if="localPrettyUrl.enabled && localPrettyUrl.pretty_url" class="mt-3">
                            <el-input v-model="localPrettyUrl.pretty_url" :readonly="true">
                                <el-button
                                    @click="copyText()"
                                    class="copy_share"
                                    :data-clipboard-text="localPrettyUrl.pretty_url"
                                    slot="append"
                                    icon="el-icon-document-copy"
                                >
                                </el-button>
                            </el-input>
                        </div>
                    </template>
                </card>

                <card border>
                    <h5 class="mb-2">{{ $t('Share Via Direct URL') }}</h5>
                    <p>{{ $t('Get the link or share on social sites') }}</p>
                    <el-input v-model="effectiveShareUrl" :readonly="true">
                        <el-button
                            @click="copyText()"
                            class="copy_share"
                            :data-clipboard-text='effectiveShareUrl'
                            slot="append"
                            icon="el-icon-document-copy"
                        >
                        </el-button>
                    </el-input>
                    <social class="mt-3">
                        <social-item :href="'https://www.facebook.com/sharer/sharer.php?u=' + effectiveShareUrl" icon="facebook"></social-item>
                        <social-item :href="'https://twitter.com/intent/tweet?' + getTwitterParams()" icon="twitter"></social-item>
                        <social-item :href="'https://www.linkedin.com/shareArticle?' + getLinkedInParams()" icon="linkedin"></social-item>
                        <social-item :href="getMailUrl()" icon="email-alt"></social-item>
                    </social>
                </card>
                <card border>
                    <h5 class="mb-2">{{ $t('QR Code') }}</h5>
                    <p>{{ $t('Scan to open the form on mobile devices') }}</p>
                    <qr-code-preview :url="effectiveShareUrl" />
                </card>
                <el-row :gutter="24">
                    <el-col :md="12" :sm="24">
                        <card border>
                            <h5 class="mb-2">{{ $t('Shortcode for Conversational Form') }}</h5>
                            <p>{{ $t('Use this following shortcode in your Page or Post') }}</p>
                            <el-input v-model="smart_shortcode" :readonly="true">
                                <el-button
                                    @click="copyText()"
                                    class="copy_share"
                                    :data-clipboard-text='smart_shortcode'
                                    slot="append"
                                    icon="el-icon-document-copy">
                                </el-button>
                            </el-input>
                        </card>
                    </el-col>
                    <el-col :md="12" :sm="24">
                        <card border>
                            <h5 class="mb-2">{{ $t('Shortcode for Classic Form') }}</h5>
                            <p>{{ $t('Use this following shortcode in your Page or Post') }}</p>
                            <el-input v-model="classic_shortcode" :readonly="true">
                                <el-button
                                    @click="copyText()"
                                    class="copy_share"
                                    :data-clipboard-text='classic_shortcode'
                                    slot="append"
                                    icon="el-icon-document-copy">
                                </el-button>
                            </el-input>
                        </card>
                    </el-col>
                </el-row>
                <card border>
                    <h5 class="mb-2">{{ $t('Embed via HTML Code') }}</h5>
                    <p class="mb-3">
                        {{$t('Want to use this form in another domain or another site or even outside WordPress ? Use the following code')}}
                    </p>
                    <textarea
                        :value="embedCode"
                        style="width: 100%"
                        type="textarea"
                        :rows="5"
                        :readonly="true">
                    </textarea>

                    <div class="mt-3">
                        <p style="font-style: italic;" class="fs-14">- {{ $t('You can customize the height property.') }}</p>
                        <p style="font-style: italic;" class="fs-14">- {{ $t('Please check if your wp hosting server supports iframe.') }}</p>
                    </div>
                </card>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import Social from '@/admin/components/Social/Social.vue';
    import SocialItem from '@/admin/components/Social/SocialItem.vue';
    import QrCodePreview from '@/admin/components/settings/QrCodePreview.vue';

    export default {
        name: 'SharingView',
        props: ['meta_settings', 'share_url', 'form_id', 'has_pro', 'pretty_url', 'base_slug', 'saving'],
        components: {
            Card,
            CardHead,
            CardBody,
            Social,
            SocialItem,
            QrCodePreview
        },
        data(){
            return {
                localPrettyUrl: {
                    slug: '',
                    enabled: false,
                    pretty_url: ''
                }
            }
        },
        computed: {
            smart_shortcode() {
                return '[fluentform type="conversational" id="' + this.form_id + '"]';
            },
            classic_shortcode() {
                return '[fluentform id="' + this.form_id + '"]';
            },
            prettyUrlPreview() {
                const base = window.location.origin + '/' + (this.base_slug || 'form') + '/';
                return base + (this.localPrettyUrl.slug || 'my-form') + '/';
            },
            effectiveShareUrl() {
                // Use pretty URL if enabled and available, otherwise use regular share_url
                if (this.localPrettyUrl.enabled && this.localPrettyUrl.pretty_url) {
                    return this.localPrettyUrl.pretty_url;
                }
                return this.share_url;
            },
            embedCode() {
                return `<iframe id="fluentform" width="100%" height="500px" style="min-height: 500px;width: 100%" frameborder="0" src="${this.effectiveShareUrl}${this.effectiveShareUrl.includes('?') ? '&' : '?'}embedded=1"></iframe>`;
            }
        },
        watch: {
            pretty_url: {
                handler(newVal) {
                    if (newVal) {
                        this.localPrettyUrl = {
                            slug: newVal.slug || '',
                            enabled: !!newVal.enabled,
                            pretty_url: newVal.pretty_url || ''
                        };
                    }
                },
                immediate: true,
                deep: true
            }
        },
        methods: {
            getTwitterParams() {
                let url = encodeURIComponent(this.effectiveShareUrl);
                return 'url=' + url + '&text=' + 'Would you please fill in this form%0aI really appreciate it!%0avia @Fluent_Forms%0a';
            },
            getLinkedInParams() {
                let url = encodeURIComponent(this.effectiveShareUrl);
                return 'url=' + url + '&title=';
            },
            getMailUrl() {
                return 'mailto:?subject=Could you take a moment to fill in this form?&body=We would really appreciate it if you filled in this Form:%0A→ ' + encodeURIComponent(this.effectiveShareUrl) + '%0A%0AThank+you!';
            },
            copyText() {

            },
            sanitizeSlug(value) {
                this.localPrettyUrl.slug = value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-/, '');
            },
            savePrettyUrl() {
                this.$emit('save-pretty-url', {
                    slug: this.localPrettyUrl.slug,
                    enabled: this.localPrettyUrl.enabled
                });
            }
        },
        mounted() {
            if (!window.ffc_share_clip_inited) {
                window.ffc_share_clip_inited = true;
                const clipboard = new ClipboardJS('.copy_share');
                clipboard.on('success', (e) => {
                    jQuery(e.trigger).addClass('fc_copy_success');
                    setTimeout(() => {
                        jQuery(e.trigger).removeClass('fc_copy_success');
                    }, 2000);
                    this.$copy();
                });
            }
        }
    }
</script>

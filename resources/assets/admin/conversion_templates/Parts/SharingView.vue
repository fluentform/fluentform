<template>
    <div class="ffc_sharing_settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Share Your Form') }}</h5>
            </card-head>
            <card-body>
                <card border>
                    <h5 class="mb-2">{{ $t('Share Via Direct URL') }}</h5>
                    <p>{{ $t('Copy the direct conversational form link or share it on social channels.') }}</p>
                    <el-input v-model="share_url" :readonly="true">
                        <el-button
                            @click="copyText()" 
                            class="copy_share"
                            :data-clipboard-text='share_url' 
                            slot="append"
                            icon="el-icon-document-copy"
                            :title="$t('Copy Link')"
                        >
                        </el-button>
                    </el-input>
                    <social class="mt-3">
                        <social-item :href="'https://www.facebook.com/sharer/sharer.php?u=' + encodedShareUrl" icon="facebook"></social-item>
                        <social-item :href="'https://twitter.com/intent/tweet?' + getTwitterParams()" icon="twitter"></social-item>
                        <social-item :href="'https://www.linkedin.com/shareArticle?' + getLinkedInParams()" icon="linkedin"></social-item>
                        <social-item :href="getMailUrl()" icon="email-alt"></social-item>
                    </social>
                </card>

                <card border>
                    <h5 class="mb-2">{{ $t('Email Share') }}</h5>
                    <p>{{ $t('Use this ready message when sending the form link by email.') }}</p>
                    <el-input type="textarea" :rows="4" :value="emailBody" :readonly="true"></el-input>
                    <div class="mt-3">
                        <el-button
                            @click="copyText()"
                            class="copy_share"
                            :data-clipboard-text="emailBody"
                            icon="el-icon-document-copy"
                            size="small">
                            {{ $t('Copy Email Text') }}
                        </el-button>
                    </div>
                </card>

                <card v-if="hasProSharePage" class="ffc_qr_share_card" border>
                    <h5 class="mb-2">{{ $t('QR Code') }}</h5>
                    <p>{{ $t('Share this conversational form in print or in-person.') }}</p>
                    <div class="ffc_qr_code_preview" v-html="qrSvg"></div>
                    <div class="ffc_qr_actions">
                        <el-button
                            size="small"
                            icon="el-icon-download"
                            @click="downloadQrCode">
                            {{ $t('Download SVG') }}
                        </el-button>
                        <el-button
                            size="small"
                            class="copy_share"
                            icon="el-icon-document-copy"
                            :data-clipboard-text="qrSvg"
                            :title="$t('Copy SVG')">
                            {{ $t('Copy SVG') }}
                        </el-button>
                    </div>
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
                                    icon="el-icon-document-copy"
                                    :title="$t('Copy Shortcode')">
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
                                    icon="el-icon-document-copy"
                                    :title="$t('Copy Shortcode')">
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
                        :value="textareaValue"
                        style="width: 100%" 
                        type="textarea" 
                        :rows="5" 
                        :readonly="true">
                    </textarea>

                    <div class="mt-3">
                        <el-button
                            @click="copyText()"
                            class="copy_share"
                            :data-clipboard-text="textareaValue"
                            icon="el-icon-document-copy"
                            size="small">
                            {{ $t('Copy Embed Code') }}
                        </el-button>
                        <p style="font-style: italic;" class="fs-14">- {{ $t('You can customize the height property.') }}</p>
                        <p style="font-style: italic;" class="fs-14">- {{ $t('Please check if your wp hosting server supports iframe.') }}</p>
                    </div>
                </card>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
    import qrcode from 'qrcode-generator';
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import Social from '@/admin/components/Social/Social.vue';
    import SocialItem from '@/admin/components/Social/SocialItem.vue';

    export default {
        name: 'SharingView',
        props: {
            meta_settings: {
                type: Object,
                default() {
                    return {};
                }
            },
            share_url: {
                type: String,
                required: true
            },
            form_id: {
                type: [String, Number],
                required: true
            },
            hasProSharePage: {
                type: Boolean,
                default: false
            }
        },
        components: { 
            Card,
            CardHead,
            CardBody,
            Social,
            SocialItem
        },
        computed: {
            encodedShareUrl() {
                return encodeURIComponent(this.share_url);
            },
            textareaValue() {
                return `<iframe id="fluentform" width="100%" loading="lazy" height="500px" style="min-height: 500px;width: 100%" frameborder="0" src="${this.embedUrl}"></iframe>`;
            },
            embedUrl() {
                const separator = this.share_url.indexOf('?') === -1 ? '?' : '&';
                return this.share_url + separator + 'embedded=1';
            },
            emailBody() {
                return `${this.$t('We would really appreciate it if you filled in this form:')}\n${this.share_url}\n\n${this.$t('Thank you!')}`;
            },
            qrSvg() {
                if (!this.hasProSharePage || !this.share_url) {
                    return '';
                }

                const qr = qrcode(0, 'M');
                qr.addData(this.share_url);
                qr.make();

                return qr.createSvgTag(5, 2);
            },
            qrFileName() {
                return `fluentform-${this.form_id}-conversational-qr.svg`;
            },
            smart_shortcode() {
                return '[fluentform type="conversational" id="' + this.form_id + '"]';
            },
            classic_shortcode() {
                return '[fluentform id="' + this.form_id + '"]';
            }
        },
        methods: {
            getTwitterParams() {
                return 'url=' + this.encodedShareUrl + '&text=' + encodeURIComponent('Would you please fill in this form\nI really appreciate it!\nvia @Fluent_Forms\n');
            },
            getLinkedInParams() {
                return 'url=' + this.encodedShareUrl + '&title=';
            },
            getMailUrl() {
                return 'mailto:?subject=' + encodeURIComponent(this.$t('Could you take a moment to fill in this form?')) + '&body=' + encodeURIComponent(this.emailBody);
            },
            downloadQrCode() {
                if (!this.qrSvg) {
                    return;
                }

                const blob = new Blob([this.qrSvg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');

                link.href = url;
                link.download = this.qrFileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            },
            copyText() {

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

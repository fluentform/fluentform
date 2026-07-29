<template>
    <div class="ffc_sharing_settings">
        <div class="mb-5">
            <h2 class="mb-2">{{ $t('Share Your Form') }}</h2>
            <p class="fs-17">
                {{ $t('Share your form by unique URL or copy and paste the shortcode to embed in your page and post') }}
            </p>
        </div>
        <el-row :gutter="24" v-if="share_url">
            <el-col :md="12" :sm="24">
                <div class="fcc_card">
                    <h5 class="mb-2">{{ $t('Share Via Direct URL') }}</h5>
                    <p>{{ $t('Get the link or share on social sites') }}</p>
                    <el-input v-model="share_url" :readonly="true">
                        <el-button
                            @click="copyText()" 
                            class="copy_share"
                            :data-clipboard-text='share_url' 
                            slot="append"
                            icon="ff-icon ff-icon-copy"
                            :title="$t('Copy Link')">
                        </el-button>
                    </el-input>
                    <ul class="ff_socials mt-3">
                        <li>
                            <a :href="'https://www.facebook.com/sharer/sharer.php?u=' + encodedShareUrl" target="_blank"
                               rel="nofollow">
                                <span class="dashicons dashicons-facebook"></span>
                            </a>
                        </li>
                        <li>
                            <a :href="'https://twitter.com/intent/tweet?' + getTwitterParams()" target="_blank"
                               rel="nofollow">
                                <span class="dashicons dashicons-twitter"></span>
                            </a>
                        </li>
                        <li>
                            <a :href="'https://www.linkedin.com/shareArticle?' + getLinkedInParams()" target="_blank"
                               rel="nofollow">
                                <span class="dashicons dashicons-linkedin"></span>
                            </a>
                        </li>
                        <li>
                            <a :href="getMailUrl()" target="_blank" rel="nofollow">
                                <span class="dashicons dashicons-email-alt"></span>
                            </a>
                        </li>
                    </ul>
                </div>
            </el-col>
            <el-col :md="12" :sm="24">
                <div class="fcc_card ffc_qr_share_card">
                    <div class="ffc_qr_share_header">
                        <div>
                            <h5 class="mb-2">{{ $t('QR Code') }}</h5>
                            <p>{{ $t('Share this landing page in print or in-person.') }}</p>
                        </div>
                    </div>
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
                            icon="ff-icon ff-icon-copy"
                            :data-clipboard-text="qrSvg"
                            :title="$t('Copy SVG')">
                            {{ $t('Copy SVG') }}
                        </el-button>
                    </div>
                </div>
            </el-col>
            <el-col :md="12" :sm="24">
                <div class="fcc_card">
                    <h5 class="mb-2">{{ $t('Shortcode') }}</h5>
                    <p>{{ $t('Use this following shortcode in your Page or Post') }}</p>
                    <el-input v-model="classic_shortcode" :readonly="true">
                        <el-button 
                            @click="copyText()" 
                            class="copy_share" 
                            :data-clipboard-text='classic_shortcode'
                            slot="append" 
                            icon="ff-icon ff-icon-copy"
                            :title="$t('Copy Shortcode')">
                        </el-button>
                    </el-input>
                </div>
            </el-col>
            <el-col :md="12" :sm="24">
                <div class="fcc_card ffc_email_share_card">
                    <h5 class="mb-2">{{ $t('Email Share') }}</h5>
                    <p>{{ $t('Open an email draft or copy the message text.') }}</p>
                    <el-input type="textarea" :rows="4" :value="emailMessage" :readonly="true"></el-input>
                    <div class="ffc_share_actions mt-3">
                        <a class="el-button el-button--small" :href="mailUrl" target="_blank" rel="nofollow">
                            <i class="dashicons dashicons-email-alt"></i>
                            {{ $t('Open Email') }}
                        </a>
                        <el-button
                            size="small"
                            class="copy_share"
                            icon="ff-icon ff-icon-copy"
                            :data-clipboard-text="emailMessage"
                            @click="copyText()">
                            {{ $t('Copy Message') }}
                        </el-button>
                    </div>
                </div>
            </el-col>
            <el-col :span="24">
                <div class="fcc_card">
                    <h5 class="mb-2">{{ $t('Embed via HTML Code') }}</h5>
                    <p class="mb-3">{{ $t('Want to use this form in another domain or another site or even outside WordPress? Use the following code') }}</p>

                    <textarea 
                        :value="embedCode"
                        style="width: 100%" 
                        type="textarea" 
                        :rows="5" 
                        :readonly="true"
                    >
                    </textarea>             
                    <div class="mt-3">
                        <p style="font-style: italic;" class="fs-14">- {{ $t('You can customize the height property.') }}</p>
                        <p style="font-style: italic;" class="fs-14">- {{ $t('Please check if your wp hosting server supports iframe.') }}</p>
                    </div>
                </div>
            </el-col>
        </el-row>
        <el-alert
            v-else
            :title="$t('Save and enable the landing page to generate share options.')"
            type="info"
            :closable="false">
        </el-alert>
    </div>
</template>

<script type="text/babel">
import qrcode from 'qrcode-generator';

export default {
    name: 'SharingView',
    props: ['share_url', 'form_id'],
    data() {
        return {
            clipboard: null
        }
    },
    computed: {
        encodedShareUrl() {
            return encodeURIComponent(this.share_url);
        },
        embedCode() {
            return `<iframe id="fluentform" width="100%" loading="lazy" height="500px" style="min-height: 500px; width: 100%;" frameborder="0" src="${this.share_url}&embedded=1" onload="this.style.height=(this.contentWindow.document.body.scrollHeight+40)+'px';"></iframe>`;
        },
        emailSubject() {
            return this.$t('Could you take a moment to fill in this form?');
        },
        emailMessage() {
            return `${this.$t('We would really appreciate it if you filled in this form:')}\n${this.share_url}\n\n${this.$t('Thank you!')}`;
        },
        mailUrl() {
            return `mailto:?subject=${encodeURIComponent(this.emailSubject)}&body=${encodeURIComponent(this.emailMessage)}`;
        },
        qrSvg() {
            if (!this.share_url) {
                return '';
            }

            const qr = qrcode(0, 'M');
            qr.addData(this.share_url);
            qr.make();

            return qr.createSvgTag(5, 2);
        },
        qrFileName() {
            return `fluentform-${this.form_id}-landing-page-qr.svg`;
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
            return this.mailUrl;
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
        const copyButtons = this.$el.querySelectorAll('.copy_share');

        if (copyButtons.length) {
            this.clipboard = new ClipboardJS(copyButtons);
            this.clipboard.on('success', (e) => {
                jQuery(e.trigger).addClass('fc_copy_success');
                setTimeout(() => {
                    jQuery(e.trigger).removeClass('fc_copy_success');
                }, 2000);
                this.$copy();
            });
        }
    },
    beforeDestroy() {
        if (this.clipboard) {
            this.clipboard.destroy();
        }
    }
}
</script>

<template>
    <div style="padding: 0px 20px;" class="ffc_sharing_settings">
        <h2>Share Your Form</h2>
        <el-row :gutter="30">
            <el-col :md="12" :sm="24">
                <div class="fcc_card">
                    <h3>Share Via Direct URL</h3>
                    <p>Get the link or share on social sites</p>
                    <el-input size="mini" v-model="share_url" :readonly="true">
                        <el-button type="success" @click="copyText()" class="copy_share"
                                   :data-clipboard-text='share_url' slot="append"
                                   icon="el-icon-document-copy"></el-button>
                    </el-input>
                    <ul class="fcc_inline_social">
                        <li>
                            <a :href="'https://www.facebook.com/sharer/sharer.php?u=' + share_url" target="_blank"
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
                <div class="fcc_card">
                    <h3>Shortcode</h3>
                    <p>Use this following shortcode in your Page or Post</p>
                    <el-input size="mini" v-model="classic_shortcode" :readonly="true">
                        <el-button @click="copyText()" class="copy_share" :data-clipboard-text='classic_shortcode'
                                   slot="append" icon="el-icon-document-copy"></el-button>
                    </el-input>
                </div>
            </el-col>
        </el-row>
        <el-row :gutter="30">
            <el-col :md="24" :sm="24">
                <div class="fcc_card">
                    <h3>Embed via HTML Code</h3>
                    <p>Want to use this form in another domain or another site or even outside WordPress? Use the
                        following code</p>
                    <textarea style="width: 100%" type="textarea" :rows="5" :readonly="true">
<iframe id="fluentform" width="100%" loading="lazy" height="500px" style="min-height: 500px;width: 100%" frameborder="0" src="{{share_url}}&embedded=1" onload="this.style.height=(this.contentWindow.document.body.scrollHeight+40)+'px';"></iframe></textarea>

                    <p style="font-style: italic;">- You can customize the height property.</p>
                    <p style="font-style: italic;">- Please check if your wp hosting server supports iframe.</p>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'SharingView',
    props: ['share_url', 'form_id'],
    computed: {
        smart_shortcode() {
            return '[fluentform type="conversational" id="' + this.form_id + '"]';
        },
        classic_shortcode() {
            return '[fluentform id="' + this.form_id + '"]';
        }
    },
    methods: {
        getTwitterParams() {
            let url = encodeURIComponent(this.share_url);
            return 'url=' + url + '&text=' + 'Would you please fill in this form%0aI really appreciate it!%0avia @Fluent_Forms%0a';
        },
        getLinkedInParams() {
            let url = encodeURIComponent(this.share_url);
            return 'url=' + url + '&title=';
        },
        getMailUrl() {
            return 'mailto:?subject=Could you take a moment to fill in this form?&body=We would really appreciate it if you filled in this Form:%0A→ ' + encodeURIComponent(this.share_url) + '%0A%0AThank+you!';
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
                this.$notify.success('copied to clipboard');
            });
        }
    }
}
</script>

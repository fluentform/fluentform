<template>
    <div class="ffc_sharing_settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Share Your Form') }}</h5>
            </card-head>
            <card-body>
                <card border>
                    <h5 class="mb-2">{{ $t('Share Via Direct URL') }}</h5>
                    <p>{{ $t('Get the link or share on social sites') }}</p>
                    <el-input :value="share_url" :readonly="true">
                        <template #append>
                            <el-button
                                @click="copyText()"
                                class="copy_share"
                                :data-clipboard-text='share_url'
                            >
                                <template #icon>
                                    <i class="el-icon-document-copy"></i>
                                </template>
                            </el-button>
                        </template>
                    </el-input>
                    <social class="mt-3">
                        <social-item :href="'https://www.facebook.com/sharer/sharer.php?u=' + share_url" icon="facebook"></social-item>
                        <social-item :href="'https://twitter.com/intent/tweet?' + getTwitterParams()" icon="twitter"></social-item>
                        <social-item :href="'https://www.linkedin.com/shareArticle?' + getLinkedInParams()" icon="linkedin"></social-item>
                        <social-item :href="getMailUrl()" icon="email-alt"></social-item>
                    </social>
                </card>
                <el-row :gutter="24">
                    <el-col :md="12" :sm="24">
                        <card border>
                            <h5 class="mb-2">{{ $t('Shortcode for Conversational Form') }}</h5>
                            <p>{{ $t('Use this following shortcode in your Page or Post') }}</p>
                            <el-input v-model="smart_shortcode" :readonly="true">
                                <template #append>
                                    <el-button
                                        @click="copyText()"
                                        class="copy_share"
                                        :data-clipboard-text='smart_shortcode'
                                    >
                                        <template #icon>
                                            <i class="el-icon-document-copy"></i>
                                        </template>
                                    </el-button>
                                </template>
                            </el-input>
                        </card>
                    </el-col>
                    <el-col :md="12" :sm="24">
                        <card border>
                            <h5 class="mb-2">{{ $t('Shortcode for Classic Form') }}</h5>
                            <p>{{ $t('Use this following shortcode in your Page or Post') }}</p>
                            <el-input v-model="classic_shortcode" :readonly="true">
                                <template #append>
                                    <el-button
                                        @click="copyText()"
                                        class="copy_share"
                                        :data-clipboard-text='classic_shortcode'
                                    >
                                        <template #icon>
                                            <i class="el-icon-document-copy"></i>
                                        </template>
                                    </el-button>
                                </template>
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
                        <p style="font-style: italic;" class="fs-14">- {{ $t('You can customize the height property.') }}</p>
                        <p style="font-style: italic;" class="fs-14">- {{ $t('Please check if your wp hosting server supports iframe.') }}</p>
                    </div>
                </card>
            </card-body>
        </card>
    </div>
</template>

<script>
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import Social from '@/admin/components/Social/Social.vue';
    import SocialItem from '@/admin/components/Social/SocialItem.vue';

    export default {
        name: 'SharingView',
        props: ['meta_settings', 'share_url', 'form_id'],
        components: { 
            Card,
            CardHead,
            CardBody,
            Social,
            SocialItem
        },
        data(){
            return {
                textareaValue: `<iframe id="fluentform" width="100%" height="500px" style="min-height: 500px;width: 100%" frameborder="0" src="${this.share_url}&embedded=1"></iframe>`
            }
        },
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
                    this.$copy();
                });
            }
        }
    }
</script>

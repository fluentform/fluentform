<template>
    <div class="ff_browser">
        <div class="fcc_design_preview">
            <div :class="'ffc_browser_' + device_type" class="browser-frame">
                <div class="browser-controls">
                    <div class="window-controls">
                        <span class="close"></span>
                        <span class="minimise"></span>
                        <span class="maximise"></span>
                    </div>
                    <div class="page-controls">
                        <span class="white-container dashicons dashicons-arrow-left-alt2"></span>
                        <span class="white-container dashicons dashicons-arrow-right-alt2"></span>
                    </div>
                    <span class="url-bar white-container">
                        {{ preview_url }}
                    </span>
                </div>
                <div style="min-height: 600px;" v-loading="loading_iframe" id="fcc_iframe_holder"></div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <el-switch
                    v-model="device_type"
                    active-value="desktop"
                    inactive-value="mobile"
                    active-text="Desktop"
                    inactive-text="Mobile">
                </el-switch>
            </div>
        </div>
    </div>
</template>
<script type="text/babel">
export default {
    name: 'FFBrowserFrame',
    data() {
        return {
            device_type: 'desktop',
            loading_iframe: true,
            frame: null
        }
    },
    watch: {
        settings: {
            handler(settings) {
                this.generateCss(settings);
            },
            deep: true
        }
    },
    props: ['settings', 'preview_url'],
    methods: {
        initIframe() {
            const that = this;
            this.iframe = jQuery('<iframe/>', {
                id: 'fcc_design_preview',
                src: this.preview_url,
                style: 'display:none;width:100%;height:600px',
                load: function () {
                    const frame = jQuery(this);
                    frame.show();
                  //  that.generateCss(that.design_settings);
                    that.loading_iframe = false;
                }
            });

            jQuery('#fcc_iframe_holder').html(this.iframe);
        },
        generateCss(settings) {
            let css = '';
            let prefix = '.ff_landing_wrapper';
            css += `.ff_landing_page_body { background-color: ${settings.custom_color} !important; }`;
            console.log(css);
            this.pushCSS(css);
        },
        pushCSS(css) {
            if (this.iframe) {
                this.iframe.contents().find('head').find('#ff_landing_css').html(css);
            }
        }
    },
    mounted() {
        this.initIframe();
    }
}
</script>
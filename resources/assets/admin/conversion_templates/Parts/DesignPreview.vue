<template>
    <div class="fcc_design_preview">
        <div class="browser-frame">
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
                <span v-if="has_pro" class="url-bar white-container">
                    FluentForm Preview
                </span>
                <span v-else class="url-bar bar-warning white-container">
                    Design Customization is only available on Pro Version of Fluent Forms. <a target="_blank" rel="noopener" href="https://fluentforms.com/conversational-form">Buy Pro</a>
                </span>
            </div>
            <div style="min-height: 600px;" v-loading="loading_iframe" id="fcc_iframe_holder"></div>
        </div>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'DesignPreview',
    props: ['form_id', 'design_settings', 'has_pro'],
    data() {
        return {
            iframe: false,
            loading_iframe: true,
            preview_url: window.ffc_conv_vars.preview_url
        }
    },
    watch: {
        design_settings: {
            handler(settings) {
                this.generateCss(settings);
            },
            deep: true
        }
    },
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
                    frame.contents().find('head').append('<style id="ffc_generated_css"></style>')
                    that.generateCss(that.design_settings);
                    that.loading_iframe = false;
                }
            });

            jQuery('#fcc_iframe_holder').html(this.iframe);
        },
        pushCSS(css) {
            if (this.iframe) {
                this.iframe.contents().find('head').find('#ffc_generated_css').html(css);
            }
        },
        generateCss(settings) {
            let css = '';
            let prefix = '.ff_conv_app_'+this.form_id;
            css += `${prefix} { background-color: ${settings.background_color}; }`;

            if (settings.answer_color) {
                css += `${prefix} .ffc-counter-div span { color: ${settings.answer_color}; }`;
                css += `${prefix} .ffc-counter-div .counter-icon-span svg { fill: ${settings.answer_color} !important; }`;
                css += `${prefix} .f-label-wrap { color: ${settings.answer_color} !important; }`;
                css += `${prefix} .f-label-wrap .f-key { border-color: ${settings.answer_color} !important; }`;
                css += `${prefix} .f-answer .f-radios-wrap ul li { background-color: ${this.hexToRGBA(settings.answer_color, '0.1')} !important; }`;
                css += `${prefix} .f-answer .f-radios-wrap ul li.f-selected { background-color: ${this.hexToRGBA(settings.answer_color, '0.3')} !important; }`;
                css += `${prefix} .f-answer .f-radios-wrap ul li.f-selected .f-key { background-color: ${settings.answer_color} !important; color: white; }`;
                css += `${prefix} .f-answer .f-radios-wrap ul li.f-selected svg { fill: ${settings.answer_color} !important; }`;
                css += `${prefix} .f-answer input, ${prefix} .f-answer textarea { color: ${settings.answer_color} !important; }`;
            }

            if (settings.question_color) {
                css += `${prefix} .fh2 .f-text { color: ${settings.question_color}; }`
                css += `${prefix} .fh2 .f-tagline { color: ${this.hexToRGBA(settings.question_color, '0.70')}; }`
            }

            if(settings.button_color) {
                css += `${prefix} .q-inner .o-btn-action, ${prefix} .footer-inner-wrap .f-nav { background-color: ${settings.button_color}; }`;
                css += `${prefix} .q-inner .o-btn-action span, ${prefix} .footer-inner-wrap .f-nav a { color: ${settings.button_text_color}; }`;
                css += `${prefix} .footer-inner-wrap .f-nav a svg { fill: ${settings.button_text_color}; }`;

            }

            if(settings.background_image) {
                let opacity = 1;
                let imagePropertyCss = '';
                if(settings.background_brightness && settings.background_brightness > 0) {
                    opacity = (1 - settings.background_brightness / 100).toFixed(2);
                } else if(settings.background_brightness < 0) {
                    opacity = settings.background_brightness;
                    css += `${prefix}:before { background-color: rgb(0, 0, 0); }`;
                    opacity = ((opacity * -1) / 100).toFixed(2);
                    imagePropertyCss = `linear-gradient(rgba(0, 0, 0, ${opacity}), rgba(0, 0, 0, ${opacity})), `;
                }

                css += `${prefix}:before { content: ' '; opacity: ${opacity}; background-image: ${imagePropertyCss} url("${settings.background_image}"); }`;
            }

            if(settings.disable_branding == 'yes') {
                css += `${prefix} .footer-inner-wrap .f-nav a.ffc_power { display: none !important; }`;
            }

            this.$emit('css_generated', css);
            this.pushCSS(css);
        },
        hexToRGBA(hex, opacity) {

            if(hex.indexOf('rgb(') !== -1) {
                return hex.replace( 'rgb(', 'rgba(' )
                    .replace( ')', ',' + opacity + ')' );
            }

            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            const values = result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;

            if(!values) {
                return `rgba(0,0,0, ${opacity})`;
            }

            return `rgba(${values.r},${values.g},${values.b}, ${opacity})`;
        }

    },
    mounted() {
        this.initIframe();
    }
}
</script>

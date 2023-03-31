<template>
    <div v-loading="!app_ready" class="settings_app">
        <router-view
            v-if="app_ready"
            :form_id="form_id"
            :form="form"
            :inputs="inputs"
            :has_pro="hasPro"
            :has_pdf="hasPDF"
            :editorShortcodes="editorShortcodes"
        ></router-view>
    </div>
</template>

<script type="text/babel">
    import { scrollTop } from '@/admin/helpers';

    export default {
        name: 'settings_app',
        data() {
            return {
                app_ready: false,
                form_id: window.FluentFormApp.form_id,
                form: {
                    id: window.FluentFormApp.form_id,
                },
                hasPro: !!window.FluentFormApp.hasPro,
                hasPDF: !!window.FluentFormApp.hasPDF,
                editorShortcodes: [],
                inputs: {}
            }
        },
        methods: {
            fetchInputs() {
                const url = FluentFormsGlobal.$rest.route('getFormFields', this.form_id);
                
                FluentFormsGlobal.$rest.get(url)
                    .then(response => {
                        this.inputs = Object.assign({}, response);
                        this.app_ready = true;
                    })
                    .catch(e => {
                    });
            },
            fetchAllEditorShortcodes() {
                const url = FluentFormsGlobal.$rest.route('getFormShortcodes', this.form_id);
                
                FluentFormsGlobal.$rest.get(url, {input_only: true})
                    .then(response => {
                        let allShortCodes = response;
                        if (allShortCodes[0] && allShortCodes[0]['shortcodes']) {
                            delete allShortCodes[0]['shortcodes']['{all_data}'];
                            delete allShortCodes[0]['shortcodes']['{all_data_without_hidden_fields}'];
                        }

                        this.editorShortcodes = allShortCodes;
                        this.app_ready = true;
                    })
                    .catch(e => {
                    });
            },
            scrollTo() {
                let pageScrollLink = jQuery('.ff-page-scroll');
                pageScrollLink.each(function(){
                    jQuery(this).on("click", function(e){
                        let targetHash = e.target.hash;
                        e.preventDefault();

                        const $settingsForm = jQuery('.ff_settings_form');
                        if($settingsForm.length){
                            const top = jQuery(targetHash).offset().top - 34 - $settingsForm.position().top + $settingsForm.scrollTop();
                            scrollTop(top, 'slow', '.ff_settings_form').then((_) => {
                                jQuery('head title').text( e.target.textContent.trim() + ' - Fluent Forms');
                            })
                        }
                
                    });
                });
            },
            handleActiveLink($el) {
                const $link = $el.parent(); // link is parent li element
                // root route link operation
                if ('/' === $el.data('route_key')) {
                    // set root route if route not set yet
                    if (this.$route.path !== '/') {
                        this.$router.push({ path: '/' })
                    }

                    // make first sub-link active if it has submenu
                    const $subMenuFirstItem = $link.find('ul.ff_list_submenu li:first');
                    if ($subMenuFirstItem.length) {
                        $subMenuFirstItem.addClass('active').siblings().removeClass('active');
                    }
                }
                //make current link active and others deactivate
                $link.addClass('active').siblings().removeClass('active');

                // toggle sub-links if curren link has sub-links
                if ($link.hasClass('has_sub_menu')) {
                    $link.toggleClass('is-submenu'); // toggle sub-link icon
                    $link.find('.ff_list_submenu').slideToggle();
                }

                // close all others sub-links if it has
                if ($link.siblings().hasClass('has_sub_menu')) {
                    $link.siblings().removeClass('is-submenu'); // sub-link icon close
                    $link.siblings().find('.ff_list_submenu').slideUp();
                }
            }
        },
        mounted() {
            this.fetchInputs();
            this.fetchAllEditorShortcodes();

            let currentActive = jQuery('.ff_settings_list a[data-route_key="' + this.$route.path + '"]');
            if(currentActive.length) {
                this.handleActiveLink(currentActive)
            } else {
                jQuery('.ff_settings_list li:first-child').addClass('active');
            }

            const that = this;
            jQuery('.ff_settings_list a').on('click', function (e) {
                const $el = jQuery(this);
                if($el.attr('href') === '#' || '/' === $el.data('route_key')){
                    e.preventDefault();
                }
                that.handleActiveLink($el)
            });

            jQuery('head title').text('Settings & Integrations - Fluent Forms');
            (new ClipboardJS('.copy')).on('success', (e) => {
                this.$copy();
            });

            // init scrolling page
            this.scrollTo();

        }
    }
</script>

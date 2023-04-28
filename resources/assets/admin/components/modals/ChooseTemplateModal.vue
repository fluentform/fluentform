<template>
    <div class="ff_choose_template_wrap" :class="{'ff_backdrop': visibility}">
        <el-dialog
            :visible.sync="visibility"
            width="100%"
            top= "50px"
            :before-close="close"
        >
            <template slot="title">
                <h3 class="title">{{$t('Choose a Template')}}</h3>
                <p class="text">{{$t('Choose a pre-made form template to get started right away.')}}
                </p>
            </template>

            <div class="ff_predefined_options mt-6">
                <div class="ff_predefined_sidebar">
                    <h5 class="ff_predefined_title mb-3">{{$t('Categoires')}}</h5>
                    <ul class="ff_list_button ff_list_button_s1">
                        <li 
                            class="ff_list_button_item" 
                            v-for="(item, index) in categories" 
                            :key="index"
                            :class="{'active': index === 0}"
                        >
                            <a
                                @click.prevent="scollTo" 
                                :href="'#' + item.toLocaleLowerCase()" 
                                class="ff_list_button_link"
                            >
                                {{item}}
                            </a>
                        </li>
                    </ul>
                </div><!-- .ff_predefined_sidebar -->
                <div class="ff_predefined_main">
                    <div class="form_item_group form_item_group_search mb-5">
                        <el-input
                            v-model="search"
                            :placeholder="$t('Search a form template')"
                            class="el-input-search el-input-border"
                            prefix-icon="el-icon-search"
                        >
                        </el-input>
                    </div>
                    <div
                        :element-loading-text="$t('Loading Forms...')"
                        element-loading-spinner="el-icon-loading"
                        v-loading="creatingForm"
                        class="ff_predefined_form_wrap"
                    >
                        <div 
                            v-for="(forms, category) in filteredForms" 
                            :id="category.toLocaleLowerCase()" 
                            class="ff_form_group" 
                            :key="category"
                        >
                            <h5 class="ff_form_group_title">{{category}}</h5>
                            <div class="ff_form_item_group">
                                <div v-for="(form, name, i) in forms" :class="form.class" class="ff_form_item_col" :key="i">
                                    <div class="ff_form_card">
                                        <img :src="form.screenshot" alt="" class="ff_form_card_img">
                                        <div
                                            :loading="creatingForm"
                                            @click="createForm(name, form)"
                                            class="ff_form_card_overlap"
                                        >
                                            <div class="ff_form_card_overlap_inner">
                                                <el-button>
                                                    <template v-if="creatingForm">
                                                        <span>{{$t('Creating Form...')}}</span>
                                                    </template>
                                                    <template v-else>
                                                        <span v-if="form.is_pro && !has_pro">{{$t('Unlock in Pro')}}</span>
                                                        <span v-else>{{ $t('Create Form') }}</span>
                                                    </template>
                                                </el-button>
                                                <p v-html="form.brief"></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div><!-- .ff_form_item_group -->

                        </div>
                    </div>

                </div><!-- .ff_predefined_main -->
            </div><!-- .ff_predefined_options -->
        </el-dialog>
    </div>
</template>

<script>
    import each from 'lodash/each';

    export default {
        name: 'ChooseTemplateModal',
        props: {
            categories: Array,
            visibility: Boolean,
            predefinedForms: Object
        },
        data() {
            return {
                creatingForm: false,
                // predefinedForms: {},
                form_title: '',
                category: '',
                // categories: [],
                search: '',
                has_pro: !!window.FluentFormApp.hasPro,
                current: null,
            }
        },
        computed: {
            filteredForms() {
                let items = {};

                if (this.search) {
                    let search = this.search.toLocaleLowerCase();
                    let allForms = {
                        'Search Result': {}
                    };

                    each(this.predefinedForms, (forms, formCategory) => {
                        each(forms, (form, formName) => {
                            let formStrung = JSON.stringify([
                                form.title,
                                form.category,
                                form.tags
                            ]).toLowerCase();

                            if (formStrung.indexOf(search) != -1) {
                                allForms['Search Result'][formName] = form;
                            }
                        });
                    });

                    this.category = '';
                    
                    return allForms;
                } else {
                    if (this.category) {
                        items[this.category] = this.predefinedForms[this.category];
                    } else {
                        return this.predefinedForms;
                    }
                }

                return items;
            }
        },
        methods: {
            close() {
                this.$emit('update:visibility', false);
            },
            createForm(formType, form) {
                let selectedFormType = 'form';
                if (form) {
                    if (form.is_pro && !window.FluentFormApp.hasPro) {
                        return this.$fail(this.$t('This form required pro add-on of fluentform. Please install pro add-on'));
                    }
                    selectedFormType = form.type;
                }

                this.creatingForm = true;

                let data = {
                    type: selectedFormType,
                    predefined: formType,
                    action: 'fluentform-predefined-create'
                };

                return this.doCreateForm(data)
            },
            doCreateForm(data) {
                const url = FluentFormsGlobal.$rest.route('getForms');
                
                FluentFormsGlobal.$rest.post(url, data)
                .then((response) => {
                    this.$success(response.message);

                    if (response.redirect_url) {
                        window.location.href = response.redirect_url;
                    }
                })
                .catch(error => {
                    this.$fail(error.message);
                })
                .finally(() => {
                    this.creatingForm = false;
                });
            },
            scollTo(e) {
                let targetHash = e.target.hash;
                let listItem = jQuery('.ff_list_button_item');

                listItem.addClass('active');

                for (let i = 0; i < listItem.length; i++) {
                    if (e.target.parentElement != listItem[i]) {
                        jQuery(listItem[i]).removeClass('active');
                    }
                }
    
                jQuery('.ff_predefined_form_wrap').animate({
                    scrollTop: jQuery(targetHash).offset().top - 54 - jQuery('.ff_predefined_form_wrap').position().top + jQuery('.ff_predefined_form_wrap').scrollTop()

                }, 'slow');
                
            },
            goToImportPage() {
                let path = window.location.href;
                const index = path.lastIndexOf('fluent_forms#add=1');
                path = path.substring(0, index);
                path += 'fluent_forms_transfer#importforms';
                window.location.href = path;
            }
            // stickyMenu(){
            //     let stickyElem = jQuery('#sticky-menu');
            //     let stickyTop = stickyElem.offset().top;

            //     jQuery(window).on('scroll', function() {
            //         let windowTop = jQuery(window).scrollTop();
            //         if (stickyTop < windowTop) {
            //             stickyElem.addClass('is-sticky');
            //         } else {
            //             stickyElem.removeClass("is-sticky");
            //         }
            //     });
            // }

        },
        mounted() {
            // this.createForm();
            // this.fetchPredefinedForms();
            // this.forms = this.predefinedForms;
            // this.categories = this.categories;
            
        }
    };
</script>

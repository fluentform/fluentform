<template>
    <div>
        <div class="ff_section_block">
            <div class="ff_section_heading mb-5">
                <h1 class="ff_section_title">{{$t('Choose an Option')}}</h1>
            </div>
            <div class="ff_card_wrap">
                <el-row :gutter="32">
                    <el-col :sm="8">
                        <div class="ff_card ff_card_form_action" @click="createForm('blank_form')">
                            <div class="ff_card_img mb-4">
                                <img :src="blankFormImg" alt="">
                            </div>
                            <div class="ff_card_body">
                                <h5 class="mb-2 ff_card_title">{{$t('New Blank Form')}}</h5>
                                <p class="ff_card_text">{{$t('Create a New Blank form from scratch.')}}</p>
                            </div>
                        </div><!-- .ff_card -->
                    </el-col>
                    <el-col :sm="8">
                        <div class="ff_card ff_card_form_action" @click="postTypeSelectionDialogVisibility = true">
                            <div class="ff_card_img mb-4">
                                <img :src="createPostFormImg" alt="">
                            </div>
                            <div class="ff_card_body">
                                <h5 class="mb-2 ff_card_title">{{$t('Create A Post Form')}}</h5>
                                <p class="ff_card_text">{{$t('Create a Post type form from scratch.')}}</p>
                            </div>
                        </div><!-- .ff_card -->
                    </el-col>
                    <el-col :sm="8">
                        <div class="ff_card ff_card_form_action" @click="createForm('conversational')">
                            <div class="ff_card_img mb-4">
                                <img :src="conversationalFormImg" alt="">
                            </div>
                            <div class="ff_card_body">
                                <h5 class="mb-2 ff_card_title">{{$t('Create Conversational Form')}}</h5>
                                <p class="ff_card_text">{{$t('Create smart form user Interface.')}}</p>
                            </div>
                        </div><!-- .ff_card -->
                    </el-col>
                </el-row>
            </div>
        </div><!-- .ff_section_block -->
        <div class="ff_section_block">
            <div class="ff_section_heading mb-5">
                <h1 class="ff_section_title mb-3">{{$t('Choose a Template')}}</h1>
                <p class="ff_section_desc">{{$t('Here are some beautiful, fully customizable templates to get you started.')}}</p>
            </div>
            <div class="ff_predefined_options">
                <div class="ff_predefined_sidebar" id="sticky-menu">
                    <h5 class="ff_predefined_title mb-3">{{$t('Categoires')}}</h5>
                    <el-radio-group v-model="category" class="ff_radio_list">
                        <el-radio-button class="ff_radio_list_item" v-for="item in categories" :key="item" :label="item">{{item}}</el-radio-button>
                    </el-radio-group>
                </div><!-- .ff_predefined_sidebar -->
                <div class="ff_predefined_main">
                    <div class="form_item_group form_item_group_search mb-5">
                        <el-input
                            v-model="search"
                            :placeholder="$t('Search Forms')"
                            class="input-with-select el-input-search el-input-border"
                            prefix-icon="el-icon-search"
                        >
                        </el-input>
                    </div>

                    <div 
                        :element-loading-text="$t('Loading Forms...')" 
                        element-loading-spinner="el-icon-loading" 
                        v-loading="loading |creatingForm"
                        class="ff_predefined_form_wrap"
                    >
                        <div v-for="(forms, category) in filteredForms" class="ff_form_group" :key="category">
                            <h5 class="mb-4">{{category}}</h5>
                            <div class="ff_form_item_group">
                                <div v-for="(form, name) in forms" class="ff_form_item_col" :key="name">
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
                                                        <span v-if="form.is_pro && !has_pro">Unlock in Pro</span>
                                                        <span v-else>{{ $t('Create Form') }}</span>
                                                    </template>
                                                </el-button>
                                                <p v-html="form.brief"></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div><!-- .ff_predefined_form_wrap -->
                </div><!-- .ff_laout_main -->
            </div>
        </div><!-- .ff_section_block -->

        <PostTypeSelectionModal
            @on-post-type-selction-end="onPostTypeSelctionEnd"
            :postTypeSelectionDialogVisibility="postTypeSelectionDialogVisibility"
            :hasPro="has_pro"
        />
    </div>
</template>

<script>
    import each from 'lodash/each';
    import PostTypeSelectionModal from '../components/modals/PostTypeSelectionModal';

    export default {
        name: "AddNewForms",
        components: {
            PostTypeSelectionModal
        },
        data() {
            return {
                has_post_feature: !!window.FluentFormApp.has_post_feature,
                postFormData: {
                    type: 'post',
                    predefined: 'blank_form',
                    action: 'fluentform-predefined-create'
                },
                loading: true,
                categories: [
                    'All',
                    'Basic',
                    'Marketing',
                    'Product',
                    'Education',
                    'Nonprofit',
                    'IT',
                    'Finance',
                    'HR',
                    'Social',
                    'Government',
                    'Healthcare'
                ],
                creatingForm: false,
                predefinedForms: {},
                isNewForm: false,
                selectedPredefinedForm: '',
                category: 'All',
                fetching: false,
                search: '',
                postTypeSelectionDialogVisibility: false,
                has_pro: !!window.FluentFormApp.hasPro,
                goToHomeURL: window.FluentFormApp.adminUrl + '?page=fluent_forms',
                blankFormImg:  window.FluentFormApp.plugin_public_url + 'img/blank-form.png',
                createPostFormImg:  window.FluentFormApp.plugin_public_url + 'img/create-post-form.png',
                conversationalFormImg:  window.FluentFormApp.plugin_public_url + 'img/conversational-form.png',
            }
        },
        computed: {
            filteredForms() {
                let items = {};
                this.loading = true;

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
                                setTimeout(() => {
                                    this.loading = false;
                                }, 500);
                                
                                allForms['Search Result'][formName] = form;
                            }
                        });
                    });

                    this.category = 'All';

                    return allForms;
                } else {
                    if (this.category == 'All') {
                        setTimeout(() => {
                            this.loading = false;
                        }, 500);
                        return this.predefinedForms;
                    }else if(this.category){
                        setTimeout(() => {
                            this.loading = false;
                        }, 500);
                        items[this.category] = this.predefinedForms[this.category];
                    } else {
                        return this.predefinedForms;
                    }
                }
                
                return items;

            },
        },
        methods: {
            getPredefinedForms() {
                this.loading = true;

                const url = FluentFormsGlobal.$rest.route('getTemplates');

                FluentFormsGlobal.$rest.get(url)
                .then(response => {
                    this.predefinedForms = response.forms;
                    //this.categories = response.categories;
                    //this.predefinedDropDownForms = response.predefined_dropDown_forms;
                }).catch(error => {
                    this.$fail(error.message);
                })
                .finally(() => {
                    this.loading = false;
                });
            },
            close() {
                this.$emit('update:visibility', false);
                this.isNewForm = false;
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

                if (selectedFormType === 'post') {
                    return this.createPostForm(data);
                }

                return this.doCreateForm(data)
            },
            createPostForm(data) {
                this.postFormData = data;
                this.postTypeSelectionDialogVisibility = true;
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
            onPostTypeSelctionEnd(post_type) {
                this.creatingForm = false;
                this.postTypeSelectionDialogVisibility = false;
                if (post_type) {
                    this.doCreateForm({post_type, ...this.postFormData});
                }
            },
            gotoPage(url) {
                location.href = url;
            },
            stickyMenu(){
                let stickyElem = jQuery('#sticky-menu');
                let stickyTop = stickyElem.offset().top;

                jQuery(window).on('scroll', function() {
                    let windowTop = jQuery(window).scrollTop();
                    if (stickyTop < windowTop) {
                        stickyElem.addClass('is-sticky');
                    } else {
                        stickyElem.removeClass("is-sticky");
                    }
                });
            },
            
            
        },
        mounted(){
            this.stickyMenu();
            this.getPredefinedForms();
        },
    }
</script>

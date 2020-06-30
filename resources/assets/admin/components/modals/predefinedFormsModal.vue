<template>
    <div  :class="{'ff_backdrop': visibility}">
        <el-dialog
            top="40px"
            width="90%"
             element-loading-text="Creating Form, Please wait..."
             element-loading-spinner="el-icon-loading"
            :loading="creatingForm"
            :visible="visibility"
            :before-close="close"
            class="predefinedModal"
        >

            <PostTypeSelectionModal
                @on-post-type-selction-end="onPostTypeSelctionEnd"
                :postTypeSelectionDialogVisibility="postTypeSelectionDialogVisibility"
            />

            <div slot="title">
                <b>
                    Choose a pre-made form template or
                    <a href="#" type="info" @click.prevent="createForm('blank_form')">
                        create a blank form
                    </a>
                </b>
            </div>

            <div class="form_action_navigations">
                <div class="form_item_group">
                    <label>Category</label>
                    <el-select size="mini" v-model="category" clearable placeholder="All Category">
                        <el-option
                            v-for="item in categories"
                            :key="item"
                            :label="item"
                            :value="item">
                        </el-option>
                    </el-select>
                </div>

                <div class="form_item_group form_item_group_search">
                    <el-input
                        size="mini"
                        v-model="search"
                        placeholder="Search Form"
                        class="input-with-select"
                    >
                        <el-button slot="append" icon="el-icon-search"></el-button>
                    </el-input>
                </div>
            </div>

            <div
                element-loading-text="Working..."
                element-loading-spinner="el-icon-loading"
                v-loading="fetching || creatingForm"
                style="min-height: 200px"
                class="ff-el-banner-group"
            >
                <div v-for="(forms, category) in filteredForms" class="ff_form_group">
                    <h3>{{category}}</h3>
                    <div v-for="(form, name) in forms" :class="form.class" class="ff-el-banner">
                        <div class="ff-el-banner-inner-item">
                            <p class="ff-el-banner-header">{{ form.title }}</p>
                            <img :src="form.screenshot" alt="">
                            <div
                                :loading="creatingForm"
                                @click="createForm(name, form)"
                                class="ff-el-banner-text-inside ff-el-banner-text-inside-hoverable"
                            >
                                <p style="text-align:center;" v-html="form.brief"></p>

                                <div class="text-center mtb10">
                                    <el-button size="small">
                                        <template v-if="creatingForm">
                                            <span>Creating Form...</span>
                                        </template>
                                        <template v-else>
                                            <span v-if="form.is_pro && !has_pro">Unlock in Pro</span>
                                            <span v-else>Create Form</span>
                                        </template>
                                    </el-button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <span slot="footer" class="dialog-footer">
                <el-button
                    v-if="has_post_feature"
                    size="mini"
                    type="info"
                    class="ff_create_post_form"
                    :loading="creatingForm"
                    @click="postTypeSelectionDialogVisibility = true"
                >
                    <span v-if="creatingForm">Creating Form...</span>
                    <span v-else>New a Post Creation Form</span>
                </el-button>

                <el-button size="mini" @click="close">Cancel</el-button>
                <el-button
                    size="mini"
                    type="danger"
                    :loading="creatingForm"
                    @click="createForm('blank_form')"
                >
                    <span v-if="creatingForm">Creating Form...</span>
                    <span v-else>Create a Blank Form</span>
                </el-button>

            </span>
        </el-dialog>
    </div>
</template>

<script type="text/babel">
    import each from 'lodash/each';
    import PostTypeSelectionModal from './PostTypeSelectionModal';

    export default {
        name: 'predefinedFormsModal',
        components: {PostTypeSelectionModal},
        props: {
            categories: Array,
            visibility: Boolean,
            predefinedForms: Object
        },
        data() {
            return {
                has_post_feature: !!window.FluentFormApp.has_post_feature,
                postFormData: {
                    type: 'post',
                    predefined: 'blank_form',
                    action: this.$action.createPredefinedForm
                },
                creatingForm: false,
                // predefinedForms: {},
                isNewForm: false,
                selectedPredefinedForm: '',
                form_title: '',
                category: '',
                // categories: [],
                fetching: false,
                search: '',
                postTypeSelectionDialogVisibility: false,
                has_pro: !!window.FluentFormApp.hasPro
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
                this.isNewForm = false;
            },
            createForm(formType, form) {
                let selectedFormType = 'form';
                if (form) {
                    if (form.is_pro && !window.FluentFormApp.hasPro) {
                        return this.$notify.error({
                            title: 'Pro Required!',
                            message: 'This form required pro add-on of fluentform. Please install pro add-on',
                            offset: 30
                        });
                    }
                    selectedFormType = form.type;
                }

                this.creatingForm = true;

                let data = {
                    type: selectedFormType,
                    predefined: formType,
                    action: this.$action.createPredefinedForm
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
                jQuery.get(ajaxurl, data)
                    .done((response) => {
                        this.$notify.success({
                            title: 'Congratulations!',
                            message: response.data.message,
                            offset: 30
                        });
                        window.location.href = response.data.redirect_url;
                    })
                    .fail(error => {
                        this.$message.error(error.responseJSON.data.message);
                    })
                    .always(() => {
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
            }
        },

        mounted() {
            // this.createForm();
            // this.fetchPredefinedForms();
            // this.forms = this.predefinedForms;
            // this.categories = this.categories;
        }
    };
</script>

<style lang="scss">
    .mtb10 {
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .predefinedModal .el-dialog {
        overflow-y: scroll;
        height: 600px;
        .el-dialog__body {
            height: 484px;
            overflow: scroll;
        }
    }

    .ff_form_group {
        position: relative;
        width: 100%;
        overflow: hidden;
    }

    .form_item_group {
        display: inline-block;
        label {
            display: inline-block;
        }
    }

    .form_item_group.form_item_group_search {
        float: right;
    }

    .form_action_navigations {
        margin: -20px -20px 0px;
        padding: 10px 20px 10px;
        background: whitesmoke;
        border-bottom: 1px solid #dddddd;
    }

    .ff-el-banner {
        padding: 0px !important;
        word-break: break-word;
        &:hover {
            background: #009cff;
            -webkit-transition: background-color 100ms linear;
            -ms-transition: background-color 100ms linear;
            transition: background-color 100ms linear;
        }
    }

    .item_has_image {
        .ff-el-banner-text-inside.ff-el-banner-text-inside-hoverable {
            opacity: 0;
            visibility: hidden;
        }
        &:hover {
            .ff-el-banner-text-inside-hoverable {
                display: flex;
                background: #009cff;
                -webkit-transition: background-color 100ms linear;
                -ms-transition: background-color 100ms linear;
                transition: background-color 100ms linear;
            }
        }
    }

    .item_no_image {
        .ff-el-banner-header {
            position: absolute;
            z-index: 999999;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
            padding-top: 110px;
            font-size: 15px;
            font-weight: bold;
            background: transparent;
            word-break: break-word;
        }
        &:hover {
            .ff-el-banner-header {
                display: none;
                visibility: hidden;
            }
            .ff-el-banner-text-inside-hoverable {
                display: flex;
            }
        }
        .ff-el-banner-text-inside-hoverable {
            display: none;
        }
    }

    .ff-el-banner-text-inside {
        cursor: pointer;
    }

    .item_education {
        background-color: #4B77BE;
    }

    .item_government {
        background-color: #8E44AD;
    }

    .item_healthcare {
        background-color: #26A587;
    }

    .item_hr {
        background-color: #C3272B;
    }

    .item_it {
        background-color: #1F97C1;
    }

    .item_finance {
        background-color: #083A82;
    }

    .item_technology {
        background-color: #EA7F13;
    }

    .item_website {
        background-color: #C93756;
    }

    .item_product {
        background-color: #9574A8;
    }

    .item_marketing {
        background-color: #F1828D;
    }

    .item_newsletter {
        background-color: #D64C84;
    }

    .item_nonprofit {
        background-color: #CE9138;
    }

    .item_social {
        background-color: #4CAF50;
    }

    .el-notification.right {
        z-index: 9999999999 !important;
    }
    button.el-button.ff_create_post_form.el-button--info.el-button--mini {
        float: left !important;
    }
</style>

<template>
    <div>
        <el-row>
            <el-col :sm="12">
                <div style="display: inline-block; margin-right: 20px; font-size: 23px;"
                     class="wp-heading-inline">
                    {{ $t('All Forms') }}
                </div>

                <el-dropdown
                    v-if="has_post_feature"
                    split-button
                    size="small"
                    type="primary"
                    trigger="click"
                    style="display:inline-block;"
                    @click="showAddFormModal = true"
                    @command="createForm"
                >
                    {{ $t('Add a New Form') }}

                    <!-- The split dropdown for creating predefined forms easily -->
                    <el-dropdown-menu slot="dropdown" style="top:25px !important;">
                        <el-dropdown-item
                            :key="key"
                            :command="{key, form}"
                            v-for="(form, key) in predefinedDropDownForms"
                        >
                            Create {{ form.title }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
                <el-button @click="showAddFormModal = true" size="small"
                           type="primary" v-else> {{ $t('Add a New Form') }}
                </el-button>

            </el-col>

            <el-col :sm="12">
                <div class="text-right">
                    <el-row>
                        <el-col :sm="{ span: 14, offset: 10 }">
                            <el-form @submit.native.prevent="searchForms">
                                <el-input
                                    clearable
                                    @clear="refetchItems"
                                    size="small"
                                    v-model="searchFormsKeyWord"
                                    placeholder="Search Forms..."
                                >
                                    <el-button native-type="submit" slot="append">Search</el-button>
                                </el-input>
                            </el-form>
                        </el-col>
                    </el-row>
                </div>
            </el-col>
        </el-row>
        <hr/>
        <div v-loading="loading"
             class="ff_forms_table"
             element-loading-text="Loading Forms..."
        >
            <template v-if="app.formsCount > 0">
                <div
                     class="entries_table">
                    <div class="tablenav top">
                        <el-table
                            :data="items"
                            :stripe="true"
                            @sort-change="handleTableSort"
                            @selection-change="handleSelectionChange">

                            <el-table-column sortable :label="$t('ID')" prop="id" width="60"></el-table-column>

                            <el-table-column sortable :label="$t('Title')" prop="title" min-width="230">
                                <template slot-scope="scope">
                                    <strong>{{ scope.row.title }}</strong>
                                    <span v-show="scope.row.has_payment == '1'" class="el-icon el-icon-money"></span>
                                    <div class="row-actions">
                                        <span class="ff_edit">
                                            <a :href="scope.row.edit_url"> {{ $t('Edit') }}</a> |
                                        </span>
                                        <span class="ff_edit">
                                            <a :href="scope.row.settings_url"> {{ $t('Settings') }}</a> |
                                        </span>
                                        <span class="ff_entries">
                                         <a :href="scope.row.entries_url"> {{ $t('Entries') }}</a> |
                                    </span>
                                        <span class="ff_entries">
                                         <a target="_blank" :href="scope.row.preview_url"> {{ $t('Preview') }}</a> |
                                    </span>
                                        <span class="ff_duplicate">
                                         <a href="#" @click.prevent="duplicateForm(scope.row.id)"> {{
                                                 $t('Duplicate')
                                             }}</a> |
                                    </span>
                                        <span class="trash">
                                        <remove @on-confirm="removeForm(scope.row.id, scope.$index)">
                                            <a slot="icon">{{ $t('Delete') }}</a>
                                        </remove>
                                    </span>
                                    </div>
                                </template>
                            </el-table-column>

                            <el-table-column :label="$t('Short Code')" width="260">
                                <el-tooltip class="item"
                                            slot-scope="scope"
                                            effect="dark"
                                            content="Click to copy shortcode"
                                            title="Click to copy shortcode"
                                            placement="top">
                                    <code class="copy"
                                          :data-clipboard-text='`[fluentform id="${scope.row.id}"]`'>
                                        <i class="el-icon-document"></i> [fluentform id="{{ scope.row.id }}"]
                                    </code>
                                </el-tooltip>
                            </el-table-column>

                            <el-table-column width="150" :label="$t('Entries')">
                                <template slot-scope="scope">
                                    <a :href="scope.row.entries_url"><span
                                        v-show="scope.row.unread_count">{{ scope.row.unread_count }} / </span>{{
                                            scope.row.total_Submissions
                                        }}</a>
                                </template>
                            </el-table-column>

                            <el-table-column v-if="!isDisabledAnalytics" width="80" :label="$t('Views')">
                                <template slot-scope="scope">
                                    {{ scope.row.total_views }}
                                </template>
                            </el-table-column>

                            <el-table-column v-if="!isDisabledAnalytics" width="120" :label="$t('Conversion')">
                                <template slot-scope="scope">
                                    {{ scope.row.conversion }}%
                                </template>
                            </el-table-column>
                        </el-table>

                        <div class="tablenav bottom">
                            <div class="pull-right">
                                <el-pagination
                                    @size-change="handleSizeChange"
                                    @current-change="goToPage"
                                    :current-page.sync="paginate.current_page"
                                    :page-sizes="[5, 10, 20, 50, 100]"
                                    :page-size="parseInt(paginate.per_page)"
                                    layout="total, sizes, prev, pager, next, jumper"
                                    :total="paginate.total">
                                </el-pagination>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <div v-else>
                <div class="fluent_form_intro">
                    <h1 class="text-center">Welcome to WP Fluent Froms</h1>
                    <p class="text-center">Thank you for installing WP Fluent Froms - The Most Advanced Form Builder
                        Plugin for WordPress</p>
                    <div class="text-center">
                        <el-button
                            round
                            type="primary"
                            @click="showAddFormModal = true"
                        >Click Here to Create Your
                            First Form
                        </el-button>
                    </div>
                </div>
                <div class="fluent_form_intro_video">
                    <h2>Check the video intro</h2>
                    <div class="videoWrapper">
                        <iframe width="1237" height="696" src="https://www.youtube.com/embed/AqVr0l1JrGE"
                                frameborder="0"
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen></iframe>
                    </div>
                </div>
            </div>
        </div>

        <predefinedFormsModal
            ref="predefinedFormsModal"
            v-show="showAddFormModal"
            :categories="categories"
            :predefinedForms="predefinedForms"
            :visibility.sync="showAddFormModal"
        />

        <PostTypeSelectionModal
            @on-post-type-selction-end="onPostTypeSelctionEnd"
            :postTypeSelectionDialogVisibility="postTypeSelectionDialogVisibility"
        />
    </div>
</template>

<script type="text/babel">
import Clipboard from 'clipboard';
import remove from '../components/confirmRemove'
import AddFormModal from '../components/modals/AddFormModal';
import predefinedFormsModal from '../components/modals/predefinedFormsModal';
import PostTypeSelectionModal from '../components/modals/PostTypeSelectionModal';

export default {
    name: 'AllForms',
    components: {
        predefinedFormsModal,
        AddFormModal,
        remove,
        PostTypeSelectionModal
    },
    data() {
        return {
            has_post_feature: !!window.FluentFormApp.has_post_feature,
            app: window.FluentFormApp,
            paginate: {
                total: 0,
                current_page: 1,
                last_page: 1,
                per_page: localStorage.getItem('formItemsPerPage') || 10
            },
            loading: true,
            items: [],
            predefinedForms: {},
            predefinedDropDownForms: {},
            categories: [],
            search_string: '',
            selectAll: 0,
            showAddFormModal: false,
            checkedItems: [],
            showSelectFormModal: false,
            searchFormsKeyWord: '',
            clearingSearchKeyword: false,
            postTypeSelectionDialogVisibility: false,
            isDisabledAnalytics: !!window.FluentFormApp.isDisableAnalytics,
            sort_column: 'id',
            sort_by: 'DESC'
        }
    },
    methods: {
        goToPage(val) {
            jQuery('html, body').animate({scrollTop: 0}, 300).promise().then(elements => {
                this.fetchItems(
                    this.paginate.current_page = val
                );
            });
        },
        handleSizeChange(val) {
            localStorage.setItem('formItemsPerPage', val);
            this.paginate.per_page = val;
            this.fetchItems();
        },
        fetchItems() {
            this.loading = true;
            let data = {
                search: this.searchFormsKeyWord,
                action: 'fluentform-forms',
                per_page: this.paginate.per_page,
                page: this.paginate.current_page,
                sort_column: this.sort_column,
                sort_by: this.sort_by
            };

            FluentFormsGlobal.$get(data)
                .done((response) => {
                    this.items = response.data;
                    this.paginate.total = response.total;
                    this.paginate.current_page = response.current_page;
                    this.paginate.last_page = response.last_page;
                })
                .fail(error => {
                    this.$message.error('Something went wrong, please try again.');
                })
                .always(() => {
                    this.loading = false;
                });
        },
        refetchItems() {
            this.paginate.current_page = 1;
            this.clearingSearchKeyword = true;
            this.fetchItems();
            this.$nextTick(() => {
                this.clearingSearchKeyword = false;
            });
        },
        getPredefinedForms() {
            this.loading = true;

            FluentFormsGlobal.$get({
                action: 'fluentform-predefined-forms'
            }).done(res => {
                this.predefinedForms = res.forms;
                this.categories = res.categories;
                this.predefinedDropDownForms = res.predefined_dropDown_forms;
            }).fail(error => {
                this.$message.error('Something went wrong, please try again.');
            })
                .always(() => {
                    this.loading = false;
                });
        },
        removeForm(id, index) {
            let data = {
                action: 'fluentform-form-delete',
                formId: id
            }
            FluentFormsGlobal.$get(data)
                .done(res => {
                    this.items.splice(index, 1);
                    this.$notify.success({
                        title: 'Congratulations!',
                        message: res.message,
                        offset: 30
                    });
                })
                .fail(_ => {
                });
        },
        duplicateForm(id) {
            let data = {
                action: 'fluentform-form-duplicate',
                formId: id
            }
            FluentFormsGlobal.$post(data)
                .then(res => {
                    this.$notify.success({
                        title: 'Congratulations!',
                        message: res.message,
                        offset: 30
                    });
                    if (res.redirect) {
                        window.location.href = res.redirect;
                    } else {
                        alert('Something is wrong! Please try again');
                    }
                })
                .fail(error => {
                    alert('Something is wrong! Please try again');
                });
        },
        handleTableSort(column) {
            if (column.order) {
                this.sort_column = column.prop;
                this.sort_by = (column.order === 'ascending') ? 'ASC' : 'DESC';
                this.fetchItems();
            }
        },
        handleSelectionChange(val) {
            this.entrySelections = val;
        },
        searchForms(event) {
            this.paginate.current_page = 1;
            this.fetchItems();
        },
        createForm({key, form}) {
            if (key === 'post') {
                return this.createPostForm(key, form);
            }

            this.$refs.predefinedFormsModal.createForm(
                key, // formType
                form // form
            );
        },
        createPostForm(key, form) {
            this.postTypeSelectionDialogVisibility = true;
        },
        onPostTypeSelctionEnd(post_type) {
            this.postTypeSelectionDialogVisibility = false;

            if (post_type) {
                this.$refs.predefinedFormsModal.doCreateForm({
                    post_type,
                    type: 'post',
                    title: 'Post Form',
                    predefined: 'blank_form',
                    action: 'fluentform-predefined-create'
                });
            }
        }
    },
    mounted() {
        this.fetchItems();
        this.getPredefinedForms();

        (new Clipboard('.copy')).on('success', event => {
            this.$message({
                message: 'Copied to Clipboard!',
                type: 'success'
            });
        });
    },
    created() {
        let hash = window.location.hash;

        if (hash.indexOf('add=1') != -1) {
            this.showAddFormModal = true;
        }

        if (hash.indexOf('entries') != -1) {
            this.showSelectFormModal = true;
        }

        jQuery('a[href="admin.php?page=fluent_forms#add=1"]').on('click', event => {
            this.showAddFormModal = true;
            this.showSelectFormModal = false;
        });

        jQuery('a[href="admin.php?page=fluent_forms#entries"]').on('click', event => {
            this.showAddFormModal = false;
            this.showSelectFormModal = true;
        });
    },
    watch: {
        searchFormsKeyWord: function (newVal, oldVal) {
            if ((oldVal && !newVal) && !this.clearingSearchKeyword) {
                this.paginate.current_page = 1;
                this.fetchItems();
            }
        }
    }
};
</script>


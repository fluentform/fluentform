<template>
    <div>
        <div class="ff_section_head sm">
            <div class="ff_section_title">{{ $t('All Forms') }}</div>
        </div>
        <el-row class="mb-4">
            <el-col :sm="12">
                <el-row>
                    <div class="ff_action_wrap">
                        <el-select
                           class="mr-3 ff_filter_form_select"
                            clearable
                            v-model="filter_by"
                            :placeholder="$t('All Types')"
                            @change="filterFormType()"
                        >
                            <el-option
                                v-for="(status, status_key) in form_statuses"
                                :key="status_key"
                                :value="status_key"
                                :label="status"
                            >
                                {{status}}
                            </el-option>
                        </el-select>
                        <a
                            class="el-button el-button--primary"
                            v-if="hasPermission('fluentform_forms_manager')"
                            type="primary"
                            :href="addNewFormURL"
                        >
                            <i class="el-icon-plus el-icon-left el-icon"></i>
                            <span>{{ $t('Add New Form') }}</span>
                        </a>
                    </div>
                </el-row>
            </el-col>
            <el-col :sm="12">
                <el-row class="justify-end">
                    <el-form @submit.native.prevent="searchForms" class="mr-3">
                        <el-input
                            clearable
                            @clear="refetchItems"
                            v-model="searchFormsKeyWord"
                            :placeholder="$t('Search Forms')"
                            prefix-icon="el-icon-search"
                            class="el-input-gray"
                        >
                        </el-input>
                    </el-form>
                    <div class="ff_advanced_filter_wrap">
                        <el-button @click="advancedFilter = !advancedFilter">
                            {{$t('Advanced Filter')}}
                            <i class="el-icon-s-operation el-icon-right"></i>
                        </el-button>
                        <div v-if="advancedFilter" class="ff_advanced_search">
                            <div class="ff_advanced_search_radios">
                                <el-radio-group v-model="radioOption" class="el-radio-group-column">
                                    <el-radio label="today">Today</el-radio>
                                    <el-radio label="yesterday">Yesterday</el-radio>
                                    <el-radio label="last-week">Last Week</el-radio>
                                    <el-radio label="last-month">Last Month</el-radio>
                                </el-radio-group>
                            </div>
                            <div class="ff_advanced_search_date_range">
                                <p>Select a Timeframe</p>
                                 <el-date-picker
                                    v-model="filter_date_range"
                                    type="daterange"
                                    @change="fetchItems()"
                                    :picker-options="pickerOptions"
                                    format="dd MMM, yyyy"
                                    value-format="yyyy-MM-dd"
                                    range-separator="-"
                                    start-placeholder="Start date"
                                    end-placeholder="End date">
                                </el-date-picker>
                            </div>
                        </div>
                    </div>
                </el-row>
            </el-col>
           
        </el-row>
        
        <div v-loading="loading" class="ff_table_wrap" element-loading-text="Loading Forms...">
            <template v-if="app.formsCount > 0">
                <el-table
                    :data="items"
                    :stripe="true"
                    @sort-change="handleTableSort"
                    @selection-change="handleSelectionChange"
                    :row-class-name="tableRowClass"
                    class="ff_table"
                >

                    <el-table-column sortable="custom" :label="$t('ID')" prop="id" width="60"></el-table-column>

                    <el-table-column sortable="custom" :label="$t('Title')" prop="title" width="480">
                        <template slot-scope="scope">
                            <strong>
                                {{ scope.row.title }}
                            </strong>
                            <span v-show="scope.row.has_payment == '1'" class="el-icon el-icon-money"></span>
                            <div class="row-actions row-actions-pipe">
                                <template v-if="hasPermission('fluentform_forms_manager')">
                                    <span class="row-actions-item ff_edit">
                                        <a :href="scope.row.edit_url"> {{ $t('Edit') }}</a>
                                    </span>
                                    <span class="row-actions-item ff_edit">
                                        <a :href="scope.row.settings_url"> {{ $t('Settings') }}</a>
                                    </span>
                                </template>
                                <span v-if="hasPermission('fluentform_entries_viewer')" class="row-actions-item ff_entries">
                                        <a :href="scope.row.entries_url"> {{ $t('Entries') }}</a>
                                </span>
                                <span v-if="scope.row.conversion_preview" class="row-actions-item ff_entries">
                                        <a target="_blank" :href="scope.row.conversion_preview"> {{ $t('Conversational Preview') }}</a>
                                </span>
                                <span class="row-actions-item ff_entries">
                                        <a target="_blank" :href="scope.row.preview_url"> {{ $t('Preview') }}</a>
                                </span>

                                <template v-if="hasPermission('fluentform_forms_manager')">
                                    <span class="row-actions-item ff_duplicate">
                                        <a href="#" @click.prevent="duplicateForm(scope.row.id)"> {{
                                            $t('Duplicate')
                                        }}</a>
                                    </span>
                                    <span class="row-actions-item trash">
                                        <remove @on-confirm="removeForm(scope.row.id, scope.$index)">
                                            <a slot="icon">{{ $t('Delete') }}</a>
                                        </remove>
                                    </span>
                                    <el-switch
                                        class="ff_switch"
                                        active-color="#00B27F" 
                                        :active-text="$t(scope.row.status === 'published' ? 'Active' : 'Inactive')"
                                        @change="toggleStatus(scope.row.id, scope.row.title, scope.row.status)" 
                                        :width="28"
                                        active-value="published" 
                                        inactive-value="unpublished" 
                                        v-model="scope.row.status" 
                                    />

                                </template>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column :label="$t('Short Code')" width="310">
                        <template slot-scope="scope">
                            <div class="shortcode_btn">
                                <code :id="`fluentform_${scope.row.id}`" :data-clipboard-text='`[fluentform id="${scope.row.id}"]`'>
                                    [fluentform id="{{ scope.row.id }}"]
                                </code>
                                <span class="copy copy_btn" :data-clipboard-target="`#fluentform_${scope.row.id}`">Copy</span>
                            </div>
                            <div class="shortcode_btn conversational_shortcode" v-if="scope.row.conversion_preview">
                                <code :id="`fluentform_conversational_${scope.row.id}`" :data-clipboard-text='`[fluentform type="conversational" id="${scope.row.id}"]`'>
                                    [fluentform type="conversational" id="{{scope.row.id }}"]
                                </code>
                                <span class="copy copy_btn" :data-clipboard-target="`#fluentform_conversational_${scope.row.id}`">Copy</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column :label="$t('Entries')">
                        <template slot-scope="scope">
                            <a :href="scope.row.entries_url"><span
                                v-show="scope.row.unread_count">{{ scope.row.unread_count }} / </span>{{
                                scope.row.total_Submissions
                                }}</a>
                        </template>
                    </el-table-column>

                    <el-table-column v-if="!isDisabledAnalytics" :label="$t('Views')">
                        <template slot-scope="scope">
                            {{ scope.row.total_views }}
                        </template>
                    </el-table-column>

                    <el-table-column v-if="!isDisabledAnalytics" :label="$t('Conversion')">
                        <template slot-scope="scope">
                            {{ scope.row.conversion }}%
                        </template>
                    </el-table-column>
                </el-table>
                <div class="ff_pagination_wrap text-right mt-4">
                    <el-pagination
                        class="ff_pagination"
                        background
                        @size-change="handleSizeChange"
                        @current-change="goToPage"
                        :current-page.sync="paginate.current_page"
                        :page-sizes="[5, 10, 20, 50, 100]"
                        :page-size="parseInt(paginate.per_page)"
                        layout="total, sizes, prev, pager, next"
                        :total="paginate.total">
                    </el-pagination>
                </div>
            </template>
            <div v-else>
                <div class="fluent_form_intro">
                    <h1 class="text-center">
                        {{ $t('Welcome to WP Fluent Froms') }}
                    </h1>
                    <p class="text-center">
                        {{ $t('Thank you for installing WP Fluent Froms - The Most Advanced Form Builder Plugin for WordPress') }}
                    </p>
                    <div class="text-center">
                        <el-button
                            round
                            type="primary"
                            @click="showAddFormModal = true"
                        >
                          {{$t('Click Here to Create Your First Form')}}
                        </el-button>
                    </div>
                </div>
                <div class="fluent_form_intro_video">
                    <h2>{{$t('Check the Video Intro')}}</h2>
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
            v-if="hasPermission('fluentform_forms_manager')"
            ref="predefinedFormsModal"
            v-show="showAddFormModal"
            :categories="categories"
            :predefinedForms="predefinedForms"
            :visibility.sync="showAddFormModal"
        />

        <PostTypeSelectionModal
            v-if="has_post_feature && hasPermission('fluentform_forms_manager')"
            @on-post-type-selction-end="onPostTypeSelctionEnd"
            :postTypeSelectionDialogVisibility="postTypeSelectionDialogVisibility"
        />
        
        <!-- <CreateNewFormModal
            :visibility.sync="showCreateNewFormModal"
        /> -->

    </div>
</template>

<script type="text/babel">
import Clipboard from 'clipboard';
import remove from '../components/confirmRemove'
import AddFormModal from '../components/modals/AddFormModal';
import predefinedFormsModal from '../components/modals/predefinedFormsModal';
import PostTypeSelectionModal from '../components/modals/PostTypeSelectionModal';
//import CreateNewFormModal from '../components/modals/CreateNewFormModal';
import moment from "moment";

export default {
    name: 'AllForms',
    components: {
        predefinedFormsModal,
        AddFormModal,
        remove,
        PostTypeSelectionModal,
        //CreateNewFormModal
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
            predefinedDropDownForms: false,
            categories: [],
            search_string: '',
            selectAll: 0,
            showAddFormModal: false,
            //showCreateNewFormModal: false,
            checkedItems: [],
            showSelectFormModal: false,
            advancedFilter: false,
            filter_date_range: ['', ''],
            pickerOptions: {
              disabledDate(time) {
                return time.getTime() >= Date.now();
              },
              shortcuts: [
                {
                  text: 'Today',
                  onClick(picker) {
                    const start = new Date();
                    picker.$emit('pick', [start, start]);
                  }
                },
                {
                  text: 'Yesterday',
                  onClick(picker) {
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 1);
                    picker.$emit('pick', [start, start]);
                  }
                },
                {
                  text: 'Last week',
                  onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                    picker.$emit('pick', [start, end]);
                  }
                }, {
                  text: 'Last month',
                  onClick(picker) {
                    const end = new Date();
                    const start = new Date();
                    start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                    picker.$emit('pick', [start, end]);
                  }
                }
              ]
            },
            filter_by:'all',
            form_statuses: {all: this.$t('All'), published: this.$t('Active'), unpublished: this.$t('Inactive'), is_payment: this.$t('Payment Form'), post: this.$t('Post Form'), conv_form: this.$t('Conversational Form'), step_form: this.$t('Step Form')},
            searchFormsKeyWord: '',
            clearingSearchKeyword: false,
            postTypeSelectionDialogVisibility: false,
            isDisabledAnalytics: !!window.FluentFormApp.isDisableAnalytics,
            sort_column: 'id',
            sort_by: 'DESC',
            radioOption: '',
            addNewFormURL: FluentFormApp.adminUrlWithoutPageHash + '?page=fluent_forms_add_new_form'
        }
    },
    methods: {
        toggleStatus(id,title,status){
            this.loading = true;
    
            let data = {
                action: 'fluentform-form-update',
                title: title,
                formId: id,
                status: status,
            };
    
            FluentFormsGlobal.$post(data)
                .then((response) => {
                    this.$success(response.message);
                })
                .fail(error => {
                    this.$fail(this.$t('Something went wrong, please try again.'));
                })
                .always(() => {
                    this.loading = false;
                });
        },
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
                filter_by: this.filter_by,
                per_page: this.paginate.per_page,
                page: this.paginate.current_page,
                sort_column: this.sort_column,
                sort_by: this.sort_by
            };
            if (this.advancedFilter) {
              data.date_range = this.filter_date_range;
            }
            FluentFormsGlobal.$get(data)
                .done((response) => {
                    this.items = response.data;
                    this.paginate.total = response.total;
                    this.paginate.current_page = response.current_page;
                    this.paginate.last_page = response.last_page;
                })
                .fail(error => {
                    this.$fail(this.$t('Something went wrong, please try again.'));
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
                this.$fail(this.$t('Something went wrong, please try again.'));
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
                    this.$success(res.message);
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
                    this.$success(res.message);
                    if (res.redirect) {
                        window.location.href = res.redirect;
                    } else {
                        alert(this.$t('Something is wrong! Please try again'));
                    }
                })
                .fail(error => {
                    alert(this.$t('Something is wrong! Please try again'));
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
        },
        resetAdvancedFilter() {
          this.advancedFilter = false;
          this.fetchItems();
        },
        filterFormType() {
          this.search_string = '';
          this.setDefaultPaginate();
          this.fetchItems();
        },
        setDefaultPaginate() {
          this.paginate = {
            total: 0,
            current_page: 1,
            last_page: 1,
            per_page: localStorage.getItem('formItemsPerPage') || 10
          }
        },
        tableRowClass({row}) {
            return row.status == 'unpublished' ? 'inactive_form' : '';
        }
    },
    mounted() {
        this.fetchItems();
        this.getPredefinedForms();
        this.filter_date_range = [moment().format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')];

        (new Clipboard('.copy')).on('success', event => {
            this.$copy();
            // event.clearSelection();
            // this.$message({
            //     message: this.$t('Copied to Clipboard!'),
            //     type: 'success'
            // });
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
<style scoped>
.el-dropdown-menu{
  z-index: 9999 !important;
}
</style>


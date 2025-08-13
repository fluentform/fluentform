<template>
    <div class="ff_partial_entries_wrap">
        <section-head size="sm">
            <h1 class="ff_section_title">{{$t('Partial Entries')}}</h1>
        </section-head>

        <div class="separator mb-4"></div>

        <div v-loading="loading" :element-loading-text="$t('Loading Entries...')" style="min-height: 60px;" class="entries_table">
            <section-head size="sm" class="ff_section_head_between items-center">
                <SectionHeadContent>
                    <btn-group as="div" v-if="entrySelections.length">
                        <btn-group-item as="div">
                            <label for="bulk-action-selector-top" class="screen-reader-text">
                                {{ $t('Select bulk action') }}
                            </label>
                            <el-select
                                clearable
                                :placeholder="$t('Bulk Actions')"
                                id="bulk-action-selector-top"
                                name="action"
                                popper-class="el-big-items"
                                v-model="bulkAction"
                                class="ff-input-s1"
                            >
                                <el-option-group
                                    v-for="(group,groupKey) in bulkActions"
                                    :key="groupKey"
                                    :label="groupKey">
                                    <el-option
                                        v-for="item in group"
                                        :key="item.action"
                                        :label="item.label"
                                        :value="item.action">
                                    </el-option>
                                </el-option-group>
                            </el-select>
                        </btn-group-item>
                        <btn-group-item as="div">
                            <el-button
                                class="mr-2"
                                type="primary"
                                @click.prevent="handleBulkAction"
                            >{{ $t('Apply') }}
                            </el-button>
                        </btn-group-item>
                    </btn-group>
                </SectionHeadContent>
                <SectionHeadContent>
                    <div class="ff_partial-entries_action_wrap ff_row">
                        <div class="partial_entries_search_wrap">
                            <label for="search_bar" class="screen-reader-text">
                                {{ $t('Search Entry') }}
                            </label>
                            <el-input
                                @keyup.enter.native="handleSearch"
                                :placeholder="$t('Search')"
                                v-model="search_string"
                                prefix-icon="el-icon-search"
                            >
                            </el-input>
                        </div>
                        <el-dropdown @command="exportEntries" trigger="click">
                            <el-button>
                                {{$t('Export')}} <i class="el-icon-arrow-down el-icon--right"></i>
                            </el-button>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item command="csv">{{ $t('Export as') }} CSV</el-dropdown-item>
                                <el-dropdown-item command="xlsx">{{ $t('Export as') }} Excel (xlsx)</el-dropdown-item>
                                <el-dropdown-item command="ods">{{ $t('Export as') }} ODS</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </SectionHeadContent>
            </section-head>
            <div class="ff-table-container">
                <el-table
                    :data="entries"
                    :stripe="true"
                    :size="isCompact? 'mini':''"
                    :class="{'compact': isCompact}"
                    @sort-change="handleTableSort"
                    @selection-change="handleSelectionChange"
                >

                    <el-table-column
                        type="selection"
                        fixed
                        width="40">
                    </el-table-column>

                    <el-table-column
                        label="ID"
                        sortable="custom"
                        prop="id"
                        width="90px"
                    >
                        <template slot-scope="scope">
                            <div class="has_hover_item">
                                <router-link :to="{
                                        name: 'form-entry',
                                        params: {
                                            form_id: scope.row.form_id,
                                            entry_id: scope.row.id
                                        },
                                        query: {
                                            sort_by: sort_by,
                                            current_page: paginate.current_page,
                                            pos: scope.$index,
                                            type: entry_type
                                        }
                                    }">
                                    {{ scope.row.id }}
                                </router-link>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column width="160" :label="$t('Step Completed')" prop="step_completed">

                    </el-table-column>

                    <el-table-column
                        v-for="(column, column_name) in columns"
                        :label="column"
                        :show-overflow-tooltip="isCompact"
                        min-width="200"
                        :key="column_name">
                        <template slot-scope="scope">
                            <span v-html="scope.row.user_inputs[column_name]"></span>
                        </template>
                    </el-table-column>

                    <el-table-column
                        label="Submitted at"
                        width="120px">
                        <template slot-scope="scope">
                            {{ dateFormat(scope.row.created_at) }}
                        </template>
                    </el-table-column>
                    <el-table-column
                        fixed="right"
                        label="Actions"
                        :width="115"
                        align="center"
                    >
                        <template slot-scope="scope">
                            <btn-group size="sm">
                                <btn-group-item>
                                    <router-link :to="{
                                        name: 'form-entry', 
                                        params: { 
                                            form_id: scope.row.form_id, 
                                            entry_id: scope.row.id
                                        },
                                        query: {
                                            sort_by: sort_by,
                                            current_page: paginate.current_page,
                                            pos: scope.$index,
                                            type: entry_type
                                        }
                                    }">
                                        <span class="el-button el-button--primary el-button--mini el-button--icon">
                                            <i class="ff-icon ff-icon-eye-filled"></i>
                                        </span>
                                    </router-link>
                                </btn-group-item>
                                <btn-group-item>
                                    <remove @on-confirm="removeEntry(scope.row.id)">
                                        <el-button
                                            class="el-button--icon"
                                            size="mini"
                                            type="danger"
                                            icon="ff-icon ff-icon-trash"
                                        />
                                    </remove>
                                </btn-group-item>
                            </btn-group>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
                <el-row class="mt-4 items-center">
                    <el-col :span="12">
                        <el-checkbox class="compact_input" v-model="isCompact" @change="handleCompactView">{{ $t('Compact View') }}</el-checkbox>
                    </el-col>
                    <el-col :span="12">
                        <div class="ff_pagination_wrap text-right">
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
                    </el-col>
                </el-row>
        </div>
    </div>
</template>

<script type="text/babel">
    import moment from 'moment';
    import remove from '@fluentform/admin/components/confirmRemove';
    import BtnGroup from '@fluentform/admin/components/BtnGroup/BtnGroup.vue';
    import BtnGroupItem from '@fluentform/admin/components/BtnGroup/BtnGroupItem.vue';
    import SectionHead from '@fluentform/admin/components/SectionHead/SectionHead.vue';
    import SectionHeadContent from '@fluentform/admin/components/SectionHead/SectionHeadContent.vue';

    export default {
        name: 'StepFormEntries',
        props: ['form_id'],
        components: {
            remove,
            BtnGroup,
            BtnGroupItem,
            SectionHead,
            SectionHeadContent
        },
        watch: {
            search_string() {
                if (!this.search_string.length) {
                    this.getEntries();
                }
            }
        },
        data() {
            return {
                loading: true,
                entry_type: this.$route.query.type || '',
                sort_by: this.$route.query.sort_by || "DESC",
                entries: [],
                entrySelections: [],
                bulkAction:'',
                columns: [],
                paginate: {
                    total: 0,
                    current_page: parseInt(this.$route.query.page) || 1,
                    last_page: 1,
                    per_page: localStorage.getItem('entriesPerPage') || 20
                },
                search_string: '',
                current_form_title: window.fluentform_step_form_entry_vars.current_form_title,
                count: {},
                no_found_text: window.fluentform_step_form_entry_vars.no_found_text,
                isCompact: true,
            }
        },
        computed: {
          bulkActions() {
            let bulk_actions = {
              'Actions': [{
                label: 'Delete Permanently',
                action: 'delete_permanently'
              }],
            };
            return bulk_actions;
          },
        },
        methods: {
            setDefaultPaginate() {
                this.paginate = {
                    total: 0,
                    current_page: 1,
                    last_page: 1,
                    per_page: localStorage.getItem('entriesPerPage') || 5
                }
            },
            getCountOfEntries() {
                let data = {
                    action: 'fluentform-step-form-entry-count',
                    form_id: this.form_id
                };
                FluentFormsGlobal.$get(data)
                    .then((response) => {
                        this.count = response.data.count;
                    })
                    .fail((error) => {

                    });
            },
            getEntries() {
                let data = {
                    action: 'fluentform-step-form-entries',
                    form_id: this.form_id,
                    entry_type: this.entry_type,
                    current_page: this.paginate.current_page,
                    per_page: this.paginate.per_page,
                    search: this.search_string,
                    sort_by: this.sort_by
                };

                this.loading = true;

                FluentFormsGlobal.$get(data)
                    .then((response) => {
                        this.entries = response.data.submissions.data;
                        this.paginate = response.data.submissions.paginate;
                        this.columns = response.data.labels;
                        this.resetUrlParams();
                    })
                    .fail((error) => {

                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            handleTableSort(column) {
                if (column.order) {
                    if (column.prop === 'id') {
                        this.sort_by = (column.order === 'ascending') ? 'ASC' : 'DESC';
                        this.getEntries();
                    }
                }
            },
            handleSelectionChange(val) {
                this.entrySelections = val;
            },
            handleBulkAction() {
              if (this.bulkAction) {
                let actionType = this.bulkAction;
                this.operationOnSelectedEntries(actionType);
              }
            },

            operationOnSelectedEntries(actionType) {
                let selectedEntries = [];

                this.entrySelections.forEach(function (element) {
                    selectedEntries.push(element.id);
                });

                let data = {
                    action: 'fluentform-do_step_form_entry_bulk_actions',
                    form_id: this.form_id,
                    entries: selectedEntries,
                    action_type: actionType
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.$notify.success({
                            title: 'Success',
                            message: response.data.message,
                            offset: 30
                        });
                        this.getEntries();
                        this.getCountOfEntries();
                    })
                    .fail(error => {
                        this.$notify.error({
                            title: 'Error',
                            message: error.responseJSON.data.message,
                            offset: 30
                        });
                        console.log(error);
                    });

            },
            removeEntry(entryId) {
                let data = {
                    action: 'fluentform-step-form-delete-entry',
                    form_id: this.form_id,
                    entry_id: entryId,
                    status: 'trashed'
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.$notify({
                            title: 'Success',
                            message: response.data.message,
                            type: 'success',
                            offset: 30
                        });
                        this.getEntries();
                        this.getCountOfEntries();
                    })
                    .fail(error => {
                        console.log(error);
                    });
            },
            goToPage(value) {
                this.paginate.current_page = value;
                this.getEntries();
            },
            handleSizeChange(val) {
                this.paginate.per_page = val;
                localStorage.setItem('entriesPerPage', val);
                this.getEntries();
            },
            handleSearch() {
                this.setDefaultPaginate();
                this.getEntries();
            },
            resetUrlParams() {
                this.$router.push({
                    name: 'form-entries',
                    params: {
                        form_id: this.form_id
                    },
                    query: {
                        sort_by: this.sort_by,
                        type: this.entry_type,
                        page: this.paginate.current_page,
                        t: new Date().getTime()
                    }
                });
            },
            handleSwitchForm(formId) {
                window.location.href = window.fluentform_step_form_entry_vars.entries_url_base + formId;
            },
            exportEntries(format = 'csv') {
                let data = {
                    action: 'fluentform-step-form-entries-export',
                    form_id: this.form_id,
                    format: format,
                    entry_type: this.entry_type,
                    sort_by: this.sort_by,
                    search: this.search_string,
                    fluent_forms_admin_nonce: window.fluent_forms_global_var.fluent_forms_admin_nonce
                };
                
                let url = ajaxurl + '?' + jQuery.param(data);
                location.href = url;
            },
            dateFormat(date, format) {
                if (!format) {
                    format = 'MMM DD, YYYY';
                }
                let dateString = (date === undefined) ? null : date;
                let dateObj = moment(dateString);
                return dateObj.isValid() ? dateObj.format(format) : null;
            },
            handleCompactView() {
                localStorage.setItem('compactStepView', this.isCompact);
            },
        },
        mounted() {
            this.getEntries();
            this.getCountOfEntries();
            this.isCompact = localStorage.getItem('compactStepView') === 'true' ? true : false;
        },
        beforeCreate() {
            jQuery('title').text('Partial Entries - Fluent Forms');
        }
    };
</script>

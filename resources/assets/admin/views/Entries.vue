<template>
    <div>
        <div class="ff_nav_top">
            <div class="ff_nav_title">
                <h3>{{$t('Entries')}}</h3>
                
                <div class="ff_nav_sub_actions">
                    <el-select
                            clearable
                            size="mini"
                            v-model="entry_type"
                            :placeholder="$t('All Types')"
                            @change="filterEntryType()"
                    >
                        <el-option
                                v-for="(status, status_key) in entry_statuses"
                                :key="status_key"
                                :value="status_key"
                                :label="status"
                        >
                            {{status}} <span v-show="counts[status_key]">({{counts[status_key]}})</span>
                        </el-option>
                    </el-select>
                    <el-select
                            v-if="has_payment"
                            style="min-width: 300px"
                            clearable
                            size="mini"
                            multiple
                            v-model="selectedPaymentStatuses"
                            :placeholder="$t('All Payments')"
                            @change="filterPaymentStatuses()"
                    >
                        <el-option
                                v-for="(status, status_key) in payment_statuses"
                                :key="status_key"
                                :value="status_key"
                                :label="status"
                        >
                            {{status}}
                        </el-option>
                    </el-select>
                </div>
            </div>
            <div class="ff_nav_action">

                <el-button @click="gotoVisualReport()" type="primary" size="mini">
                    <span
                            style="line-height: 10px;width: auto;height: auto;font-size: 14px;"
                            class="dashicons dashicons-chart-pie"
                    ></span> {{ $t('View Visual Report') }}
                </el-button>

                <el-dropdown
                        size="mini"
                        @command="handleSwitchForm"
                        split-button type="default"
                        class="current_form_name"
                >
                  <span class="el-dropdown-link">
                    {{ current_form_title }}
                  </span>
                    <el-dropdown-menu slot="dropdown" style="max-height:300px; overflow-y:scroll;">
                        <el-dropdown-item
                                v-for="form in forms"
                                :key="'form_switch_'+form.id"
                                :command="form.id"
                                :disabled="form.id == form_id"
                        >{{ form.title }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>


                <el-dropdown

                        size="mini"
                        split-button type="default"
                        class="current_form_name"
                        :hide-on-click="false"
                >

                  <span class="el-dropdown-link">
                        {{$t('Columns')}}
                  </span>
                    <el-dropdown-menu slot="dropdown" style="max-height:300px; overflow-y:scroll;" >

                        <el-dropdown-item
                                v-for="(column, column_name) in columns"
                                :key="column_name"

                        >
                            <el-checkbox @change="handleColumnChange" :key="column" :label="column_name"  v-model="visibleColumns" >
                                {{ column }}
                            </el-checkbox>

                        </el-dropdown-item>

                        <el-dropdown-item
                                key="column_order"
                                command="column_order"
                        >
                            <el-button @click="visibleColReorderModal =true" style="width:100%;"  type="primary" size="mini">
                                 {{ $t('Reorder Column') }}
                            </el-button>

                        </el-dropdown-item>

                    </el-dropdown-menu>
                </el-dropdown>

            </div>
        </div>

        <el-dialog   :visible.sync="visibleColReorderModal" :title=" $t('Change Column Display Order') " >
            <ColumnDragAndDrop
                    :columns="columns"
                    :columns_order ="columnsOrder"
                    :form_id="form_id"
                    :visible_columns="visibleColumns" 
                    @save="refreshColumnsOrder"        
            />
        </el-dialog>

        <el-alert
                v-if="autoDeleteStatus"
                :title="$t('Auto delete entry on form submission is enabled! No new entry data will be saved for this form.')"
                :description="$t('You can disable the auto delete option from Settings & Integrations Tab')"
                type="error">
        </el-alert>

        <hr>
        <div v-loading="loading"
             :element-loading-text="$t('Loading Entries...')"
             style="min-height: 60px;"
             class="entries_table">

            <div class="ff_nav_top">
                <div class="ff_nav_title">
                    <template v-if="entrySelections.length">
                        <label for="bulk-action-selector-top" class="screen-reader-text">
                            {{ $t('Select bulk action') }}
                        </label>
                        <el-select
                                clearable
                                placeholder="Bulk Actions"
                                id="bulk-action-selector-top"
                                name="action"
                                popper-class="el-big-items"
                                v-model="bulkAction"
                                size="small"
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
                        <el-button
                                type="primary"
                                size="small"
                                @click.prevent="handleBulkAction"
                        >{{ $t('Apply') }}
                        </el-button>
                    </template>
                </div>

                <div class="ff_nav_action pull-right">
                    <div class="ff_search_inline">
                        <label for="search_bar" class="screen-reader-text">
                            {{ $t('Search Entry') }}
                        </label>
                        <el-input
                                v-on:keyup.enter.native="handleSearch"
                                size="mini"
                                :placeholder="$t('Search')"
                                v-model="search_string"
                        >
                            <el-button
                                    slot="append"
                                    icon="el-icon-search"
                                    v-on:click.prevent="handleSearch"
                            />
                        </el-input>
                    </div>

                    <el-dropdown @command="exportEntries">
                        <el-button type="info" size="mini">
                            {{$t('Export')}} <i class="el-icon-arrow-down el-icon--right"></i>
                        </el-button>
                        <el-dropdown-menu slot="dropdown">
                            <el-dropdown-item command="csv">{{ $t('Export as') }} CSV</el-dropdown-item>
                            <el-dropdown-item command="xlsx">{{ $t('Export as') }} Excel (xlsv)</el-dropdown-item>
                            <el-dropdown-item command="ods">{{ $t('Export as') }} ODS</el-dropdown-item>
                            <el-dropdown-item command="json">{{ $t('Export as') }} JSON Data</el-dropdown-item>
                        </el-dropdown-menu>
                    </el-dropdown>
                    <el-button @click="advancedFilter = true" size="mini">{{$t('Advanced Filter')}}</el-button>
                </div>
            </div>

            <div v-if="advancedFilter" class="ff_nav_top ff_advanced_search">
                <div class="widget_title">
                    {{$t('Filter By Date Range')}}
                    <el-date-picker
                            size="mini"
                            v-model="filter_date_range"
                            type="daterange"
                            @change="getData()"
                            :picker-options="pickerOptions"
                            format="dd MMM, yyyy"
                            value-format="yyyy-MM-dd"
                            range-separator="-"
                            :start-placeholder="$t('Start date')"
                            :end-placeholder="$t('End date')">
                    </el-date-picker>
                    <el-button @click="getData" size="mini" type="primary">{{ $t('Search') }}</el-button>
                    <el-button @click="resetAdvancedFilter()" size="mini">{{ $t('Hide') }}</el-button>
                </div>
            </div>

            <el-table
                    :data="entries"
                    :stripe="true"
                    :class="{'compact': isCompact}"
                    @sort-change="handleTableSort"
                    @selection-change="handleSelectionChange">

                <el-table-column
                        type="selection"
                        fixed
                        width="40">
                </el-table-column>

                <el-table-column
                        label="#"
                        sortable="custom"
                        prop="id"
                        width="100px"
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
                                {{ scope.row.serial_number }}
                            </router-link>
                            <div v-if="scope.row.status != 'trashed'" class="show_on_hover inline_actions">
                                <span v-if="scope.row.is_favourite != '0'"
                                    @click="changeFavorite(scope.row.id, scope.$index, 0)"
                                    :title="$t('Remove from Favorites')" 
                                    class="el-icon-star-on action_button"
                                />
                                <span v-else 
                                    @click="changeFavorite(scope.row.id, scope.$index, 1)"
                                    :title="$t('Mark as Favorites')"
                                    class="el-icon-star-off action_button"
                                />

                                <span v-if="scope.row.status == 'read'" 
                                    @click="changeStatus(scope.row.id, scope.$index, 'unread')"
                                    :title="$t('Mark as Unread')"
                                    class="el-icon-circle-check action_button"
                                />
                                <span v-else 
                                    @click="changeStatus(scope.row.id, scope.$index, 'read')" 
                                    :title="$t('Mark as Read')"
                                    class="el-icon-finished action_button"
                                />
                            </div>

                            <div class="inline_actions inline_item" v-else>
                                    <span @click="restoreEntry(scope.row.id, scope.$index)" title="Restore"
                                          class="el-icon-circle-check action_button">{{ $t(' Restore') }}</span>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column
                        v-for="(column, index) in formattedColumn"

                        :label="column.label"
                        :show-overflow-tooltip="isCompact"
                        min-width="200"
                        :key="index">
                    <template slot-scope="scope">
                        <span v-html="scope.row.user_inputs[column.field]"></span>
                    </template>
                </el-table-column>

                <el-table-column
                        label="Entry Status"
                        width="120px">
                    <template slot-scope="scope">
                        {{ getStatusName(scope.row.status) }}
                    </template>
                </el-table-column>

                <template v-if="has_payment">
                    <el-table-column
                            :label="$t('Amount')"
                            min-width="120px">
                        <template slot-scope="scope">
                            <span v-html="formatMoney(scope.row.payment_total, scope.row.currency)"></span>
                        </template>
                    </el-table-column>
                    <el-table-column
                            :label="$t('Payment Status')"
                            min-width="120px">
                        <template slot-scope="scope">
                            <span class="ff_pay_status_badge" 
                                  :class="'ff_pay_status_'+scope.row.payment_status"
                                  v-if="scope.row.payment_status"
                            >
                                {{ scope.row.payment_status }}
                            </span>
                        </template>
                    </el-table-column>
                    <el-table-column
                            :label="$t('Payment Method')"
                            min-width="120px">
                        <template slot-scope="scope">
                            <span class="ff_card_badge" v-if="scope.row.payment_method">
                                {{ getPaymentMethodName(scope.row.payment_method) }}
                            </span>
                        </template>
                    </el-table-column>
                </template>

                <el-table-column
                        :label="$t('Submitted at')"
                        width="120px">
                    <template slot-scope="scope">
                        {{ dateFormat(scope.row.created_at) }}
                    </template>
                </el-table-column>

                <el-table-column
                        fixed="right"
                        :label="$t('Actions')"
                        :width="115"
                        align="center"
                >
                    <template slot-scope="scope">
                        <el-button-group>
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
                                <el-button type="primary" icon="el-icon-view" size="mini"></el-button>
                            </router-link>
                            
                            <remove 
                                v-if="hasPermission('fluentform_manage_entries')"
                                icon="el-icon-delete" 
                                @on-confirm="removeEntry(scope.row.id, scope.$index)"
                            />
                        </el-button-group>
                    </template>
                </el-table-column>
            </el-table>

            <div class="tablenav bottom">
                <div class="alignleft actions bulkactions">
                    <email-resend v-if="entrySelections.length" :btn_text="$t('Bulk Resend Notifications')" :entry_ids="selection_ids" :form_id="form_id"></email-resend>
                    <el-checkbox class="compact_input" v-model="isCompact">{{ $t('Compact View') }}</el-checkbox>
                </div>
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

<script type="text/babel">
    import remove from '../components/confirmRemove'
    import moment from 'moment';
    import each from 'lodash/each';
    import EmailResend from './Helpers/_ResentEmailNotification'
    import ColumnDragAndDrop from "./ColumnDragAndDrop";

    export default {
        name: 'FormEntries',
        props: ['form_id', 'has_pdf'],
        components: {
            remove,
            EmailResend,
            ColumnDragAndDrop
        },
        watch: {
            search_string() {
                if (!this.search_string.length) {
                    this.getData();
                }
            }
        },
        data() {
            return {
                loading: true,
                entry_type: this.$route.query.type || '',
                sort_by: this.$route.query.sort_by || "DESC",
                selectedPaymentStatuses: [],
                entries: [],
                entrySelections: [],
                columns: [],
                bulkAction: '',
                paginate: {
                    total: 0,
                    current_page: parseInt(this.$route.query.page) || 1,
                    last_page: 1,
                    per_page: localStorage.getItem('entriesPerPage') || 20
                },
                search_string: '',
                forms: window.fluent_form_entries_vars.forms,
                current_form_title: window.fluent_form_entries_vars.current_form_title,
                counts: {},
                no_found_text: window.fluent_form_entries_vars.no_found_text,
                entry_statuses: window.fluent_form_entries_vars.entry_statuses,
                payment_statuses: window.fluent_form_entries_vars.payment_statuses,
                has_payment: !!window.fluent_form_entries_vars.has_payment,
                isCompact: true,
                advancedFilter: false,
                filter_date_range: ['', ''],
                autoDeleteStatus: window.fluent_form_entries_vars.enabled_auto_delete,
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
                show_favorites: 'no',
                available_pdf: null,
                pdf_dropdown: null,
                visibleColReorderModal: false,
                visibleColumns: null,
                columnsOrder: null,
            }
        },
        computed: {
            /**
             * Compute bulk action options
             * @return {Array}
             */
            bulkActions() {
                let bulk_actions = {
                    'statuses': [],
                    'other': [
                        {
                            label: this.$t('Mark as Favorites'),
                            action: 'other.make_favorite'
                        },
                        {
                            label: this.$t('Remove from Favorites'),
                            action: 'other.unmark_favorite'
                        }
                    ]
                };

                if (this.hasPermission('fluentform_manage_entries')) {
                    bulk_actions['other'].push(
                        {
                            label: this.$t('Delete Permanently'),
                            action: 'other.delete_permanently'
                        }
                    );
                }

                each(this.entry_statuses, (status_name, status_key) => {
                    if (this.entry_type != status_key && status_key != 'favorites') {
                        bulk_actions.statuses.push({
                            label: 'Mark as ' + status_name,
                            action: status_key
                        });
                    }
                });

                return bulk_actions;
            },
            /**
             * Compute selected entry IDs
             * @return {Array}
             */
            selection_ids() {
                let selectedEntries = [];

                this.entrySelections.forEach(function (element) {
                    selectedEntries.push(element.id);
                });
                return selectedEntries;
            },

            /**
             * Compute columns order
             * @return {Array}
             */
            formattedColumn() {
                let columnsOrder = [];

                if (this.columnsOrder) {
                    each(this.columnsOrder, (column) => {
                        columnsOrder.push({
                            field: column.value,
                            label: this.columns[column.value],
                        });
                    })
                } else {
                    each(this.columns, (label, field) => {
                        columnsOrder.push({field, label});
                    })
                }

                if (this.visibleColumns) {
                    columnsOrder = columnsOrder.filter(column => this.visibleColumns.includes(column.field));
                }

                return columnsOrder;
            }
        },
        methods: {
            getStatusName(status) {
                if (this.entry_statuses[status]) {
                    return this.entry_statuses[status];
                }
                return status;
            },
            setPaginate(data = {}) {
                this.paginate = {
                    total: data.total || 0,
                    current_page: data.current_page || 1,
                    last_page: data.last_page || 1,
                    per_page: data.per_page || localStorage.getItem('entriesPerPage') || 20
                }
            },
            getEntryResources() {
                let data = {
                    form_id: this.form_id,
                    counts: true,
                    labels: true,
                    visibleColumns: true,
                    columnsOrder: true,
                };
                
                const url = FluentFormsGlobal.$rest.route('getSubmissionsResources');

                FluentFormsGlobal.$rest.get(url, data)
                    .then((response) => {
                        this.counts = response.counts;
                        this.columns = response.labels;

                        this.visibleColumns = response.visibleColumns ;
                        this.columnsOrder = response.columnsOrder ;
                    })
                    .catch((error) => {

                    })
                    .finally(() => {
                        this.getData();
                    });
            },
            getData() {
                let data = {
                    form_id: this.form_id,
                    entry_type: this.entry_type,
                    page: this.paginate.current_page,
                    per_page: this.paginate.per_page,
                    search: this.search_string,
                    sort_by: this.sort_by,
                    payment_statuses: this.selectedPaymentStatuses,
                    parse_entry: true,
                };

                if (this.advancedFilter) {
                    data.date_range = this.filter_date_range;
                }

                this.loading = true;
                
                const url = FluentFormsGlobal.$rest.route('getSubmissions');

                FluentFormsGlobal.$rest.get(url, data)
                    .then((response) => {
                        this.entries = response.data;
                        this.setPaginate(response);
                        this.resetUrlParams();
                    })
                    .catch((error) => {

                    })
                    .finally(() => {
                        this.getVisibleColumns();
                        this.loading = false;
                    });
            },
            handleTableSort(column) {
                if (column.order) {
                    if (column.prop === 'id') {
                        this.sort_by = (column.order === 'ascending') ? 'ASC' : 'DESC';
                        this.getData();
                    }
                }
            },
            handleSelectionChange(val) {
                this.entrySelections = val;
            },
            removeEntry(entryId, index) {
                let action = 'post';
                let route = 'updateSubmissionStatus';

                if (this.entry_type === 'trashed') {
                    action = 'delete';
                    route = 'deleteSubmission';
                }

                const url = FluentFormsGlobal.$rest.route(route, entryId);

                const data = {
                    status: 'trashed'
                };

                FluentFormsGlobal.$rest[action](url, data)
                    .then(response => {
                        const statusToBeDecreased = this.entries[index].status;
                        this.counts[statusToBeDecreased] -= 1;

                        this.counts.trashed += 1;

                        this.entries.splice(index, 1);

                        this.$success(response.message);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            },
            handleBulkAction() {
                if (this.bulkAction) {
                    this.operationOnSelectedEntries(this.bulkAction);
                }
            },
            operationOnSelectedEntries(actionType) {
                let data = {
                    form_id: this.form_id,
                    entries: this.selection_ids,
                    action_type: actionType
                };

                const url = FluentFormsGlobal.$rest.route('handleSubmissionsBulkActions');

                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        this.$success(response.message);
                        this.getEntryResources();
                    })
                    .catch(error => {
                        this.$fail(error.message);
                        console.log(error);
                    });

            },
            goToPage(value) {
                this.paginate.current_page = value;
                this.getData();
            },
            handleSizeChange(val) {
                this.paginate.per_page = val;
                localStorage.setItem('entriesPerPage', val);
                this.getData();
            },
            filterEntryType() {
                this.bulkAction = '';
                this.search_string = '';
                this.setPaginate();
                this.getData();
            },
            filterPaymentStatuses() {
                this.bulkAction = '';
                this.search_string = '';
                this.setPaginate();
                this.getData();
            },
            handleSearch() {
                this.setPaginate();
                this.getData();
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
                        page: this.paginate.current_page
                    }
                })
                .catch(failure => {

                });
            },
            changeFavorite(entryId, index, is_favourite) {
                let data = {
                    is_favourite
                };

                const url = FluentFormsGlobal.$rest.route('toggleSubmissionIsFavorite', entryId)

                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        this.entries[index].is_favourite = response.is_favourite;
                        
                        const amount = is_favourite ? 1 : -1;
                        this.counts.favorites += amount;

                        if (this.entry_type === 'favorites') {
                            this.entries.splice(index, 1);
                        }

                        this.$success(response.message);
                    })
                    .catch(error => {
                        console.log(error);
                    });
            },
            changeStatus(entryId, index, status) {
                let data = {
                    status
                };

                const url = FluentFormsGlobal.$rest.route('updateSubmissionStatus', entryId);

                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        this.counts[status] += 1;
                        
                        const statusToBeDecreased = this.entries[index].status;
                        this.counts[statusToBeDecreased] -= 1;

                        this.entries[index].status = response.status;
                    })
                    .catch(error => {
                        console.log(error);
                    });
            },
            restoreEntry(entryId, index) {
                let data = {
                    status: 'read'
                };

                const url = FluentFormsGlobal.$rest.route('updateSubmissionStatus', entryId);

                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                        this.counts.trashed -= 1;
                        this.counts.read += 1;
                        this.entries.splice(index, 1);

                        this.$success(this.$t('The Entry has been restored'));
                    })
                    .catch(error => {
                        console.log(error);
                    });
            },
            handleSwitchForm(formId) {
                window.location.href = window.fluent_form_entries_vars.entries_url_base + formId;
            },
            exportEntries(format = 'csv') {

                let selectedEntries = [];

                this.entrySelections.forEach(function (element) {
                    selectedEntries.push(element.id);
                });

                let data = {
                    action: 'fluentform-form-entries-export',
                    form_id: this.form_id,
                    format: format,
                    entry_type: this.entry_type,
                    entries: selectedEntries,
                    sort_by: this.sort_by,
                    search: this.search_string,
                    payment_statuses: this.selectedPaymentStatuses,
                    fluent_forms_admin_nonce: window.fluent_forms_global_var.fluent_forms_admin_nonce
                };
                if (this.advancedFilter) {
                    data.date_range = this.filter_date_range;
                    data.is_favourite = this.show_favorites;
                }
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
            resetAdvancedFilter() {
                this.advancedFilter = false;
                this.getData();
            },
            gotoVisualReport() {
                this.$router.push({
                    name: 'form-reports'
                });
            },
            getPaymentMethodName(status) {
                if(status == 'test') {
                    return 'Offline';
                }
                return status;
            },
            handleColumnChange(){
                const data = {
                    meta_key: '_visible_columns',
                    settings: JSON.stringify(this.visibleColumns)
                };

                const url = FluentFormsGlobal.$rest.route('storeEntryColumns', this.form_id);
                
                FluentFormsGlobal.$rest.post(url, data)
                    .then(response => {
                    })
                    .catch(error => {
                        console.log(error);
                    });
            },
            getVisibleColumns() {
                if (this.visibleColumns === null){
                    //visibleColumns is not set initially so set all columns to visible
                    this.visibleColumns = Object.keys(this.columns);
                }
            },
            refreshColumnsOrder(columnsOrder) {
                this.columnsOrder = columnsOrder ? [...columnsOrder] : null;
                this.visibleColReorderModal = false;
            }
        },
        mounted() {
            this.getEntryResources();
            this.filter_date_range = [moment().format('YYYY-MM-DD'), moment().format('YYYY-MM-DD')];
            (new ClipboardJS('.copy')).on('success', (e) => {
                this.$copy();
            });
        },
        beforeCreate() {
            ffEntriesEvents.$emit('change-title', 'All Entries');
        }
    };
</script>


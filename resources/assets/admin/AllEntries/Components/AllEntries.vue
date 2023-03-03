<template>
    <div v-loading="loading" class="payments_wrapper">
        <div class="payment_header">
            <div class="payment_title">{{ $t('All Form Entries') }}</div>
            <div class="payment_actions">
                <el-button @click="toggleChart" type="info" size="mini">
                    <span v-if="chart_status == 'yes'">{{ $t('Hide Chart') }}</span>
                    <span v-else>{{ $t('Show Chart') }}</span>
                </el-button>

                <el-button
                    @click="advancedFilter = !advancedFilter"
                    size="mini">
                    {{ $t('Advanced Filter') }}
                </el-button>

            </div>
        </div>
        <div v-if="chart_status == 'yes'" class="entry_chart">
            <entry-chart :form_id="selectedFormId" :date_range="filter_date_range"></entry-chart>
        </div>

        <div class="payment_details">
            <div style="margin-bottom: 20px" class="payment_header">

                <div class="ff_filter_wrapper">

                    <div class="ff_form_group ff_inline">
                        {{ $t('Form') }}
                        <el-select @change="fetchEntries" style="max-height:10px;"
                                   size="mini"
                                   clearable
                                   filterable
                                   v-model="selectedFormId"
                                   :placeholder="$t('Select Form')">
                            <el-option
                                v-for="item in available_forms"
                                :key="item.id"
                                :label="item.title"
                                :value="item.id">
                            </el-option>
                        </el-select>
                    </div>

                    <div class="ff_form_group ff_inline">
                        <el-radio-group @change="fetchEntries('reset')" size="small" v-model="entry_status">
                            <el-radio-button label="">{{ $t('All') }}</el-radio-button>
                            <el-radio-button label="unread">{{ $t('Unread Only') }}</el-radio-button>
                            <el-radio-button label="read">{{ $t('Read Only') }}</el-radio-button>
                        </el-radio-group>
                    </div>

                    <div class="payment_actions">
                        <el-input @keyup.enter.native="fetchEntries"
                                  size="small"
                                  :placeholder="$t('Search')"
                                  v-model="search">
                            <el-button
                                @click="fetchEntries"
                                slot="append"
                                icon="el-icon-search">
                            </el-button>
                        </el-input>
                    </div>
                </div>

                <div v-if="advancedFilter" class="ff_nav_top ff_advanced_search">
                    <div class="widget_title">
                        {{ $t('Filter By Date Range') }}
                        <el-date-picker
                            size="mini"
                            v-model="filter_date_range"
                            type="daterange"
                            @change="fetchEntries"
                            :picker-options="pickerOptions"
                            format="dd MMM, yyyy"
                            value-format="yyyy-MM-dd"
                            range-separator="-"
                            :start-placeholder="$t('Start date')"
                            :end-placeholder="$t('End date')">
                        </el-date-picker>
                        <el-button
                            @click="fetchEntries"
                            size="mini"
                            type="success">
                            {{ $t('Search') }}
                        </el-button>
                        <el-button
                            @click="resetAdvancedFilter"
                            size="mini">
                            {{ $t('Hide') }}
                        </el-button>
                    </div>
                </div>
            </div>

            <el-table v-loading="loading" stripe :data="entries">
                <el-table-column width="220" :label="$t('Submission ID')">
                    <template slot-scope="scope">
                        <a class="payment_sub_url" :href="scope.row.entry_url">
                            #{{ scope.row.id }}
                        </a>
                        <span
                            class="ff_payment_badge"
                            v-if="scope.row.total_paid">
                            {{ formatMoney(scope.row) }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('Form')" prop="form.title"></el-table-column>
                <el-table-column width="160" :label="$t('Status')">
                    <template slot-scope="scope">
                        <span v-if="scope.row.status == 'read' ">{{ $t('Read') }}</span>
                        <span v-else-if="scope.row.status == 'unread' ">{{ $t('Unread') }}</span>
                        <span v-else>{{ scope.row.status|ucFirst }}</span>
                    </template>
                </el-table-column>
                <el-table-column width="160" :label="$t('Browser')" prop="browser"></el-table-column>
                <el-table-column width="260" :label="$t('Date')">
                    <template slot-scope="scope">
                        {{ scope.row.human_date }} {{ $t('ago') }}
                    </template>
                </el-table-column>
            </el-table>

            <div class="pull-right ff_paginate">
                <el-pagination
                        @size-change="handleSizeChange"
                        @current-change="goToPage"
                        :hide-on-single-page="false"
                        :current-page.sync="paginate.current_page"
                        :page-sizes="[5, 10, 20, 50, 100]"
                        :page-size="parseInt(paginate.per_page)"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="paginate.total">
                </el-pagination>
            </div>
        </div>
    </div>
</template>

<script type="text/babel">
import EntryChart from './chartView';

export default {
    name: 'AllEntries',
    components: {
        EntryChart
    },
    data() {
        return {
            entries: [],
            loading: false,
            selectedFormId: '',
            available_forms: [],
            advancedFilter: false,
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
            filter_date_range: ['', ''],
            selectedPaymentMethods: [],
            selectedPaymentStatuses: [],
            paginate: {
                total: 0,
                current_page: 1,
                last_page: 1,
                per_page: localStorage.getItem('entriesPerPage') || 10
            },
            chart_status: 'yes',
            entry_status: '',
            search: ''
        }
    },
    methods: {
        fetchEntries(type) {
            if (type == 'reset') {
                this.paginate.current_page = 1;
            }
            this.loading = true;
            const url = FluentFormsGlobal.$rest.route('getAllSubmissions');
            let data = {
                form_id: this.selectedFormId,
                page: this.paginate.current_page,
                per_page: this.paginate.per_page,
                search: this.search,
                entry_type: this.entry_status
            }
            if (this.advancedFilter) {
                data.date_range = this.filter_date_range;
            }
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    this.entries = response.data;
                    this.setPaginate(response);
                    this.available_forms = response.available_forms;
                })
                .catch(error => {
                    this.$fail(error.message);
                })
                .finally(() => {
                    this.loading = false;
                })
        },
        setPaginate(data = {}) {
            this.paginate = {
                total: data.total || 0,
                current_page: data.current_page || 1,
                last_page: data.last_page || 1,
                per_page: data.per_page || localStorage.getItem('entriesPerPage') || 20
            }
        },
        goToPage(value) {
            this.paginate.current_page = value;
            this.fetchEntries();
        },
        handleSizeChange(val) {
            this.paginate.per_page = val;
            this.fetchEntries();
        },
        formatMoney(row) {
            let amount = row.total_paid / 100;
            if (parseFloat(amount) % 1) {
                amount = parseFloat(amount).toFixed(2);
            }
            return amount + ' ' + row.currency;
        },
        toggleChart() {
            if (this.chart_status == 'yes') {
                this.chart_status = 'no';
            } else {
                this.chart_status = 'yes';
            }
            localStorage.setItem('ff_chart_status', this.chart_status);
        },
        resetAdvancedFilter() {
            this.advancedFilter = false;
            this.fetchEntries();
        }
    },
    filters: {
        ucFirst: function (value) {
            if (!value) return ''
            value = value.toString()
            return value.charAt(0).toUpperCase() + value.slice(1)
        }
    },
    mounted() {
        let status = localStorage.getItem('ff_chart_status');
        if (status) {
            this.chart_status = status;
        }
        this.fetchEntries();
    }
};
</script>


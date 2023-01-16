<template>
    <div v-loading="loading" class="ff_entries_wrapper">
        <div class="ff_section_head ff_section_head_between sm items-center">
            <div class="ff_section_head_content">
                <h1 class="ff_section_title">{{$t('All Form Entries')}}</h1>
            </div>
            <div class="ff_section_head_content ff_section_head_content_group">
                <el-button @click="toggleChart()" type="primary" class="el-button--soft mr-3">
                    <template v-if="chart_status == 'yes'">
                        <i class="ff-icon ff-icon-eye-off"></i>
                        <span>{{$t('Hide Chart')}}</span>
                    </template>
                    <template v-else>
                        <i class="ff-icon ff-icon-eye"></i>
                        <span>{{$t('Show Chart')}}</span>
                    </template>
                </el-button>
                <div class="ff_advanced_filter_wrap">
                    <el-button @click="advancedFilter = !advancedFilter">
                        <span>{{$t('Advanced Filter')}}</span>
                        <i class="ff-icon ff-icon-filter-alt"></i>
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
                            <p>{{$t('Filter By Date Range')}}</p>
                            <el-date-picker
                                v-model="filter_date_range"
                                type="daterange"
                                @change="fetchEntries()"
                                :picker-options="pickerOptions"
                                format="dd MMM, yyyy"
                                value-format="yyyy-MM-dd"
                                range-separator="-"
                                :start-placeholder="$t('Start date')"
                                :end-placeholder="$t('End date')">
                            </el-date-picker>
                        </div>
                    </div>
                </div>
            </div>
        </div><!-- .ff_section_head -->

        <div v-if="chart_status == 'yes'" class="entry_chart mb-5">
            <entry-chart></entry-chart>
        </div>
        
        <div class="ff_entries_details">
            <div class="ff_section_head sm">
                <el-row :gutter="12" class="items-end">
                    <el-col :span="18">
                        <el-row :gutter="12" class="items-center">
                            <el-col :span="24">
                                <h6 class="mb-3">{{$t('Form')}}</h6>
                            </el-col>
                            <el-col :span="7">
                                <div class="ff_form_group mb-0">
                                    <el-select
                                        class="ff_filter_form_select ff_select_shadow"
                                        @change="fetchEntries()" 
                                        clearable 
                                        filterable 
                                        v-model="selectedFormId"
                                        :placeholder="$t('Select Form')"
                                    >
                                        <el-option
                                            v-for="item in available_forms"
                                            :key="item.id"
                                            :label="item.title"
                                            :value="item.id">
                                        </el-option>
                                    </el-select>
                                </div>
                            </el-col>
                            <el-col :span="14">
                                <div class="ff_radio_group_wrap">
                                    <el-radio-group class="ff_radio_group" @change="fetchEntries('reset')" v-model="entry_status">
                                        <el-radio-button label="">{{ $t('All') }}</el-radio-button>
                                        <el-radio-button label="unread">{{ $t('Unread Only') }}</el-radio-button>
                                        <el-radio-button label="read">{{ $t('Read Only') }}</el-radio-button>
                                    </el-radio-group>
                                </div>
                            </el-col>
                        </el-row>
                    </el-col>
                    <el-col :span="6">
                        <div class="payment_actions">
                            <el-input
                                @keyup.enter.native="fetchEntries()" 
                                clearable
                                v-model="search"
                                :placeholder="$t('Search Forms')"
                                prefix-icon="el-icon-search"
                                class="el-input-gray"
                            >
                            </el-input>
                        </div>
                    </el-col>
                </el-row>
            </div>
            <div v-loading="loading" class="ff_table_wrap" element-loading-text="Loading entries...">
                <el-table v-loading="loading" :data="entries" class="ff_table">
                    <el-table-column width="200" :label="$t('Submission ID')">
                        <template slot-scope="scope">
                            <span>#{{scope.row.id}}</span>
                            <span class="ff_payment_badge" v-if="scope.row.total_paid">{{formatMoney(scope.row)}}</span>
                        </template>
                    </el-table-column>
                    <el-table-column :label="$t('Form')" prop="title" width="400"></el-table-column>
                    <el-table-column width="150" :label="$t('Status')">
                        <template slot-scope="scope">
                            <span v-if="scope.row.status ==  'read' ">{{$t('Read')}}</span>
                            <span v-else-if="scope.row.status ==  'unread' ">{{$t('Unread')}}</span>
                            <span v-else>{{scope.row.status|ucFirst}}</span>
                        </template>
                    </el-table-column>
                    <el-table-column width="150" :label="$t('Browser')" prop="browser"></el-table-column>
                    <el-table-column width="150" :label="$t('Date')">
                        <template slot-scope="scope">
                            {{scope.row.human_date}} {{$t('ago')}}
                        </template>
                    </el-table-column>
                    <el-table-column width="150" :label="$t('Action')">
                        <template slot-scope="scope">
                            <a :href="scope.row.entry_url" class="el-button el-button--primary el-button--soft-2 el-button--small">
                                <i class="ff-icon ff-icon-eye"></i>
                                <span>{{$t('View')}}</span>
                            </a>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="ff_pagination_wrap text-right mt-4">
                    <el-pagination
                        class="ff_pagination"
                        background
                        @size-change="handleSizeChange"
                        @current-change="goToPage"
                        hide-on-single-page
                        :current-page.sync="paginate.current_page"
                        :page-sizes="[5, 10, 20, 50, 100]"
                        :page-size="parseInt(paginate.per_page)"
                        layout="total, sizes, prev, pager, next"
                        :total="paginate.total"
                    ></el-pagination>
                </div>
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
                advancedFilter : false,
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
                    per_page: 10
                },
                chart_status: 'yes',
                entry_status: '',
                search: '',
                radioOption: ''
            }
        },
        methods: {
            fetchEntries(type) {
                
                if(type == 'reset') {
                    this.paginate.current_page = 1;
                }
                this.loading = true;
                let data = {
                    action: 'fluentform_get_all_entries',
                    form_id: this.selectedFormId,
                    page: this.paginate.current_page,
                    per_page: this.paginate.per_page,
                    search: this.search,
                    entry_status: this.entry_status
                }
                if (this.advancedFilter) {
                    data.date_range = this.filter_date_range;
                }
                FluentFormsGlobal.$get(data)
                    .then(response => {
                        this.entries = response.data.entries;
                        this.paginate.total = response.data.total;
                        this.paginate.last_page = response.data.last_page;
                        this.available_forms = response.data.available_forms
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(() => {
                        this.loading = false;
                    })
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
                if(parseFloat(amount) % 1) {
                    amount = parseFloat(amount).toFixed(2);
                }
                return amount +' '+ row.currency;
            },
            toggleChart() {
                if(this.chart_status == 'yes') {
                    this.chart_status = 'no';
                } else {
                    this.chart_status = 'yes';
                }
                localStorage.setItem('ff_chart_status', this.chart_status);
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
            if(status) {
                this.chart_status = status;
            }
            this.fetchEntries();
        }
    };
</script>


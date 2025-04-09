<template>
    <div class="fluentform-reports">
        <!-- Reports Header -->
        <div class="reports-header">
            <div class="reports-title">
                <h1>Reports</h1>
            </div>
            <div class="reports-controls">
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="Start date"
                    end-placeholder="End date"
                    :default-time="['00:00:00', '23:59:59']"
                    value-format="MMM d, yyyy"
                    format="MMM d, yyyy"
                    @change="handleDateRangeChange"
                    :disabled-date="disableFutureDates"
                    :picker-options="pickerOptions"
                    size="small"
                />
            </div>
        </div>

        <!-- Form Stats Section -->
        <div class="form-stats-section">
            <div class="stats-grid">
                <form-stats-card
                    v-for="stat in formStatsCards"
                    :key="stat.key"
                    :title="stat.title"
                    :value="stat.value"
                    :change="stat.change"
                    :change-type="stat.changeType"
                    :icon="stat.icon"
                    :bgColor="stat.bgColor"
                />
            </div>
        </div>

        <!-- Charts Row -->
        <el-row :gutter="24" class="charts-row">
            <!-- Conversion Chart Section -->
            <el-col :span="16">
                <div class="conversion-chart-section">
                    <overview-chart
                        :overview_chart="reports.overview_chart"
                        :forms_list="formsList"
                        :global_date_params="globalDateParams"
                        :chart_view="chartView"
                        @view-change="handleViewChange"
                        @form-change="handleFormChange"
                    />
                </div>
            </el-col>

            <!-- Completion Rates Section -->
            <el-col :span="8">
                <div class="completion-rates-gauge-section">
                    <completion-rates-gauge
                        :completion-rate="completionRate"
                        :forms_list="formsList"
                        :incomplete-submissions="incompleteSubmissions"
                        :total-submissions="totalSubmissions"
                        @completion-rate-form-change="handleGaugeFormChange"
                    />
                </div>
            </el-col>
        </el-row>

        <!-- Entries Grouped By Section -->
        <div class="submission-heatmap-section">
            <submission-heatmap
                :heatmap_data="reports.heatmap_data"
                :global_date_params="globalDateParams"
            />
        </div>

        <!-- Recent Transactions Section -->
        <el-row :gutter="24" style="margin-bottom: 24px;">
            <el-col :span="14" v-if="hasPayment">
                <div class="transactions-table-section">
                    <transactions-table
                        :transactions="reports.transactions"
                        :forms_list="formsList"
                        :global_date_params="globalDateParams"
                        :loading="transactionsLoading"
                        @transactions-filter-change="handleTransactionsFilterChange"
                    />
                </div>
            </el-col>
            <el-col :span="10" v-if="hasPayment">
                <div class="subscription-stats-section">
                    <subscription-stats
                        :subscription-data="reports.subscriptions"
                        :loading="subscriptionsLoading"
                        :formsList="formsList"
                        @subscription-filter-change="handleSubscriptionFilterChange"
                    />
                </div>
            </el-col>
        </el-row>

        <!-- API Logs Section -->
        <div class="api-logs-chart-section">
            <api-logs-chart
                :api_logs="reports.api_logs"
                :global_date_params="globalDateParams"
            />
        </div>
    </div>
</template>
<script type="text/babel">
import OverviewChart from './Components/OverviewChart/OverviewChart.vue';
import FormStatsCard from './Components/FormStats/FormStatsCard.vue';
import SubmissionHeatmap from "@/admin/Reports/Components/SubmissionHeatmap/SubmissionHeatmap.vue";
import ApiLogsChart from './Components/ApiLogsChart/ApiLogsChart.vue';
import TransactionsTable from './Components/TransactionsTable/TransactionsTable.vue';
import CompletionRatesGauge from './Components/CompletionRatesGauge/CompletionRatesGauge.vue';
import SubscriptionStats from './Components/SubscriptionStats/SubscriptionStats.vue';

export default {
    name: 'Reports',
    components: {
        ApiLogsChart,
        SubmissionHeatmap,
        OverviewChart,
        FormStatsCard,
        TransactionsTable,
        CompletionRatesGauge,
        SubscriptionStats
    },
    data() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const formatDateForApi = (date, isStart) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const time = isStart ? '00:00:00' : '23:59:59';
            return `${year}-${month}-${day} ${time}`;
        };

        const formatDateForDisplay = (date) => {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        };

        return {
            loading: false,
            reports: {},
            formsList: [],
            selectedRange: 'month',
            dateRange: [
                formatDateForDisplay(thirtyDaysAgo),
                formatDateForDisplay(now)
            ],
            lastUsedSelector: 'range',
            chartView: 'submissions',
            selectedFormId: null,
            chartLoading: false,
            gaugeLoading: false,
            statsLoading: false,
            transactionsLoading: false,
            selectedOverviewFormId: null,
            selectedGaugeFormId: null,
            subscriptionsLoading: false,
            globalDateParams: {
                startDate: formatDateForApi(thirtyDaysAgo, true),
                endDate: formatDateForApi(now, false),
                view: 'submission',
                formId: null,
                statsRange: 'month'
            },
            transactionsParams: {
                formId: null,
                paymentStatus: null,
                paymentMethod: null
            },
            pickerOptions: {
                shortcuts: [
                    {
                        text: 'Last week',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                            picker.$emit('pick', [start, end]);
                        }
                    },
                    {
                        text: 'Last month',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                            picker.$emit('pick', [start, end]);
                        }
                    },
                    {
                        text: 'Last 3 months',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                            picker.$emit('pick', [start, end]);
                        }
                    },
                    {
                        text: 'Last 6 months',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 180);
                            picker.$emit('pick', [start, end]);
                        }
                    },
                    {
                        text: 'Last Year',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 365);
                            picker.$emit('pick', [start, end]);
                        }
                    }
                ]
            },
        }
    },
    computed: {
        hasPayment() {
            return !!window.FluentFormApp.has_payment;
        },
        formStatsCards() {
            const stats = this.reports.form_stats || {};
            return [
                {
                    key: 'total_submissions',
                    title: 'Total Submissions',
                    value: stats.total_submissions?.value,
                    change: stats.total_submissions?.change,
                    changeType: stats.total_submissions?.change_type,
                    icon: 'el-icon-download',
                    bgColor: '#EBF1FF'
                },
                {
                    key: 'spam_submissions',
                    title: 'Spam Submissions',
                    value: stats.spam_submissions?.value,
                    change: stats.spam_submissions?.change,
                    changeType: stats.spam_submissions?.change_type,
                    icon: 'el-icon-warning-outline',
                    bgColor: '#FFF1EB'
                },
                {
                    key: 'unread_submissions',
                    title: 'Unread Submissions',
                    value: stats.unread_submissions?.value,
                    change: stats.unread_submissions?.change,
                    changeType: stats.unread_submissions?.change_type,
                    icon: 'el-icon-message',
                    bgColor: '#FFEBF4'
                },
                {
                    key: 'read_submissions',
                    title: 'Read Submissions',
                    value: stats.read_submissions?.value,
                    change: stats.read_submissions?.change,
                    changeType: stats.read_submissions?.change_type,
                    icon: 'el-icon-view',
                    bgColor: '#EFEBFF'
                },
                {
                    key: 'active_integrations',
                    title: 'Active Integrations',
                    value: stats.active_integrations?.value,
                    change: stats.active_integrations?.change,
                    changeType: stats.active_integrations?.change_type,
                    icon: 'el-icon-connection',
                    bgColor: '#EEFBF6'
                }
            ];
        },
        completionRate() {
            const completionData = this.reports.completion_rate;
            if (completionData && completionData.completion_rate !== undefined) {
                return completionData.completion_rate;
            }
            return 0; // Default value
        },
        incompleteSubmissions() {
            const completionData = this.reports.completion_rate;
            if (completionData && completionData.incomplete_submissions !== undefined) {
                return completionData.incomplete_submissions;
            }
            return 0; // Default value
        },
        totalSubmissions() {
            const completionData = this.reports.completion_rate;
            if (completionData && completionData.total_submissions !== undefined) {
                return completionData.total_submissions;
            }
            return 0; // Default value
        },
        totalAttempts() {
            const completionData = this.reports.completion_rate;
            if (completionData && completionData.total_attempts !== undefined) {
                return completionData.total_attempts;
            }
            return 0; // Default value
        }
    },
    methods: {
        fetchReports() {
            this.loading = true;

            let data = {
                action: 'fluentform-get-reports',
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                view: this.globalDateParams.view,
                stats_range: this.globalDateParams.statsRange,
                form_id: this.globalDateParams.formId,
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    this.reports = response.data.reports;
                })
                .fail(error => {
                    console.log(error);
                })
                .always(() => {
                    this.loading = false;
                });
        },

        fetchFormsList() {
            const data = {
                action: 'fluentform-get-forms'
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data && response.data.forms) {
                        this.formsList = response.data.forms;
                    }
                })
                .fail(error => {
                    console.error('Error fetching forms list:', error);
                });
        },

        handleRangeChange() {
            this.lastUsedSelector = 'range';
            this.dateRange = null;
            this.updateGlobalDateParams();
        },

        handleDateRangeChange() {
            this.lastUsedSelector = 'datepicker';
            this.selectedRange = null;
            this.updateGlobalDateParams();
        },

        handleViewChange(view) {
            this.chartLoading = true;
            this.chartView = view;
            this.globalDateParams.view = view;

            const data = {
                action: 'fluentform-get-reports',
                component: 'overview_chart',
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                view: view,
                form_id: this.selectedOverviewFormId || this.globalDateParams.formId
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data && response.data.reports && response.data.reports.overview_chart) {
                        this.reports.overview_chart = response.data.reports.overview_chart;
                    }
                })
                .fail(error => {
                    console.error('Error fetching overview chart data:', error);
                })
                .always(() => {
                    this.chartLoading = false;
                });
        },

        handleFormChange(formId) {
            this.selectedOverviewFormId = formId;
            this.overviewLoading = true;

            const data = {
                action: 'fluentform-get-reports',
                component: 'overview_chart',
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                view: this.globalDateParams.view || 'submissions',
                form_id: formId
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data && response.data.reports && response.data.reports.overview_chart) {
                        this.reports.overview_chart = response.data.reports.overview_chart;
                    }
                })
                .fail(error => {
                    console.error('Error fetching overview chart data:', error);
                })
                .always(() => {
                    this.overviewLoading = false;
                });
        },

        handleGaugeFormChange(formId) {
            this.selectedGaugeFormId = formId;
            this.gaugeLoading = true;

            const data = {
                action: 'fluentform-get-reports',
                component: 'completion_rate',
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                form_id: formId
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data && response.data.reports && response.data.reports.completion_rate) {
                        this.reports.completion_rate = response.data.reports.completion_rate;
                    }
                })
                .fail(error => {
                    console.error('Error fetching completion rates data:', error);
                })
                .always(() => {
                    this.gaugeLoading = false;
                });
        },

        handleStatsRangeChange(range) {
            this.statsLoading = true;
            this.globalDateParams.statsRange = range;

            const data = {
                action: 'fluentform-get-reports',
                component: 'form_stats',
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                stats_range: range
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data && response.data.reports && response.data.reports.form_stats) {
                        this.reports.form_stats = response.data.reports.form_stats;
                    }
                })
                .fail(error => {
                    console.error('Error fetching form stats data:', error);
                })
                .always(() => {
                    this.statsLoading = false;
                });
        },

        handleTransactionsFilterChange(params) {
            this.transactionsLoading = true;
            this.transactionsParams = {
                formId: params.formId,
                paymentStatus: params.paymentStatus,
                paymentMethod: params.paymentMethod
            };

            const data = {
                action: 'fluentform-get-reports',
                component: 'transactions',
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                transactions_form_id: params.formId,
                transactions_payment_status: params.paymentStatus,
                transactions_payment_method: params.paymentMethod
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data && response.data.reports && response.data.reports.transactions) {
                        this.reports.transactions = response.data.reports.transactions;
                    }
                })
                .fail(error => {
                    console.error('Error fetching transactions data:', error);
                })
                .always(() => {
                    this.transactionsLoading = false;
                });
        },
        
        handleSubscriptionFilterChange(params) {
            this.subscriptionsLoading = true;

            const data = {
                action: 'fluentform-get-reports',
                component: 'subscriptions',
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                subscriptions_status: params.status,
                subscriptions_interval: params.interval,
                subscriptions_form_id: params.formId
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data && response.data.reports && response.data.reports.subscriptions) {
                        this.reports.subscriptions = response.data.reports.subscriptions;
                    }
                })
                .fail(error => {
                    console.error('Error fetching subscription data:', error);
                })
                .always(() => {
                    this.subscriptionsLoading = false;
                });
        },

        updateGlobalDateParams() {
            const today = new Date();
            let startDate, endDate;

            if (this.lastUsedSelector === 'range' || !this.dateRange) {
                if (this.selectedRange === 'today') {
                    startDate = this.formatDateForApi(today, true);
                    endDate = this.formatDateForApi(today, false);
                } else if (this.selectedRange === 'week') {
                    const firstDay = new Date(today);
                    firstDay.setDate(today.getDate() - 6);
                    startDate = this.formatDateForApi(firstDay, true);
                    endDate = this.formatDateForApi(today, false);
                } else if (this.selectedRange === 'month') {
                    const firstDay = new Date(today);
                    firstDay.setDate(today.getDate() - 30);
                    startDate = this.formatDateForApi(firstDay, true);
                    endDate = this.formatDateForApi(today, false);
                } else if (this.selectedRange === 'year') {
                    const firstDay = new Date(today);
                    firstDay.setDate(today.getDate() - 365);
                    startDate = this.formatDateForApi(firstDay, true);
                    endDate = this.formatDateForApi(today, false);
                }
            } else if (this.lastUsedSelector === 'datepicker' && this.dateRange && this.dateRange.length === 2) {
                try {
                    const startObj = new Date(this.dateRange[0]);
                    const endObj = new Date(this.dateRange[1]);
                    startDate = this.formatDateForApi(startObj, true);
                    endDate = this.formatDateForApi(endObj, false);
                } catch (e) {
                    const firstDay = new Date(today);
                    firstDay.setDate(today.getDate() - 30);
                    startDate = this.formatDateForApi(firstDay, true);
                    endDate = this.formatDateForApi(today, false);
                }
            }

            this.globalDateParams.startDate = startDate;
            this.globalDateParams.endDate = endDate;
            this.fetchReports();
        },

        formatDateForApi(date, isStart) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const time = isStart ? '00:00:00' : '23:59:59';
            return `${year}-${month}-${day} ${time}`;
        },

        formatDateRange(startDate, endDate) {
            if (!startDate || !endDate) return '';

            const start = new Date(startDate);
            const end = new Date(endDate);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            const startStr = `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
            const endStr = `${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;

            return `${startStr} - ${endStr}`;
        },

        disableFutureDates(date) {
            return date > new Date();
        }
    },
    mounted() {
        this.fetchReports();
        this.fetchFormsList();
    }
};
</script>



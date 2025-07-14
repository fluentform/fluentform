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
                            :selected-metrics="selectedChartMetrics"
                            @view-change="handleViewChange"
                            @form-change="handleFormChange"
                            @chart-mode-change="handleChartModeChange"
                    />
                </div>
            </el-col>

            <!-- Chart Metrics Selector Section -->
            <el-col :span="8">
                <div class="chart-metrics-selector-section">
                    <chart-metrics-selector
                            :reports="reports"
                            :has-payment="hasPayment"
                            :payment-currency="paymentCurrency"
                            :selected-metrics="selectedChartMetrics"
                            :chart-mode="chartMode"
                            @metrics-changed="handleMetricsChanged"
                    />
                </div>
            </el-col>
        </el-row>

        <!-- Completion Rates and Top Performing Forms Row -->
        <el-row :gutter="24" class="completion-rates-row">
            <el-col :span="16">
                <div class="top-performing-forms-section">
                    <top-performing-forms
                            :top-forms-data="reports.top_performing_forms || []"
                            :global-date-params="globalDateParams"
                            :has-payment="hasPayment"
                            :payment-currency="paymentCurrency"
                            :loading="topFormsLoading"
                            @metric-change="handleTopFormsMetricChange"
                    />
                </div>
            </el-col>

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

        <!-- Net Revenue Analysis Section -->
        <div v-if="hasPayment" class="net-revenue-section" style="margin-bottom: 24px;">
            <net-revenue-by-group
                    :forms-list="formsList"
                    :global-date-params="globalDateParams"
                    :payment-currency="paymentCurrency"
            />
        </div>

        <!-- Submission Analysis Section -->
        <div class="submission-analysis-section" style="margin-bottom: 24px;">
            <submission-analysis
                    :forms-list="formsList"
                    :global-date-params="globalDateParams"
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

        <el-row :gutter="24">
            <el-col :span="14">
                <!-- API Logs Section -->
                <div class="api-logs-chart-section">
                    <api-logs-chart
                            :api_logs="reports.api_logs"
                            :global_date_params="globalDateParams"
                    />
                </div>
            </el-col>

            <el-col :span="10">
                <!-- Country Heatmap Section -->
                <div class="country-heatmap-section">
                    <submission-country-heatmap
                            :country-heatmap="reports.country_heatmap"
                            :global-date-params="globalDateParams"
                            :forms_list="formsList"
                            @country-heatmap-form-change="handleCountryHeatmapFormChange"
                    />
                </div>
            </el-col>
        </el-row>
    </div>
</template>
<script type="text/babel">
    import OverviewChart from './Components/OverviewChart/OverviewChart.vue';
    import FormStatsCard from './Components/FormStats/FormStatsCard.vue';
    import SubmissionHeatmap from "@/admin/Reports/Components/SubmissionHeatmap/SubmissionHeatmap.vue";
    import SubmissionCountryHeatmap from './Components/SubmissionCountryHeatmap/SubmissionCountryHeatmap.vue';
    import ApiLogsChart from './Components/ApiLogsChart/ApiLogsChart.vue';
    import TransactionsTable from './Components/TransactionsTable/TransactionsTable.vue';
    import CompletionRatesGauge from './Components/CompletionRatesGauge/CompletionRatesGauge.vue';
    import SubscriptionStats from './Components/SubscriptionStats/SubscriptionStats.vue';
    import ChartMetricsSelector from './Components/ChartMetrics/ChartMetricsSelector.vue';
    import TopPerformingForms from './Components/TopPerformingForms/TopPerformingForms.vue';
    import NetRevenueByGroup from './Components/NetRevenue/NetRevenueByGroup.vue';
    import SubmissionAnalysis from './Components/SubmissionAnalysis/SubmissionAnalysis.vue';

    export default {
        name: 'Reports',
        components: {
            ApiLogsChart,
            SubmissionHeatmap,
            SubmissionCountryHeatmap,
            OverviewChart,
            FormStatsCard,
            TransactionsTable,
            CompletionRatesGauge,
            SubscriptionStats,
            ChartMetricsSelector,
            TopPerformingForms,
            NetRevenueByGroup,
            SubmissionAnalysis
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
                countryHeatmapLoading: false,
                selectedOverviewFormId: null,
                selectedGaugeFormId: null,
                selectedCountryHeatmapFormId: null,
                subscriptionsLoading: false,
                topFormsLoading: false,
                selectedTopFormsMetric: 'entries',
                selectedChartMetrics: ['submissions', 'views'], // Default selected metrics
                chartMode: 'activity', // Track current chart mode
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
                const cards = [
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
                    }
                ];


                return cards;
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
            paymentCurrency() {
                const stats = this.reports.form_stats || {};
                if (stats.total_payments && stats.total_payments.currency_symbol) {
                    return stats.total_payments.currency_symbol;
                }
                return '$'; // Default fallback
            }
        },
        methods: {
            fetchReports() {
                this.loading = true;

                const data = {
                    start_date: this.globalDateParams.startDate,
                    end_date: this.globalDateParams.endDate,
                    view: this.globalDateParams.view,
                    stats_range: this.globalDateParams.statsRange,
                    form_id: this.globalDateParams.formId,
                };
                const url = FluentFormsGlobal.$rest.route('report');
                FluentFormsGlobal.$rest.get(url, data)
                    .then(response => {
                        this.reports = response.reports;
                    })
                    .catch(error => {
                        console.log(error);
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },

            fetchFormsList() {
                const url = FluentFormsGlobal.$rest.route('selectFormsForReport');
                FluentFormsGlobal.$rest.get(url)
                    .then(response => {
                        if (response.forms) {
                            this.formsList = response.forms;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching forms list:', error);
                    });
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
                    component: 'overview_chart',
                    start_date: this.globalDateParams.startDate,
                    end_date: this.globalDateParams.endDate,
                    view: view,
                    form_id: this.selectedOverviewFormId || this.globalDateParams.formId
                };
                const url = FluentFormsGlobal.$rest.route('report');
                FluentFormsGlobal.$rest.get(url, data)
                    .then(response => {
                        if (response.reports && response.reports.overview_chart) {
                            this.reports.overview_chart = response.reports.overview_chart;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching overview chart data:', error);
                    })
                    .finally(() => {
                        this.chartLoading = false;
                    });
            },

            handleFormChange(formId) {
                this.selectedOverviewFormId = formId;
                this.overviewLoading = true;

                const data = {
                    component: 'overview_chart',
                    start_date: this.globalDateParams.startDate,
                    end_date: this.globalDateParams.endDate,
                    view: this.globalDateParams.view || 'submissions',
                    form_id: formId
                };

                const url = FluentFormsGlobal.$rest.route('report');
                FluentFormsGlobal.$rest.get(url, data)
                    .then(response => {
                        if (response.reports && response.reports.overview_chart) {
                            this.reports.overview_chart = response.reports.overview_chart;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching overview chart data:', error);
                    })
                    .finally(() => {
                        this.overviewLoading = false;
                    });
            },

            handleGaugeFormChange(formId) {
                this.selectedGaugeFormId = formId;
                this.gaugeLoading = true;

                const data = {
                    component: 'completion_rate',
                    start_date: this.globalDateParams.startDate,
                    end_date: this.globalDateParams.endDate,
                    form_id: formId
                };

                const url = FluentFormsGlobal.$rest.route('report');
                FluentFormsGlobal.$rest.get(url, data)
                    .then(response => {
                        if (response && response.reports && response.reports.completion_rate) {
                            this.reports.completion_rate = response.reports.completion_rate;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching completion rates data:', error);
                    })
                    .finally(() => {
                        this.gaugeLoading = false;
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
                    component: 'transactions',
                    start_date: this.globalDateParams.startDate,
                    end_date: this.globalDateParams.endDate,
                    transactions_form_id: params.formId,
                    transactions_payment_status: params.paymentStatus,
                    transactions_payment_method: params.paymentMethod
                };
                const url = FluentFormsGlobal.$rest.route('report');
                FluentFormsGlobal.$rest.get(url, data)
                    .then(response => {
                        if (response && response.reports && response.reports.transactions) {
                            this.reports.transactions = response.reports.transactions;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching transactions data:', error);
                    })
                    .finally(() => {
                        this.transactionsLoading = false;
                    });
            },

            handleSubscriptionFilterChange(params) {
                this.subscriptionsLoading = true;

                const data = {
                    component: 'subscriptions',
                    start_date: this.globalDateParams.startDate,
                    end_date: this.globalDateParams.endDate,
                    subscriptions_status: params.status,
                    subscriptions_interval: params.interval,
                    subscriptions_form_id: params.formId
                };
                const url = FluentFormsGlobal.$rest.route('report');
                FluentFormsGlobal.$rest.get(url, data)
                    .then(response => {
                        if (response && response.reports && response.reports.subscriptions) {
                            this.reports.subscriptions = response.reports.subscriptions;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching subscription data:', error);
                    })
                    .finally(() => {
                        this.subscriptionsLoading = false;
                    });
            },

            handleCountryHeatmapFormChange(formId) {
                this.selectedCountryHeatmapFormId = formId;
                this.countryHeatmapLoading = true;

                const data = {
                    component: 'country_heatmap',
                    start_date: this.globalDateParams.startDate,
                    end_date: this.globalDateParams.endDate,
                    form_id: formId
                };
                const url = FluentFormsGlobal.$rest.route('report');
                FluentFormsGlobal.$rest.get(url, data)
                    .then(response => {
                        if (response && response.reports && response.reports.country_heatmap) {
                            this.reports.country_heatmap = response.reports.country_heatmap;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching completion rates data:', error);
                    })
                    .finally(() => {
                        this.gaugeLoading = false;
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

            disableFutureDates(date) {
                return date > new Date();
            },

            handleMetricsChanged(selectedMetrics) {
                this.selectedChartMetrics = selectedMetrics;
                // The chart will automatically update due to the reactive prop binding
            },

            handleTopFormsMetricChange(metric) {
                this.selectedTopFormsMetric = metric;
                this.topFormsLoading = true;

                const data = {
                    component: 'top_performing_forms',
                    start_date: this.globalDateParams.startDate,
                    end_date: this.globalDateParams.endDate,
                    metric: metric
                };
                const url = FluentFormsGlobal.$rest.route('report');
                FluentFormsGlobal.$rest.get(url, data)
                    .then(response => {
                        if (response && response.reports && response.reports.top_performing_forms) {
                            this.reports.top_performing_forms = response.reports.top_performing_forms;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching top performing forms data:', error);
                    })
                    .finally(() => {
                        this.topFormsLoading = false;
                    });
            },

            handleChartModeChange(mode) {
                this.chartMode = mode;
                // The ChartMetricsSelector will automatically update its available metrics
                // and emit updated selected metrics through its watcher
            },

            decodeHtmlEntities(text) {
                if (!text) return '$';
                const textarea = document.createElement('textarea');
                textarea.innerHTML = text;
                return textarea.value;
            }
        },
        mounted() {
            this.fetchReports();
            this.fetchFormsList();
        }
    };
</script>

<style scoped>
    /* Ensure equal heights for completion rates row */
    .completion-rates-row {
        display: flex;
        align-items: stretch;
    }

    .completion-rates-row .el-col {
        display: flex;
    }

    .completion-rates-gauge-section,
    .top-performing-forms-section {
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .completion-rates-gauge-section .card,
    .top-performing-forms-section .card {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .completion-rates-gauge-section .card-body,
    .top-performing-forms-section .card-body {
        flex: 1;
    }
</style>


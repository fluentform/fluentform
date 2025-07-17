<template>
    <div class="fluentform-reports">
        <!-- Reports Tabs Navigation -->
        <div class="reports-tabs-section">
            <el-tabs v-model="activeTab" class="reports-main-tabs">
                <el-tab-pane label="Overview" name="overview">
                    <!-- Reports Header -->
                    <div class="reports-header">
                        <div>
                            <h1 class="reports-title">Overview</h1>
                            <p class="reports-description">A brief look at your overall form performance</p>
                        </div>
                        <div class="reports-controls">
                            <date-range-controls
                                :selected-range="selectedRange"
                                :date-range="dateRange"
                                @range-select="handleRangeSelect"
                                @date-range-change="handleDateRangeChange"
                            />
                        </div>
                    </div>

                    <!-- Form Stats Section -->
                    <div class="form-stats-section">
                        <div class="stats-grid">
                            <form-stats-card
                                v-for="stat in formOverviewStatsCards"
                                :key="stat.key"
                                :title="stat.title"
                                :value="stat.value"
                                :change="stat.change"
                                :change-type="stat.changeType"
                                :icon="stat.icon"
                                :bgColor="stat.bgColor"
                                type="overview"
                            />
                        </div>
                    </div>

                    <!-- Charts Row -->
                    <el-row :gutter="24" class="charts-row">
                        <!-- Conversion Chart Section -->
                        <el-col :span="24" :md="16" >
                            <div class="conversion-chart-section">
                                <overview-chart
                                    :overview_chart="overviewChartData"
                                    :forms_list="formsList"
                                    :global_date_params="globalDateParams"
                                    :chart_view="chartMode"
                                    :selected-metrics="selectedChartMetrics"
                                    @form-change="handleFormChange"
                                    @chart-mode-change="handleViewChange"
                                />
                            </div>
                        </el-col>

                        <el-col :span="24" :md="8">
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

                    <!-- Completion Rates and Top Performing Forms Row -->
                    <el-row :gutter="24" class="completion-rates-row">
                        <el-col :span="24" :md="12">
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

                        <el-col :span="24" :md="12">
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

                    <!-- Entries Grouped By Section -->
                    <div class="submission-heatmap-section">
                        <submission-heatmap
                            :heatmap_data="reports.heatmap_data"
                            :global_date_params="globalDateParams"
                        />
                    </div>

                    <el-row :gutter="24">
                        <el-col :span="24">
                            <!-- API Logs Section -->
                            <div class="api-logs-chart-section">
                                <line-chart
                                    :data="reports.api_logs"
                                    title="API Logs"
                                    type="api_logs"
                                />
                            </div>
                        </el-col>
                    </el-row>

                </el-tab-pane>
                <el-tab-pane label="Revenue" name="revenue">
                    <!-- Revenue Header -->
                    <div class="reports-header">
                        <div>
                            <h1 class="reports-title">Revenue</h1>
                            <p class="reports-description">A brief look at net revenue performance</p>
                        </div>
                        <div class="reports-controls">
                            <date-range-controls
                                :selected-range="selectedRange"
                                :date-range="dateRange"
                                @range-select="handleRangeSelect"
                                @date-range-change="handleDateRangeChange"
                            />
                        </div>
                    </div>

                    <!-- Revenue Stats Section -->
                    <div class="form-stats-section">
                        <div class="stats-grid">
                            <form-stats-card
                                v-for="stat in formatPaymentStatsCards"
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

                    <!-- Revenue Logs Chart -->
                    <line-chart
                        :data="reports.revenue_chart"
                        title="Revenue"
                        type="revenue"
                    />

                    <!-- Net Revenue Analysis Section -->
                    <div v-if="hasPayment" class="net-revenue-section" style="margin-bottom: 24px;">
                        <net-revenue-by-group
                            :forms-list="formsList"
                            :global-date-params="globalDateParams"
                            :payment-currency="paymentCurrency"
                        />
                    </div>
                </el-tab-pane>
                <el-tab-pane label="Submission" name="submission">
                    <!-- Submission Header -->
                    <div class="reports-header">
                        <div>
                            <h1 class="reports-title">Submission</h1>
                            <p class="reports-description">A brief look at submission performance</p>
                        </div>
                        <div class="reports-controls">
                            <date-range-controls
                                :selected-range="selectedRange"
                                :date-range="dateRange"
                                @range-select="handleRangeSelect"
                                @date-range-change="handleDateRangeChange"
                            />
                        </div>
                    </div>

                    <!-- Submission Stats Section -->
                    <div class="form-stats-section">
                        <div class="stats-grid">
                            <form-stats-card
                                v-for="stat in formatSubmissionStatsCards"
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

                    <!-- Submission Chart Section -->
                    <div class="submission-chart-section">
                        <line-chart
                            :data="reports.overview_chart"
                            title="Submission"
                        />
                    </div>

                    <!-- Submission Analysis Section -->
                    <div class="submission-analysis-section" style="margin-bottom: 24px;">
                        <submission-analysis
                            :forms-list="formsList"
                            :global-date-params="globalDateParams"
                        />
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>
<script type="text/babel">
import OverviewChart from "./Components/OverviewChart/OverviewChart.vue";
import FormStatsCard from "./Components/FormStats/FormStatsCard.vue";
import SubmissionHeatmap from "@/admin/Reports/Components/SubmissionHeatmap/SubmissionHeatmap.vue";
import SubmissionCountryHeatmap from "./Components/SubmissionCountryHeatmap/SubmissionCountryHeatmap.vue";
import LineChart from "./Components/LineChart.vue";
import TransactionsTable from "./Components/TransactionsTable/TransactionsTable.vue";
import CompletionRatesGauge from "./Components/CompletionRatesGauge/CompletionRatesGauge.vue";
import SubscriptionStats from "./Components/SubscriptionStats/SubscriptionStats.vue";
import ChartMetricsSelector from "./Components/ChartMetrics/ChartMetricsSelector.vue";
import TopPerformingForms from "./Components/TopPerformingForms/TopPerformingForms.vue";
import NetRevenueByGroup from "./Components/NetRevenue/NetRevenueByGroup.vue";
import SubmissionAnalysis from "./Components/SubmissionAnalysis/SubmissionAnalysis.vue";
import DateRangeControls from "./Components/DateRangeControls/DateRangeControls.vue";

export default {
    name: "Reports",
    components: {
        LineChart,
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
        SubmissionAnalysis,
        DateRangeControls
    },
    data() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        return {
            activeTab: "overview",
            loading: false,
            reports: {},
            formsList: [],
            selectedRange: "month",
            dateRange: [
                this.formatDateForDisplay(thirtyDaysAgo),
                this.formatDateForDisplay(now)
            ],
            lastUsedSelector: "range",
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
            selectedTopFormsMetric: "entries",
            selectedChartMetrics: ["submissions", "views", 'spam', 'unread', 'read'], // Default selected metrics
            chartMode: "activity", // Track current chart mode
            globalDateParams: {
                startDate: this.formatDateForApi(thirtyDaysAgo, true),
                endDate: this.formatDateForApi(now, false),
                formId: null,
                statsRange: "month"
            },
            isDateQuickSelectOpen: false,
            transactionsParams: {
                formId: null,
                paymentStatus: null,
                paymentMethod: null
            }
        };
    },
    computed: {
        hasPayment() {
            return !!window.FluentFormApp.has_payment;
        },
        overviewChartData() {
            return this.chartMode === 'activity' ? this.reports.overview_chart : this.reports.revenue_chart;
        },
        formOverviewStatsCards() {
            const stats = this.reports.form_stats || {};
            return [
                {
                    key: "total_submissions",
                    title: "Total Submissions",
                    value: stats.total_submissions?.value,
                    change: stats.total_submissions?.change,
                    changeType: stats.total_submissions?.change_type,
                    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.2072 9.2905C17.5977 9.68103 17.5977 10.3142 17.2072 10.7047C16.8167 11.0952 16.1835 11.0952 15.793 10.7047L13.002 7.91371V15C13.002 15.5523 12.5543 16 12.002 16C11.4497 16 11.002 15.5523 11.002 15V7.91374L8.20906 10.7067C7.81854 11.0972 7.18537 11.0972 6.79485 10.7067C6.40432 10.3161 6.40432 9.68298 6.79485 9.29245L11.2949 4.79241C11.4824 4.60487 11.7368 4.49951 12.002 4.49951C12.2672 4.49951 12.5216 4.60487 12.7091 4.79241L17.2072 9.2905Z" fill="#5E5D5C" /><path fill-rule="evenodd" clip-rule="evenodd" d="M4 14C4.55228 14 5 14.4477 5 15V17C5 17.5523 5.44772 18 6 18H18C18.5523 18 19 17.5523 19 17V15C19 14.4477 19.4477 14 20 14C20.5523 14 21 14.4477 21 15V17C21 18.6569 19.6569 20 18 20H6C4.34315 20 3 18.6569 3 17V15C3 14.4477 3.44772 14 4 14Z" fill="#5E5D5C" /></svg>`,
                    bgColor: "#EBF1FF"
                },
                {
                    key: "spam_submissions",
                    title: "Spam Submissions",
                    value: stats.spam_submissions?.value,
                    change: stats.spam_submissions?.change,
                    changeType: stats.spam_submissions?.change_type,
                    icon: `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.45 3.44922L22.4 11.9992L17.45 20.5492H7.54998L2.59998 11.9992L7.54998 3.44922H17.45ZM16.4123 5.24922H8.58768L4.67988 11.9992L8.58768 18.7492H16.4123L20.3201 11.9992L16.4123 5.24922ZM11.6 14.6992H13.4V16.4992H11.6V14.6992ZM11.6 7.49922H13.4V12.8992H11.6V7.49922Z" fill="#0E121B"/></svg>`,
                    bgColor: "#FFF1EB"
                },
                {
                    key: "unread_submissions",
                    title: "Unread Submissions",
                    value: stats.unread_submissions?.value,
                    change: stats.unread_submissions?.change,
                    changeType: stats.unread_submissions?.change_type,
                    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.69 3.89961C15.5693 4.49354 15.5693 5.10568 15.69 5.69961H5.2599L12.0549 11.6954L16.599 7.62741C16.9824 8.10171 17.4612 8.49681 18.0057 8.78391L12.0648 14.1038L4.8 7.69401V18.2996H19.2V9.20961C19.7939 9.33027 20.4061 9.33027 21 9.20961V19.1996C21 19.4383 20.9052 19.6672 20.7364 19.836C20.5676 20.0048 20.3387 20.0996 20.1 20.0996H3.9C3.66131 20.0996 3.43239 20.0048 3.2636 19.836C3.09482 19.6672 3 19.4383 3 19.1996V4.79961C3 4.56091 3.09482 4.332 3.2636 4.16321C3.43239 3.99443 3.66131 3.89961 3.9 3.89961H15.69ZM20.1 7.49961C19.7454 7.49961 19.3943 7.42977 19.0668 7.29408C18.7392 7.1584 18.4415 6.95952 18.1908 6.7088C17.9401 6.45808 17.7412 6.16043 17.6055 5.83285C17.4698 5.50528 17.4 5.15418 17.4 4.79961C17.4 4.44504 17.4698 4.09394 17.6055 3.76636C17.7412 3.43878 17.9401 3.14114 18.1908 2.89042C18.4415 2.6397 18.7392 2.44082 19.0668 2.30513C19.3943 2.16945 19.7454 2.09961 20.1 2.09961C20.8161 2.09961 21.5028 2.38407 22.0092 2.89042C22.5155 3.39677 22.8 4.08352 22.8 4.79961C22.8 5.51569 22.5155 6.20245 22.0092 6.7088C21.5028 7.21515 20.8161 7.49961 20.1 7.49961Z" fill="#FB4BA3"/></svg>`,
                    bgColor: "#FFEBF4"
                },
                {
                    key: "active_forms",
                    title: "Active Forms",
                    value: stats.active_forms?.value,
                    icon: `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.7 21H5.30002C5.06133 21 4.83241 20.9052 4.66363 20.7364C4.49485 20.5676 4.40002 20.3387 4.40002 20.1V3.9C4.40002 3.66131 4.49485 3.43239 4.66363 3.2636C4.83241 3.09482 5.06133 3 5.30002 3H19.7C19.9387 3 20.1676 3.09482 20.3364 3.2636C20.5052 3.43239 20.6 3.66131 20.6 3.9V20.1C20.6 20.3387 20.5052 20.5676 20.3364 20.7364C20.1676 20.9052 19.9387 21 19.7 21ZM18.8 19.2V4.8H6.20002V19.2H18.8ZM8.90002 7.5H16.1V9.3H8.90002V7.5ZM8.90002 11.1H16.1V12.9H8.90002V11.1ZM8.90002 14.7H13.4V16.5H8.90002V14.7Z" fill="#0E121B"/></svg>`,
                    bgColor: "#EEFBF6"
                }
            ];
        },
        formatSubmissionStatsCards() {
            const stats = this.reports.form_stats || {};
            return [
                {
                    key: "total_submissions",
                    title: "Total",
                    value: stats.total_submissions?.value,
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M22 23.5H10C9.80109 23.5 9.61032 23.421 9.46967 23.2803C9.32902 23.1397 9.25 22.9489 9.25 22.75V9.25C9.25 9.05109 9.32902 8.86032 9.46967 8.71967C9.61032 8.57902 9.80109 8.5 10 8.5H22C22.1989 8.5 22.3897 8.57902 22.5303 8.71967C22.671 8.86032 22.75 9.05109 22.75 9.25V22.75C22.75 22.9489 22.671 23.1397 22.5303 23.2803C22.3897 23.421 22.1989 23.5 22 23.5ZM21.25 22V10H10.75V22H21.25ZM13 12.25H19V13.75H13V12.25ZM13 15.25H19V16.75H13V15.25ZM13 18.25H16.75V19.75H13V18.25Z" fill="#525866"/></svg>`,
                    bgColor: "#F2F5F8"
                },
                {
                    key: 'read_submissions',
                    title: 'Read',
                    value: stats.read_submissions?.value,
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M16 9.25C20.044 9.25 23.4085 12.16 24.1142 16C23.4092 19.84 20.044 22.75 16 22.75C11.956 22.75 8.59149 19.84 7.88574 16C8.59074 12.16 11.956 9.25 16 9.25ZM16 21.25C17.5296 21.2497 19.0138 20.7301 20.2096 19.7764C21.4055 18.8226 22.2422 17.4912 22.5827 16C22.2409 14.51 21.4037 13.18 20.208 12.2275C19.0122 11.275 17.5287 10.7564 16 10.7564C14.4713 10.7564 12.9878 11.275 11.792 12.2275C10.5963 13.18 9.75907 14.51 9.41724 16C9.75781 17.4912 10.5945 18.8226 11.7904 19.7764C12.9862 20.7301 14.4704 21.2497 16 21.25ZM16 19.375C15.1049 19.375 14.2464 19.0194 13.6135 18.3865C12.9806 17.7535 12.625 16.8951 12.625 16C12.625 15.1049 12.9806 14.2464 13.6135 13.6135C14.2464 12.9806 15.1049 12.625 16 12.625C16.8951 12.625 17.7535 12.9806 18.3865 13.6135C19.0194 14.2464 19.375 15.1049 19.375 16C19.375 16.8951 19.0194 17.7535 18.3865 18.3865C17.7535 19.0194 16.8951 19.375 16 19.375ZM16 17.875C16.4973 17.875 16.9742 17.6775 17.3258 17.3258C17.6774 16.9742 17.875 16.4973 17.875 16C17.875 15.5027 17.6774 15.0258 17.3258 14.6742C16.9742 14.3225 16.4973 14.125 16 14.125C15.5027 14.125 15.0258 14.3225 14.6742 14.6742C14.3225 15.0258 14.125 15.5027 14.125 16C14.125 16.4973 14.3225 16.9742 14.6742 17.3258C15.0258 17.6775 15.5027 17.875 16 17.875Z" fill="#525866"/></svg>`,
                    bgColor: '#F2F5F8'
                },
                {
                    key: "unread_submissions",
                    title: "Unread",
                    value: stats.unread_submissions?.value,
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M19.075 9.25C18.9745 9.74495 18.9745 10.2551 19.075 10.75H10.3833L16.0457 15.7465L19.8325 12.3565C20.152 12.7517 20.551 13.081 21.0048 13.3203L16.054 17.7535L10 12.412V21.25H22V13.675C22.4949 13.7755 23.0051 13.7755 23.5 13.675V22C23.5 22.1989 23.421 22.3897 23.2803 22.5303C23.1397 22.671 22.9489 22.75 22.75 22.75H9.25C9.05109 22.75 8.86032 22.671 8.71967 22.5303C8.57902 22.3897 8.5 22.1989 8.5 22V10C8.5 9.80109 8.57902 9.61032 8.71967 9.46967C8.86032 9.32902 9.05109 9.25 9.25 9.25H19.075ZM22.75 12.25C22.4545 12.25 22.1619 12.1918 21.889 12.0787C21.616 11.9657 21.3679 11.7999 21.159 11.591C20.9501 11.3821 20.7843 11.134 20.6713 10.861C20.5582 10.5881 20.5 10.2955 20.5 10C20.5 9.70453 20.5582 9.41194 20.6713 9.13896C20.7843 8.86598 20.9501 8.61794 21.159 8.40901C21.3679 8.20008 21.616 8.03434 21.889 7.92127C22.1619 7.8082 22.4545 7.75 22.75 7.75C23.3467 7.75 23.919 7.98705 24.341 8.40901C24.7629 8.83097 25 9.40326 25 10C25 10.5967 24.7629 11.169 24.341 11.591C23.919 12.0129 23.3467 12.25 22.75 12.25Z" fill="#525866"/></svg>`,
                    bgColor: "#F2F5F8"
                },
                {
                    key: "spam_submissions",
                    title: "Spam",
                    value: stats.spam_submissions?.value,
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M20.125 8.875L24.25 16L20.125 23.125H11.875L7.75 16L11.875 8.875H20.125ZM19.2603 10.375H12.7397L9.48325 16L12.7397 21.625H19.2603L22.5167 16L19.2603 10.375ZM15.25 18.25H16.75V19.75H15.25V18.25ZM15.25 12.25H16.75V16.75H15.25V12.25Z" fill="#525866"/></svg>`,
                    bgColor: "#F2F5F8"
                },
                {
                    key: "read_submission_rate",
                    title: "Overall Read Rate",
                    value: stats.read_submission_rate?.value ? stats.read_submission_rate?.value + '%' : '0%',
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M20.125 22.75C19.4288 22.75 18.7611 22.4734 18.2688 21.9812C17.7766 21.4889 17.5 20.8212 17.5 20.125C17.5 19.4288 17.7766 18.7611 18.2688 18.2688C18.7611 17.7766 19.4288 17.5 20.125 17.5C20.8212 17.5 21.4889 17.7766 21.9812 18.2688C22.4734 18.7611 22.75 19.4288 22.75 20.125C22.75 20.8212 22.4734 21.4889 21.9812 21.9812C21.4889 22.4734 20.8212 22.75 20.125 22.75ZM20.125 21.25C20.4234 21.25 20.7095 21.1315 20.9205 20.9205C21.1315 20.7095 21.25 20.4234 21.25 20.125C21.25 19.8266 21.1315 19.5405 20.9205 19.3295C20.7095 19.1185 20.4234 19 20.125 19C19.8266 19 19.5405 19.1185 19.3295 19.3295C19.1185 19.5405 19 19.8266 19 20.125C19 20.4234 19.1185 20.7095 19.3295 20.9205C19.5405 21.1315 19.8266 21.25 20.125 21.25ZM11.875 14.5C11.5303 14.5 11.1889 14.4321 10.8705 14.3002C10.552 14.1683 10.2626 13.9749 10.0188 13.7312C9.77509 13.4874 9.58173 13.198 9.44982 12.8795C9.3179 12.5611 9.25 12.2197 9.25 11.875C9.25 11.5303 9.3179 11.1889 9.44982 10.8705C9.58173 10.552 9.77509 10.2626 10.0188 10.0188C10.2626 9.77509 10.552 9.58173 10.8705 9.44982C11.1889 9.3179 11.5303 9.25 11.875 9.25C12.5712 9.25 13.2389 9.52656 13.7312 10.0188C14.2234 10.5111 14.5 11.1788 14.5 11.875C14.5 12.5712 14.2234 13.2389 13.7312 13.7312C13.2389 14.2234 12.5712 14.5 11.875 14.5ZM11.875 13C12.1734 13 12.4595 12.8815 12.6705 12.6705C12.8815 12.4595 13 12.1734 13 11.875C13 11.5766 12.8815 11.2905 12.6705 11.0795C12.4595 10.8685 12.1734 10.75 11.875 10.75C11.5766 10.75 11.2905 10.8685 11.0795 11.0795C10.8685 11.2905 10.75 11.5766 10.75 11.875C10.75 12.1734 10.8685 12.4595 11.0795 12.6705C11.2905 12.8815 11.5766 13 11.875 13ZM21.3032 9.63625L22.3638 10.6967L10.6975 22.3638L9.637 21.3032L21.3025 9.63625H21.3032Z" fill="#525866"/></svg>`,
                    bgColor: "#F2F5F8"
                }
            ];
        },
        formatPaymentStatsCards() {
            const stats = this.reports.form_stats || {};
            return [
                {
                    key: "total_payments",
                    title: "Total Paid",
                    value: (stats.total_payments?.currency_symbol || '') + (stats.total_payments?.value || ''),
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M20.5 12.25H22.75C22.9489 12.25 23.1397 12.329 23.2803 12.4697C23.421 12.6103 23.5 12.8011 23.5 13V22C23.5 22.1989 23.421 22.3897 23.2803 22.5303C23.1397 22.671 22.9489 22.75 22.75 22.75H9.25C9.05109 22.75 8.86032 22.671 8.71967 22.5303C8.57902 22.3897 8.5 22.1989 8.5 22V10C8.5 9.80109 8.57902 9.61032 8.71967 9.46967C8.86032 9.32902 9.05109 9.25 9.25 9.25H20.5V12.25ZM10 13.75V21.25H22V13.75H10ZM10 10.75V12.25H19V10.75H10ZM18.25 16.75H20.5V18.25H18.25V16.75Z" fill="#525866"/></svg>`,
                },
                {
                    key: 'pending_payments',
                    title: 'Total Pending',
                    value: (stats.pending_payments?.currency_symbol || '') + (stats.pending_payments?.value || ''),
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M12.25 11H11V9.75H21V11H19.75V12.25C19.75 13.2596 19.2399 14.0717 18.5976 14.7354C18.1582 15.1894 17.6237 15.6075 17.0818 16C17.6237 16.3925 18.1582 16.8106 18.5976 17.2646C19.2399 17.9283 19.75 18.7404 19.75 19.75V21H21V22.25H11V21H12.25V19.75C12.25 18.7404 12.7601 17.9283 13.4024 17.2646C13.8418 16.8106 14.3763 16.3925 14.9182 16C14.3763 15.6075 13.8418 15.1894 13.4024 14.7354C12.7601 14.0717 12.25 13.2596 12.25 12.25V11ZM13.5 11V12.25C13.5 12.8029 13.7712 13.3189 14.3007 13.8661C14.755 14.3356 15.3467 14.7749 16 15.2363C16.6533 14.7749 17.245 14.3356 17.6993 13.8661C18.2289 13.3189 18.5 12.8029 18.5 12.25V11H13.5ZM16 16.7637C15.3467 17.2251 14.755 17.6644 14.3007 18.1339C13.7712 18.6811 13.5 19.1971 13.5 19.75V21H18.5V19.75C18.5 19.1971 18.2289 18.6811 17.6993 18.1339C17.245 17.6644 16.6533 17.2251 16 16.7637Z" fill="#525866"/></svg>`,
                },
                {
                    key: "total_refunds",
                    title: "Total Refunded",
                    value: (stats.total_refunds?.currency_symbol || '') + (stats.total_refunds?.value || ''),
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M21.5313 18.3264C22.0179 17.1701 22.1299 15.8904 21.8516 14.6672C21.5732 13.4439 20.9185 12.3387 19.9795 11.5068C19.0404 10.675 17.8643 10.1583 16.6164 10.0296C15.3685 9.90078 14.1117 10.1663 13.0225 10.7889L12.2785 9.48613C13.4168 8.8356 14.7057 8.49491 16.0167 8.49807C17.3277 8.50123 18.615 8.84812 19.75 9.50413C23.1175 11.4481 24.4075 15.6106 22.8378 19.0816L23.8443 19.6621L20.7205 21.3226L20.5968 17.7871L21.5313 18.3264ZM10.4688 13.6719C9.98214 14.8282 9.87012 16.1079 10.1485 17.3311C10.4268 18.5543 11.0815 19.6596 12.0206 20.4914C12.9596 21.3233 14.1358 21.8399 15.3837 21.9687C16.6315 22.0975 17.8884 21.8319 18.9775 21.2094L19.7215 22.5121C18.5833 23.1627 17.2944 23.5034 15.9834 23.5002C14.6724 23.497 13.3851 23.1502 12.25 22.4941C8.88253 20.5501 7.59253 16.3876 9.16228 12.9166L8.15503 12.3369L11.2788 10.6764L11.4025 14.2119L10.468 13.6726L10.4688 13.6719ZM13.375 17.4991H17.5C17.5995 17.4991 17.6949 17.4596 17.7652 17.3893C17.8355 17.319 17.875 17.2236 17.875 17.1241C17.875 17.0247 17.8355 16.9293 17.7652 16.859C17.6949 16.7886 17.5995 16.7491 17.5 16.7491H14.5C14.0027 16.7491 13.5258 16.5516 13.1742 16.2C12.8226 15.8483 12.625 15.3714 12.625 14.8741C12.625 14.3769 12.8226 13.8999 13.1742 13.5483C13.5258 13.1967 14.0027 12.9991 14.5 12.9991H15.25V12.2491H16.75V12.9991H18.625V14.4991H14.5C14.4006 14.4991 14.3052 14.5386 14.2349 14.609C14.1645 14.6793 14.125 14.7747 14.125 14.8741C14.125 14.9736 14.1645 15.069 14.2349 15.1393C14.3052 15.2096 14.4006 15.2491 14.5 15.2491H17.5C17.9973 15.2491 18.4742 15.4467 18.8259 15.7983C19.1775 16.1499 19.375 16.6269 19.375 17.1241C19.375 17.6214 19.1775 18.0983 18.8259 18.45C18.4742 18.8016 17.9973 18.9991 17.5 18.9991H16.75V19.7491H15.25V18.9991H13.375V17.4991Z" fill="#525866"/></svg>`,
                },
                {
                    key: "total_revenue",
                    title: "Total Revenue",
                    value:  (stats.total_revenue?.currency_symbol || '') + (stats.total_revenue?.value || ''),
                    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 8C0 3.58172 3.58172 0 8 0H24C28.4183 0 32 3.58172 32 8V24C32 28.4183 28.4183 32 24 32H8C3.58172 32 0 28.4183 0 24V8Z" fill="#F2F5F8"/><path d="M10.75 9.25V21.25H22.75V22.75H9.25V9.25H10.75ZM22.2197 11.7198L23.2803 12.7802L19 17.0605L16.75 14.8112L13.5302 18.0302L12.4698 16.9698L16.75 12.6895L19 14.9388L22.2197 11.7198Z" fill="#525866"/></svg>`,
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
        paymentCurrency() {
            const stats = this.reports.form_stats || {};
            if (stats.total_payments && stats.total_payments.currency_symbol) {
                return stats.total_payments.currency_symbol;
            }
            return "$"; // Default fallback
        }
    },
    methods: {
        fetchReports() {
            this.loading = true;

            const data = {
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                view: this.chartMode,
                stats_range: this.globalDateParams.statsRange,
                form_id: this.globalDateParams.formId
            };
            const url = FluentFormsGlobal.$rest.route("report");
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
            const url = FluentFormsGlobal.$rest.route("selectFormsForReport");
            FluentFormsGlobal.$rest.get(url)
                .then(response => {
                    if (response.forms) {
                        this.formsList = response.forms;
                    }
                })
                .catch(error => {
                    console.error("Error fetching forms list:", error);
                });
        },

        handleDateRangeChange(range) {
            this.lastUsedSelector = "datepicker";
            this.dateRange = range;
            this.selectedRange = null;
            this.updateGlobalDateParams();
        },

        handleViewChange(view) {
            this.chartMode = view;
        },

        handleFormChange(formId) {
            this.selectedOverviewFormId = formId;

            const data = {
                component: "overview_chart",
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                form_id: formId
            };

            const url = FluentFormsGlobal.$rest.route("report");
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    if (response.reports && response.reports.overview_chart) {
                        this.reports.overview_chart = response.reports.overview_chart;
                    }
                    if (response.reports && response.reports.revenue_chart) {
                        this.reports.revenue_chart = response.reports.revenue_chart;
                    }
                })
                .catch(error => {
                    console.error("Error fetching overview chart data:", error);
                })
                .finally(() => {
                });
        },

        handleGaugeFormChange(formId) {
            this.selectedGaugeFormId = formId;
            this.gaugeLoading = true;

            const data = {
                component: "completion_rate",
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                form_id: formId
            };

            const url = FluentFormsGlobal.$rest.route("report");
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    if (response && response.reports && response.reports.completion_rate) {
                        this.reports.completion_rate = response.reports.completion_rate;
                    }
                })
                .catch(error => {
                    console.error("Error fetching completion rates data:", error);
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
                component: "transactions",
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                transactions_form_id: params.formId,
                transactions_payment_status: params.paymentStatus,
                transactions_payment_method: params.paymentMethod
            };
            const url = FluentFormsGlobal.$rest.route("report");
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    if (response && response.reports && response.reports.transactions) {
                        this.reports.transactions = response.reports.transactions;
                    }
                })
                .catch(error => {
                    console.error("Error fetching transactions data:", error);
                })
                .finally(() => {
                    this.transactionsLoading = false;
                });
        },

        handleSubscriptionFilterChange(params) {
            this.subscriptionsLoading = true;

            const data = {
                component: "subscriptions",
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                subscriptions_status: params.status,
                subscriptions_interval: params.interval,
                subscriptions_form_id: params.formId
            };
            const url = FluentFormsGlobal.$rest.route("report");
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    if (response && response.reports && response.reports.subscriptions) {
                        this.reports.subscriptions = response.reports.subscriptions;
                    }
                })
                .catch(error => {
                    console.error("Error fetching subscription data:", error);
                })
                .finally(() => {
                    this.subscriptionsLoading = false;
                });
        },

        handleCountryHeatmapFormChange(formId) {
            this.selectedCountryHeatmapFormId = formId;
            this.countryHeatmapLoading = true;

            const data = {
                component: "country_heatmap",
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                form_id: formId
            };
            const url = FluentFormsGlobal.$rest.route("report");
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    if (response && response.reports && response.reports.country_heatmap) {
                        this.reports.country_heatmap = response.reports.country_heatmap;
                    }
                })
                .catch(error => {
                    console.error("Error fetching completion rates data:", error);
                })
                .finally(() => {
                    this.gaugeLoading = false;
                });
        },

        updateGlobalDateParams() {
            const today = new Date();
            let startDate, endDate;

            if (this.lastUsedSelector === "range" || !this.dateRange) {
                let firstDay = new Date(today);
                const rangeMap = {
                    today: 0,
                    yesterday: 1,
                    week: 6,
                    month: 30,
                    "3_months": 90,
                    "6_months": 180,
                    year: 365,
                };
                if (this.selectedRange in rangeMap) {
                    firstDay.setDate(today.getDate() - rangeMap[this.selectedRange]);
                    if (this.selectedRange === "yesterday") {
                        today.setDate(today.getDate() - 1);
                    }
                }
                startDate = this.formatDateForApi(firstDay, true);
                endDate = this.formatDateForApi(today, false);
                this.dateRange = [
                    this.formatDateForDisplay(new Date(startDate)),
                    this.formatDateForDisplay(new Date(endDate))
                ];
            } else if (this.lastUsedSelector === "datepicker" && this.dateRange && this.dateRange.length === 2) {
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
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const time = isStart ? "00:00:00" : "23:59:59";
            return `${ year }-${ month }-${ day } ${ time }`;
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
                component: "top_performing_forms",
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                metric: metric
            };
            const url = FluentFormsGlobal.$rest.route("report");
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    if (response && response.reports && response.reports.top_performing_forms) {
                        this.reports.top_performing_forms = response.reports.top_performing_forms;
                    }
                })
                .catch(error => {
                    console.error("Error fetching top performing forms data:", error);
                })
                .finally(() => {
                    this.topFormsLoading = false;
                });
        },
        // Method to handle range select dropdown change
        handleRangeSelect(range) {
            this.lastUsedSelector = "range";
            this.selectedRange = range;
            this.updateGlobalDateParams();
        },
        formatDateForDisplay(date) {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return `${ months[date.getMonth()] } ${ date.getDate() }, ${ date.getFullYear() }`;
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



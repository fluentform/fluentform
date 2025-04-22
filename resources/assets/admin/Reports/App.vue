<template>
        <div class="fluentform-reports">
        <el-row :gutter="24">
            <el-col class="report-content" :span="16">
                <overview-chart
                    :overview_chart="reports.overview_chart"
                    :forms_list="formsList"
                    @date-change="handleDateChange"
                />
            </el-col>
            <el-col class="report-content" :span="8">
                <form-stats
                    :form_stats="reports.form_stats"
                    @stats-range-change="handleStatsRangeChange"
                />
            </el-col>
        </el-row>
        <el-row class="mt-4">
            <el-col class="report-content" :span="24">
                <submission-heatmap
                    :heatmap_data="reports.heatmap_data"
                    @heatmap-date-change="handleHeatmapDateChange"
                />
            </el-col>
        </el-row>
        <el-row class="mt-4">
            <el-col class="report-content" :span="24">
                <api-logs-chart
                    :api_logs="reports.api_logs"
                    @api-logs-date-change="handleApiLogsDateChange"
                />
            </el-col>
        </el-row>
        <el-row class="mt-4">
            <el-col v-if="hasPayment" class="report-content" :span="24">
                <transactions-table
                    :transactions="reports.transactions"
                    :forms_list="formsList"
                    @transactions-filter-change="handleTransactionsFilterChange"
                />
            </el-col>
        </el-row>
    </div>
</template>
<script type="text/babel">
import OverviewChart from './Components/OverviewChart/OverviewChart.vue';
import FormStats from './Components/FormStats/FormStats.vue';
import SubmissionHeatmap from "@/admin/Reports/Components/SubmissionHeatmap/SubmissionHeatmap.vue";
import ApiLogsChart from './Components/ApiLogsChart/ApiLogsChart.vue';
import TransactionsTable from './Components/TransactionsTable/TransactionsTable.vue';

export default {
    name: 'Reports',
    components: {
        ApiLogsChart,
        SubmissionHeatmap,
        OverviewChart,
        FormStats,
        TransactionsTable
    },
    data() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);

        const formatDateForApi = (date, isStart) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const time = isStart ? '00:00:00' : '23:59:59';
            return `${year}-${month}-${day} ${time}`;
        };
        
        return {
            loading: false,
            reports: {},
            formsList: [],
            dateParams: {
                startDate: formatDateForApi(thirtyDaysAgo, true),
                endDate: formatDateForApi(now, false),
                view: 'submission',
                statsRange: 'month'
            },
            heatmapParams: {
                startDate: formatDateForApi(sevenDaysAgo, true),
                endDate: formatDateForApi(now, false),
            },
            apiLogsParams: {
                startDate: formatDateForApi(thirtyDaysAgo, true),
                endDate: formatDateForApi(now, false)
            },
            transactionsParams: {
                startDate: formatDateForApi(thirtyDaysAgo, true),
                endDate: formatDateForApi(now, false)
            }
        }
    },
    computed: {
        hasPayment() {
            return !!window.FluentFormApp.has_payment;
        }
    },
    methods: {
        fetchReports() {
            this.loading = true;

            let data = {
                action: 'fluentform-get-reports',
                start_date: this.dateParams.startDate,
                end_date: this.dateParams.endDate,
                view: this.dateParams.view,
                stats_range: this.dateParams.statsRange,
                heatmap_start_date: this.heatmapParams.startDate,
                heatmap_end_date: this.heatmapParams.endDate,
                api_logs_start_date: this.apiLogsParams.startDate,
                api_logs_end_date: this.apiLogsParams.endDate,
                transactions_start_date: this.transactionsParams.startDate,
                transactions_end_date: this.transactionsParams.endDate,
                transactions_form_id: this.transactionsParams.formId,
                transactions_payment_status: this.transactionsParams.paymentStatus,
                transactions_payment_method: this.transactionsParams.paymentMethod,
                form_id: this.dateParams.formId,
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
                .catch(error => {
                    console.error('Error fetching forms list:', error);
                });
        },

        handleDateChange(params) {
            this.dateParams = {
                startDate: params.startDate,
                endDate: params.endDate,
                view: params.view,
                formId: params.formId
            };

            this.fetchReports();
        },

        handleStatsRangeChange(range) {
            this.dateParams.statsRange = range;
            this.fetchReports();
        },

        handleHeatmapDateChange(params) {
            this.heatmapParams = {
                startDate: params.startDate,
                endDate: params.endDate
            };

            this.fetchReports();
        },

        handleApiLogsDateChange(params) {
            this.apiLogsParams = {
                startDate: params.startDate,
                endDate: params.endDate
            };

            this.fetchReports();
        },

        handleTransactionsFilterChange(params) {
            this.transactionsParams = {
                startDate: params.startDate,
                endDate: params.endDate,
                formId: params.formId,
                paymentStatus: params.paymentStatus,
                paymentMethod: params.paymentMethod
            };

            this.fetchReports();
        }
    },
    mounted() {
        this.fetchReports();
        this.fetchFormsList();
    }
};
</script>



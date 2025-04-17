<template>
    <div class="ff_reports">
        <el-row :gutter="24">
            <el-col class="report-content" :span="16">
                <overview-chart
                    :overview_chart="reports.overview_chart"
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
                <entries-heatmap
                    :heatmap_data="reports.heatmap_data"
                    @heatmap-date-change="handleHeatmapDateChange"
                />
            </el-col>
        </el-row>
        <el-row class="mt-4">
            <el-col class="report-content" :span="24">
                <api-logs-chart />
            </el-col>
        </el-row>
        <el-row class="mt-4">
            <el-col class="report-content" :span="24">
                <transactions-table />
            </el-col>
        </el-row>
    </div>
</template>
<script type="text/babel">
import OverviewChart from './Components/OverviewChart/OverviewChart.vue';
import FormStats from './Components/FormStats/FormStats.vue';
import EntriesHeatmap from "./Components/EntriesHeatmap/EntriesHeatmap.vue";
import ApiLogsChart from './Components/ApiLogsChart/ApiLogsChart.vue';
import TransactionsTable from './Components/TransactionsTable/TransactionsTable.vue';

export default {
    name: 'Reports',
    props: ['settings'],
    components: {
        ApiLogsChart,
        EntriesHeatmap,
        OverviewChart,
        FormStats,
        TransactionsTable
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
        
        return {
            loading: false,
            reports: {},
            dateParams: {
                startDate: formatDateForApi(thirtyDaysAgo, true),
                endDate: formatDateForApi(now, false),
                view: 'entries',
                statsRange: 'month'
            },
            heatmapParams: {
                startDate: null,
                endDate: null
            }
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
                heatmap_end_date: this.heatmapParams.endDate
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

        handleDateChange(params) {
            this.dateParams = {
                startDate: params.startDate,
                endDate: params.endDate,
                view: params.view,
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
        }
    },
    mounted() {
        this.fetchReports();
    }
};
</script>
<style scoped>
</style>



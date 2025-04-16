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
                <form-stats />
            </el-col>
        </el-row>
        <el-row class="mt-4">
            <el-col class="report-content" :span="24">
                <entries-heatmap />
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
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Format dates for API
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
                startDate: formatDateForApi(firstDayOfMonth, true),
                endDate: formatDateForApi(lastDayOfMonth, false),
                view: 'entries'
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
                view: this.dateParams.view
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
                view: params.view
            };

            this.fetchReports();
        }
    },
};
</script>
<style scoped>
</style>



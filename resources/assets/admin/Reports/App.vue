<template>
    <div class="ff_reports">
        <el-row :gutter="24">
            <el-col class="report-content" :span="16">
                <conversion-chart />
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
import ConversionChart from './Components/ConversionChart/ConversionChart.vue';
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
        ConversionChart,
        FormStats,
        TransactionsTable
    },
    data() {
        return {
            loading: false,
            chartData: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May"],
                datasets: [
                    {
                        label: "Success",
                        borderColor: "green",
                        data: [100, 150, 200, 250, 300],
                        fill: false,
                    },
                    {
                        label: "Processing",
                        borderColor: "blue",
                        data: [50, 100, 120, 180, 200],
                        fill: false,
                    },
                    {
                        label: "Failed",
                        borderColor: "red",
                        data: [10, 30, 50, 80, 100],
                        fill: false,
                    },
                ],
            },
        }
    },
    methods: {

    },
    mounted() {

    }
};
</script>
<style scoped>
</style>



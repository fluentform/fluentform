<template>
    <div>
        <submission-chart v-if="Object.entries(data).length > 0" :chart-data="chartData" :maxCumulativeValue="maxCumulativeValue"></submission-chart>
        <div v-else class="demo-graph">
            <img :src="demoGraph">
            <span>{{$t('Nothing to show yet')}}</span>
        </div>

    </div>
</template>

<script type="text/babel">
    import SubmissionChart from '../AllEntries/Components/_chart'
    import each from 'lodash/each';

    export default {
        name: 'EntriesChart',
        components: {
            SubmissionChart
        },
        props: ['data'],
        data() {
            return {
                chartData: {},
                maxCumulativeValue: 0,
                stats: {},
                demoGraph: window.FluentFormDashboard.demo_graph_bar_url
            }
        },

        methods: {
            setupChartItems() {
                const labels = [];
                const ItemValues = {
                    label: 'Submission Count',
                    yAxisID: 'byDate',
                    backgroundColor: 'rgba(31, 160, 255, 1)',
                    data: [],
                };

                let currentTotal = 0;
                each(this.data, (count, label) => {
                    ItemValues.data.push(count);
                    labels.push(label);
                    currentTotal += parseInt(count);
                });
                this.maxCumulativeValue = currentTotal + 10;
                this.chartData = {
                    labels: labels,
                    datasets: [ItemValues]
                }
            }
        },
        mounted() {
            this.setupChartItems();
        }
    }
</script>

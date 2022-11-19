<template>
    <div>
        <submission-chart v-if="Object.entries(data).length > 0" :key="refreshToggle" :chartData="chartData" :options="options"></submission-chart>
        <div v-else class="demo-graph">
            <img :src="demoGraph">
            <span>{{ $t('Nothing to show yet') }}</span>
        </div>

    </div>
</template>

<script type="text/babel">
    import SubmissionChart from './_LineChart'
    import each from 'lodash/each';

    export default {
        name: 'EntriesChart',
        components: {
            SubmissionChart
        },
        props: ['data'],
        data() {
            return {
                refreshToggle: false,
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                // stepSize: 1
                            }
                        }]
                    }
                },
                chartData: {},
                demoGraph: window.FluentFormDashboard.demo_graph_bar_url
            }
        },

        methods: {
            setupChartItems() {
                const labels = [];
                const ItemValues = {
                    label: 'Submissions',
                    borderColor: "rgb(31 160 255/30%)",
                    pointBackgroundColor: "#1fa0ff",
                    backgroundColor: 'rgb(31 160 255)',
                    fill: false,
                    data: []
                }
                let currentTotal = 0;

                each(this.data, (count, label) => {
                    ItemValues.data.push(count);
                    labels.push(label);
                    currentTotal += parseInt(count);
                });

                this.chartData = {
                    labels: labels,
                    datasets: [ItemValues]
                }
                this.refreshToggle = !this.refreshToggle

            }
        },
        mounted() {
            this.setupChartItems();
        }
    }
</script>

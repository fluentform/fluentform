<template>
    <div class="">
        <div class="dashboard-card-info chart-card">
            <div class="dashboard-card-content" v-if="Object.entries(data).length > 0">
                <submission-chart height="300px" :key="refreshToggle" :chartData="chartData" :options="options"></submission-chart>
            </div>
            <div v-else class="demo-graph">
                <img style="width: 100%" :src="demoGraph">
                <span>{{ $t('Nothing to show yet') }}</span>
            </div>
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
        props: ['data', 'submission_type'],
        data() {
            return {
                refreshToggle: false,
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true,
                                autoSkip: true,
                            },
                        }],
                        xAxes: [{
                            ticks: {
                                beginAtZero: true,
                                autoSkip: true,
                            },
                            gridLines: {
                                display: false
                            }
                        }],
                    },
                },
                chartData: {},
                total: 0,
                demoGraph: window.FluentFormDashboard.demo_graph_bar_url
            }
        },

        methods: {
            setupChartItems() {
                const labels = [];
                const ItemValues = {
                    label: this.ucFirst(this.submission_type),
                    borderColor: "rgb(31 160 255/30%)",
                    pointBackgroundColor: "#1fa0ff",
                    backgroundColor: 'rgb(31 160 255/50%)',
                    pointRadius: 0,
                    fill: false,
                    data: [],
                    tension: 0.2
                }
                let currentMax = 0;

                each(this.data, (count, label) => {
                    ItemValues.data.push(count);
                    labels.push(label);
                    if (parseInt(count) > currentMax) {
                        currentMax = parseInt(count);
                    }
                });
                this.options.scales.yAxes[0].ticks.suggestedMax = currentMax + 2;
                this.chartData = {
                    labels: labels,
                    datasets: [ItemValues]
                }
                this.refreshToggle = !this.refreshToggle

            },
            ucFirst(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
        },
        mounted() {
            this.setupChartItems();
        }
    }
</script>

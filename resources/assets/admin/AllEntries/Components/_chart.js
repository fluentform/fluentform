import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

export default {
    name: 'SubscriberChart',
    components: { Bar },
    props: ['chartData', 'maxCumulativeValue'],
    data() {
        return {
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 0.6,
                height: 600,
                plugins: {
                    legend: {
                        display: false,
                        labels: {
                            color: '#353537',
                            boxWidth: 16,
                            font: {
                                size: 14
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        id: 'byDate',
                        display: false,
                        grid: {
                            color: '#eee',
                            drawOnChartArea: true,
                            drawBorder: false
                        },
                        ticks: {
                            beginAtZero: true,
                            callback: function(label, index, labels) {
                                if (Math.floor(label) === label) {
                                    return label;
                                }
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: '#eee',
                            drawOnChartArea: true,
                            drawBorder: false
                        },
                        ticks: {
                            autoSkip: true,
                            minRotation: 45,
                            beginAtZero: true,
                            maxTicksLimit: 15
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 10
                    }
                }
            }
        }
    },
    methods: {
        updateChart() {
            this.$refs.chart.updateChart()
        }
    },
    watch: {
        chartData: {
            handler() {
                this.$nextTick(() => {
                    this.updateChart()
                })
            },
            deep: true
        }
    },
    template: `
        <Bar
            :data="chartData"
            :options="options"
            ref="chart"
        />
    `
}
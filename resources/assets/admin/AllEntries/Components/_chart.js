import {Bar, mixins} from 'vue-chartjs'

const {reactiveProp} = mixins;

export default {
    extends: Bar,
    mixins: [reactiveProp],
    props: ['maxCumulativeValue'],
    data() {
        return {
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    yAxes: [
                        {
                            id: 'byDate',
                            type: 'linear',
                            position: 'left',
                            gridLines: {
                                drawOnChartArea: true
                            },
                            ticks: {
                                beginAtZero: true
                            }
                        }
                    ],
                    xAxes: [
                        {
                            gridLines: {
                                drawOnChartArea: true
                            },
                            ticks: {
                                beginAtZero: true
                            }
                        }
                    ]
                },
                drawBorder: false,
                layout: {
                    padding: {
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 20
                    }
                }
            }
        }
    },
    methods: {},
    mounted() {
        // this.chartData is created in the mixin.
        // If you want to pass options please create a local options object
        this.renderChart(this.chartData, this.options)
    }
}

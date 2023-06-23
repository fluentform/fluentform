const Bar = window.VueChartJs.Bar;
const mixins = window.VueChartJs.mixins;

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
                legend: {
                    display: false,
                    labels: {
                        fontColor: '#353537',
                        boxWidth: 16,
                        fontSize: 14
                    }
                },
                scales: {
                    yAxes: [
                        {
                            id: 'byDate',
                            type: 'linear',
                            position: 'left',
                            gridLines: {
                                color: '#eee',
                                drawOnChartArea: true,
                                zeroLineColor: '#eee'
                            },
                            ticks: {
                                beginAtZero: true,
                                userCallback: function(label, index, labels) {
                                    // when the floored value is the same as the value we have a whole number
                                    if (Math.floor(label) === label) {
                                        return label;
                                    }
                                }
                            }
                        }
                    ],
                    xAxes: [
                        {
                            gridLines: {
                                color: '#eee',
                                drawOnChartArea: true,
                                zeroLineColor: '#eee'
                            },
                            ticks: {
                                beginAtZero: true,
                                autoSkip: true,
                                maxTicksLimit: 10
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

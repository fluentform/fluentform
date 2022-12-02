
const Line = window.VueChartJs.Line;

export default {
    extends: Line,
    props: {
        chartData: {
            type: Object,
            default: null
        },
        options: {
            type: Object,
            default: null
        },
        height : {
            type: String,
            default: '300px'
        }
    },
    mounted () {
        this.renderChart(this.chartData, this.options)
    }

}

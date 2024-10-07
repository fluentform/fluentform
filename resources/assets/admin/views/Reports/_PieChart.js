import { Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, CategoryScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale);

export default {
    name: 'PieChart',
    components: { Pie },
    props: {
        chartData: {
            type: Object,
            required: true
        },
        options: {
            type: Object,
            default: () => ({})
        }
    },
    methods: {
        renderChart() {
            this.$refs.chart.updateChart();
        }
    },
    mounted() {
        this.renderChart();
    },
    watch: {
        chartData: {
            handler() {
                this.renderChart();
            },
            deep: true
        },
        options: {
            handler() {
                this.renderChart();
            },
            deep: true
        }
    },
    template: '<Pie ref="chart" :data="chartData" :options="options" />'
};
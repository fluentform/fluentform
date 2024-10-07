import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

export default {
    name: 'HorizontalBarChart',
    components: { Bar },
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
    computed: {
        chartOptions() {
            return {
                ...this.options,
                indexAxis: 'y'
            };
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
    template: '<Bar ref="chart" :data="chartData" :options="chartOptions" />'
};
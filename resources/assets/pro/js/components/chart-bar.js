const Bar = window.VueChartJs.Bar;

export default {
    name: 'barChart',
    extends: Bar,
    props: ['data', 'options'],
    mounted () {
        // this.renderChart(this.data, this.options);
    },
    watch: {
        'data.labels'() {
            this.renderChart(this.data, this.options);
        }
    }
};

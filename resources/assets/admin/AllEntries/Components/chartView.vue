<template>
    <div v-loading="loading" class="entriest_chart_wrapper">
        <subscriber-chart
            v-if="show_stats"
            :chart-data="chartData"
            :maxCumulativeValue="maxCumulativeValue">
        </subscriber-chart>
    </div>
</template>

<script type="text/babel">
import SubscriberChart from './_chart'
import each from 'lodash/each';

export default {
    name: 'EntriesChart',
    components: {
        SubscriberChart
    },
    props: ['form_id', 'date_range'],
    data() {
        return {
            loading: true,
            chartData: {},
            maxCumulativeValue: 0,
            stats: {},
            show_stats: false
        }
    },
    watch: {
        date_range() {
            this.fetchData();
        },
        form_id() {
            this.fetchData();
        }
    },
    methods: {
        fetchData() {
            this.loading = true;
            const url = FluentFormsGlobal.$rest.route('getReports');
            const data = {
                form_id: this.form_id,
                date_range: this.date_range
            };

            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    this.stats = response;
                    this.setupChartItems();
                })
                .catch(error => {
                    this.$fail(error.message);
                })
                .finally(() => {
                    this.loading = false;
                    this.show_stats = true;
                });
        },
        setupChartItems() {
            const labels = [];
            const ItemValues = {
                label: 'Submission Count',
                yAxisID: 'byDate',
                backgroundColor: 'rgba(81, 52, 178, 0.5)',
                borderColor: '#b175eb',
                data: [],
                fill: false,
                gridLines: {
                    display: false
                }
            };

            let currentTotal = 0;
            each(this.stats, (count, label) => {
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
        this.fetchData();
    }
}
</script>

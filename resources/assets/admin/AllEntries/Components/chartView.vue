<template>
    <div v-loading="loading" class="entriest_chart_wrapper">
        <subscriber-chart :chart-data="chartData" :maxCumulativeValue="maxCumulativeValue"></subscriber-chart>
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
        props: ['form_id'],
        data() {
            return {
                loading: true,
                chartData: {},
                maxCumulativeValue: 0,
                stats: {
                    'January' : 20,
                    'February': 30
                }
            }
        },
        methods: {
            fetchData() {
                this.loading = true;

                FluentFormsGlobal.$get({
                    action: 'fluentform_get_all_entries_report',
                    form_id: this.form_id
                })
                    .then(response => {
                        this.stats = response.data.stats;
                        this.setupChartItems();
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(() => {
                        this.loading = false;
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

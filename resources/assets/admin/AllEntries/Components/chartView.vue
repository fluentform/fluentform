<template>
    <div v-loading="loading" class="ff_card">
        <subscriber-chart v-if="show_stats" :chart-data="chartData" :maxCumulativeValue="maxCumulativeValue"></subscriber-chart>
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
            }
        },
        methods: {
            fetchData() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_all_entries_report',
                    form_id: this.form_id,
                    date_range: this.date_range
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
                    this.show_stats = true;
                });
            },
            setupChartItems() {
                const labels = [];
                const ItemValues = {
                    label: 'Submission Count',
                    yAxisID: 'byDate',
                    backgroundColor: '#1a7efb',
                    borderColor: '#1a7efb',
                     borderRadius: 20, // This will round the corners
                    borderSkipped: false, // To make all side rounded
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

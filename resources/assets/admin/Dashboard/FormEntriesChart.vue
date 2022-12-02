<template>
    <div>
        <div class="ff_card_body">
            <pie-chart  v-if="Object.entries(chartData).length > 0" :chartdata="data" :options="chartOptions"></pie-chart>

            <div v-else class="demo-graph">
                <img :src="demoGraph">
                <span>{{ $t('Nothing to show yet') }}</span>
            </div>
        </div>
    </div>
</template>

<script>
    import PieChart from '../views/Reports/_PieChart';
    import each from "lodash/each";

    export default {
        name: 'FormEntriesChart',
        components: {
            PieChart
        },
        props: {
            chartData: {},
        },
        data() {
            return {
                demoGraph: window.FluentFormDashboard.demo_graph_pie_url,
                chartOptions: {
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: function (evt, array) {
                        if (array.length != 0) {
                            let position = array[0]._index;
                            let formName = this.tooltip._data.labels[position];
                            let formId = formName.split('#').pop()
                            let redirectUrl = window.FluentFormDashboard.form_edit_link_base + '&form_id=' + formId;
                            window.location.href = redirectUrl;
                        }
                    },
                    onHover: (event, chartElement) => {
                        event.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                    },
                    title: {
                        display: true,
                        text: this.$t('Entries Per Form')
                    },


                }
            }
        },
        computed: {
            data() {
                const labels = [];
                const ItemValues = {
                    label: 'Entries OverView',
                    backgroundColor: [],
                    borderColor: '#ffffff',
                    data: [],
                    hoverOffset: 5,

                };

                let currentTotal = 0;
                let dataLength = 0;
                each(this.chartData, (count, label) => {
                    ItemValues.data.push(parseInt(count));
                    ItemValues.backgroundColor.push(this.getColors(dataLength, 'normal'));
                    labels.push(label);
                    currentTotal += parseInt(count);
                    dataLength++;
                });
                this.maxCumulativeValue = currentTotal + 10;
                return {
                    labels: labels,
                    datasets: [ItemValues],
                }
            }
        },
        methods: {
            getColors(times, type) {
                let colors = [
                    'rgb(72 115 208/70%)',
                    'rgb(71 140 255/70%)',
                    'rgb(81 160 255/70%)',
                    'rgb(91 260 255/70%)',
                    'rgb(11 160 255/70%)',
                    'rgb(91 180 255/70%)',
                    'rgb(21 260 255/70%)',
                    'rgb(61 240 255/70%)',
                    'rgb(51 110 255/70%)',
                    'rgb(41 110 255/70%)',

                ];
                return colors[Math.floor(Math.random() * colors.length)];
            }

        }
    }
</script>

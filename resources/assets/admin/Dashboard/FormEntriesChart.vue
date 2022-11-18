<template>
    <div>
        <div class="card_header">
            <h6> {{ $t('Submissions Per Form') }}</h6>
        </div>
        <div class="ff_card_body">
            <pie-chart v-if="Object.entries(chartData).length > 0" :chartdata="data" :options="chartOptions"></pie-chart>
            <div v-else class="demo-graph">
                <img class="ff-blur" :src="demoGraph">
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
                    }

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
                    hoverOffset: 5
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
                    '#ff6384',
                    '#a32f80',
                    '#ffcd56',
                    '#B6583B',
                    '#590d82',
                    '#d4a5a5',
                    '#5F5771',
                    '#f38181',
                    '#1f5f8b',
                    '#de95ba',
                    '#086972',
                    '#3f9eff'
                ];
                return colors[Math.floor(Math.random() * colors.length)];
            }

        }
    }
</script>

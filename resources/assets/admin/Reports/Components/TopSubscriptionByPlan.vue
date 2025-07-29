<template>
    <card>
        <card-head>
            <h3>{{ $t('Subscription') }}</h3>
        </card-head>

        <card-body>
            <div class="subscription-amount" v-if="hasSubscriptionData">
                <p>{{ $t('Recurring') }}</p>
                <div class="subscription-total">
                    <span class="total-amount">{{ getCurrencySymbol() }}{{ formatNumber(totalAmount) }}</span>
                    <span
                        class="growth-indicator"
                        :class="{ 'positive': growthPercentage > 0, 'negative': growthPercentage < 0 }"
                    >
                        <svg v-if="growthPercentage > 0" width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6668 1.66602L9.42108 6.91177C9.15707 7.17578 9.02506 7.30779 8.87284 7.35725C8.73895 7.40075 8.59471 7.40075 8.46082 7.35725C8.3086 7.30779 8.17659 7.17578 7.91258 6.91177L6.08774 5.08693C5.82373 4.82292 5.69173 4.69091 5.53951 4.64145C5.40561 4.59795 5.26138 4.59795 5.12748 4.64145C4.97527 4.69091 4.84326 4.82292 4.57925 5.08693L1.3335 8.33268M14.6668 1.66602H10.0002M14.6668 1.66602V6.33268" stroke="#23A682" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <svg v-else width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6668 1.66602L9.42108 6.91177C9.15707 7.17578 9.02506 7.30779 8.87284 7.35725C8.73895 7.40075 8.59471 7.40075 8.46082 7.35725C8.3086 7.30779 8.17659 7.17578 7.91258 6.91177L6.08774 5.08693C5.82373 4.82292 5.69173 4.69091 5.53951 4.64145C5.40561 4.59795 5.26138 4.59795 5.12748 4.64145C4.97527 4.69091 4.84326 4.82292 4.57925 5.08693L1.3335 8.33268M14.6668 1.66602H10.0002M14.6668 1.66602V6.33268" stroke="red" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <span>{{ Math.abs(growthPercentage) }}%</span>
                    </span>
                </div>
            </div>

            <div class="subscription-chart">
                <div v-if="isLoading" class="loading-chart">
                    <i class="el-icon-loading "></i>
                    <span>{{ $t('Loading subscription data...') }}</span>
                </div>
                <div v-else-if="!hasSubscriptionData" class="no-data">
                    <i class="el-icon-data-analysis  no-data-icon"></i>
                    <span>{{ $t('No subscription data available for the selected period') }}</span>
                </div>
                <v-chart
                    v-else
                    ref="chart"
                    :option="chartOptions"
                    style="height: 256px;"
                    autoresize
                />
            </div>
        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'TopSubscriptionByPlan',
    components: {
        Card,
        CardBody,
        CardHead
    },
    emits: ['subscription-filter-change'],
    props: {
        subscriptionData: {
            type: Object,
            default: () => ({})
        },
        formsList: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            selectedStatus: 'all',
            selectedInterval: 'all',
            selectedFormId: null,
            isLoading: false,
        };
    },
    computed: {
        hasSubscriptionData() {
            return this.subscriptionData &&
                this.subscriptionData.chart_data &&
                this.subscriptionData.chart_data.length > 0;
        },

        totalAmount() {
            return this.subscriptionData && this.subscriptionData.total_recurring !== undefined
                ? this.subscriptionData.total_recurring
                : 0;
        },

        growthPercentage() {
            return this.subscriptionData && this.subscriptionData.growth_percentage !== undefined
                ? this.subscriptionData.growth_percentage
                : 0;
        },

        chartData() {
            return this.hasSubscriptionData
                ? this.subscriptionData.chart_data
                : [];
        },

        chartOptions() {
            if (!this.hasSubscriptionData) {
                return {
                    title: {
                        text: this.$t('No Data Available'),
                        left: 'center',
                        top: 'middle',
                        textStyle: {
                            color: '#9ca3af',
                            fontSize: 14,
                            fontWeight: 'normal'
                        }
                    },
                    grid: {
                        left: '25%',
                        right: '10%',
                        top: '5%',
                        bottom: '5%'
                    },
                    xAxis: {
                        type: 'value',
                        show: false
                    },
                    yAxis: {
                        type: 'category',
                        show: false
                    },
                };
            }

            const chartData = [...this.chartData].reverse();

            // Calculate max value for axis scaling
            const maxValue = Math.max(...chartData.map(item => item.value));

            // Determine a good interval for the chart
            const interval = this.calculateInterval(maxValue);

            return {
                grid: {
                    top: 10,
                    right: 30,
                    bottom: 30,
                    left: 100,
                    containLabel: false
                },
                xAxis: {
                    type: 'value',
                    name: '',
                    min: 0,
                    max: this.roundUpToNiceNumber(maxValue),
                    interval: interval,
                    axisLabel: {
                        formatter: (value) => {
                            if (value === 0) return '0';
                            return value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value;
                        },
                        color: '#909399'
                    },
                    splitLine: {
                        lineStyle: {
                            type: 'dashed',
                            color: '#E4E7ED'
                        }
                    },
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'category',
                    data: chartData.map(item => item.name),
                    axisLabel: {
                        color: '#303133',
                        fontWeight: 600,
                        align: 'right',
                        padding: [0, 5, 0, 0]
                    },
                    axisTick: {
                        show: false
                    },
                    axisLine: {
                        show: false
                    },
                    position: 'left',
                    boundaryGap: [0, 0],
                    categoryGap: '0%'
                },
                series: [{
                    type: 'bar',
                    data: chartData.map((item, index) => ({
                        value: item.value,
                        itemStyle: {
                            color: this.getBarColor(index)
                        }
                    })),
                    barWidth: '40%',
                    barCategoryGap: '10%',
                    label: {
                        show: false
                    }
                }],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    formatter: (params) => {
                        const data = params[0];
                        return `${data.name}: ${this.getCurrencySymbol()}${this.formatNumber(data.value)}`;
                    }
                },
                animation: true
            };
        }
    },
    methods: {
        getBarColor(index) {
            // Colors ordered from lightest to strongest (bottom to top bars)
            const colors = ['#DCD5FF','#CAC0FF', '#A897FF', '#8C71F6', '#7D52F4'];
            const totalBars = this.chartData.length;

            // Always use the strongest colors, starting from the end of the array
            const colorIndex = Math.max(0, colors.length - totalBars) + index;

            if (colorIndex < colors.length) {
                return colors[colorIndex];
            }
            return '#D5E2FF';
        },
        getCurrencySymbol() {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = this.subscriptionData?.currency_symbol || '$';
            return textarea.value;
        },
        formatNumber(num) {
            return parseFloat(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        calculateInterval(maxValue) {
            if (maxValue <= 50) return 10;
            if (maxValue <= 100) return 20;
            if (maxValue <= 500) return 100;
            if (maxValue <= 1000) return 200;
            if (maxValue <= 5000) return 1000;

            // For larger values, create a nice round interval
            return Math.ceil(maxValue / 5 / 100) * 100;
        },

        roundUpToNiceNumber(num) {
            // Round up to a nice number for the chart max value
            if (num <= 50) return Math.ceil(num / 10) * 10;
            if (num <= 100) return Math.ceil(num / 20) * 20;
            if (num <= 500) return Math.ceil(num / 100) * 100;
            if (num <= 1000) return Math.ceil(num / 200) * 200;
            return Math.ceil(num / 1000) * 1000;
        }
    },
};
</script>

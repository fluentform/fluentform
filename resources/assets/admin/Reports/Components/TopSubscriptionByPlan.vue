<template>
    <card class="ff-pro-component">
        <card-head>
            <h3>{{ $t('Subscription') }}</h3>
        </card-head>

        <card-body>
            <div class="subscription-amount" v-if="!loading && hasSubscriptionData">
                <p>{{ $t('Recurring') }}</p>
                <div class="subscription-total">
                    <span class="total-amount">{{ formatCurrency(totalAmount, getCurrencySymbol()) }}</span>
                    <span
                        class="growth-indicator"
                        :class="{ 'positive': growthPercentage > 0, 'negative': growthPercentage < 0 }"
                    >
                        <svg v-if="growthPercentage > 0" width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6668 1.66602L9.42108 6.91177C9.15707 7.17578 9.02506 7.30779 8.87284 7.35725C8.73895 7.40075 8.59471 7.40075 8.46082 7.35725C8.3086 7.30779 8.17659 7.17578 7.91258 6.91177L6.08774 5.08693C5.82373 4.82292 5.69173 4.69091 5.53951 4.64145C5.40561 4.59795 5.26138 4.59795 5.12748 4.64145C4.97527 4.69091 4.84326 4.82292 4.57925 5.08693L1.3335 8.33268M14.6668 1.66602H10.0002M14.6668 1.66602V6.33268" stroke="#23A682" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <svg v-else width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6666 8.33268L9.42083 3.08693C9.15682 2.82292 9.02482 2.69091 8.8726 2.64145C8.7387 2.59795 8.59447 2.59795 8.46057 2.64145C8.30836 2.69091 8.17635 2.82292 7.91234 3.08693L6.0875 4.91177C5.82349 5.17578 5.69148 5.30779 5.53926 5.35724C5.40537 5.40075 5.26114 5.40075 5.12724 5.35724C4.97502 5.30779 4.84302 5.17578 4.579 4.91177L1.33325 1.66602M14.6666 8.33268H9.99992M14.6666 8.33268V3.66602" stroke="#F04438" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        <span>{{ Math.abs(growthPercentage) }}%</span>
                    </span>
                </div>
            </div>

            <div class="subscription-chart">
                <chart-loader v-if="loading" :rows="7" />

                <no-data
                    v-else-if="!hasSubscriptionData"
                    :message="$t('No subscription data available for the selected period')"
                />
                <v-chart
                    v-else
                    ref="chart"
                    :option="chartOptions"
                    style="height: 256px;"
                    autoresize
                />
            </div>
            <notice class="ff_alert_between update-info-notice" type="info-soft" v-if="!hasPro">
                <div>
                    <p class="text">{{ $t('Please upgrade to pro to unlock this feature.') }}</p>
                </div>
                <a target="_blank"
                   href="https://fluentforms.com/pricing/?utm_source=plugin&amp;utm_medium=wp_install&amp;utm_campaign=ff_upgrade&amp;theme_style=twentytwentythree"
                   class="el-button el-button--info el-button--small mt-2">
                    {{ $t('Upgrade to Pro') }}
                </a>
            </notice>
        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";
import Notice from "@/admin/components/Notice/Notice.vue";
import { COLORS, formatCurrency, ChartLoader, NoData } from './shared/simple-utils.js';

export default {
    name: 'TopSubscriptionByPlan',
    components: {
        Card,
        CardBody,
        CardHead,
        Notice,
        ChartLoader,
        NoData
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
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            selectedStatus: 'all',
            selectedInterval: 'all',
            selectedFormId: null
        };
    },
    computed: {
        hasPro() {
            return !!window.FluentFormApp.has_pro;
        },

        hasSubscriptionData() {
            // Always show data for non-pro users (demo data)
            if (!this.hasPro) {
                return true;
            }

            return this.subscriptionData &&
                this.subscriptionData.chart_data &&
                this.subscriptionData.chart_data.length > 0;
        },

        totalAmount() {
            // Return demo data for non-pro users
            if (!this.hasPro) {
                return 12450.75;
            }

            return this.subscriptionData && this.subscriptionData.total_recurring !== undefined
                ? this.subscriptionData.total_recurring
                : 0;
        },

        growthPercentage() {
            // Return demo data for non-pro users
            if (!this.hasPro) {
                return 23.5;
            }

            return this.subscriptionData && this.subscriptionData.growth_percentage !== undefined
                ? this.subscriptionData.growth_percentage
                : 0;
        },

        chartData() {
            // Return demo data for non-pro users
            if (!this.hasPro) {
                return this.getDemoChartData();
            }

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
                        return `${data.name}: ${this.formatCurrency(data.value, this.getCurrencySymbol())}`;
                    }
                },
                animation: true
            };
        }
    },
    methods: {
        getBarColor(index) {
            const colors = COLORS.topPerformingBars;
            const totalBars = this.chartData.length;

            // Always use the strongest colors, starting from the end of the array
            const colorIndex = Math.max(0, colors.length - totalBars) + index;

            if (colorIndex < colors.length) {
                return colors[colorIndex];
            }
            return '#D5E2FF';
        },
        getCurrencySymbol() {
            // Return default currency for demo data
            if (!this.hasPro) {
                return '$';
            }

            const textarea = document.createElement('textarea');
            textarea.innerHTML = this.subscriptionData?.currency_symbol || '$';
            return textarea.value;
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
        },

        getDemoChartData() {
            return [
                { name: 'Premium Plan', value: 4250.25 },
                { name: 'Business Plan', value: 3180.50 },
                { name: 'Starter Plan', value: 2890.75 },
                { name: 'Enterprise Plan', value: 1650.00 },
                { name: 'Basic Plan', value: 479.25 }
            ];
        },

        formatCurrency(value, currencySymbol = '$') {
            return formatCurrency(value, currencySymbol);
        }
    },
};
</script>

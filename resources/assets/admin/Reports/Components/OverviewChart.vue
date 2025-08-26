<template>
    <card class="ff-pro-component">
        <card-head>
            <div class="overview-chart-header">
                <div class="chart-title-section">
                    <h3>{{$t('Overview Chart')}}</h3>
                </div>
                <div class="card-controls">
                    <div class="chart-type-toggle svg-icons" style="margin-right: 12px;">
                        <el-radio-group v-model="chartType" size="mini">
                            <el-radio-button label="line">
                                <span v-html="lineChartIcon"></span>
                            </el-radio-button>
                            <el-radio-button label="bar">
                                <span v-html="barChartIcon"></span>
                            </el-radio-button>
                        </el-radio-group>
                    </div>
                    <el-radio-group
                            v-model="chartMode"
                            size="mini"
                            class="mode-toggle-group"
                    >
                        <el-radio-button label="activity">{{ $t('Submissions') }}</el-radio-button>
                        <el-radio-button v-if="hasPayment" label="revenue">{{ $t('Payments') }}</el-radio-button>
                    </el-radio-group>
                </div>
            </div>
        </card-head>

        <card-body>
            <!-- Single Chart -->
            <div class="chart-wrapper">
                <chart-loader v-if="loading" :rows="8" />

                <!-- Show message when no data -->
                <no-data
                        v-else-if="!hasData"
                        :message="isRevenueMode ? $t('No Payment Data Available') : $t('No Submission Data Available')"
                />

                <!-- Chart -->
                <v-chart
                        v-else
                        ref="chart"
                        :option="chartOptions"
                        style="height: 350px; width: 100%;"
                        autoresize
                />
                <div class="chart-footer-info" v-if="!loading && hasData">
                    <div class="">
                        <i class="el-icon-top"></i>
                        <span v-if="isRevenueMode">{{ $t('Total Amount') }}</span>
                        <span v-else>{{ $t('Total Counts') }}</span>
                    </div>
                    <div class="">
                        <span>{{ $t('Time Line') }}</span>
                        <i class="el-icon-right"></i>
                    </div>
                </div>
            </div>
        </card-body>
    </card>
</template>

<script>
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from "@/admin/components/Card/CardHead.vue";
    import { COLORS, ChartLoader, NoData, formatNumber, formatCurrency, getCurrencySymbol } from './shared/simple-utils.js';

    export default {
        name: 'OverviewChart',
        components: {
            Card,
            CardBody,
            CardHead,
            ChartLoader,
            NoData
        },
        props: ['data', 'chartView', 'selectedMetrics', 'hasPayment', 'loading'],
        emits: ['chart-mode-change'],
        data() {
            return {
                chartType: 'bar',
                categories: [],
                chartData: {
                    views: [],
                    submissions: [],
                    conversions: [],
                    payments: [],
                    paid: [],
                    pending: [],
                    refunded: [],
                    spam: [],
                    unread: [],
                    read: [],
                    trashed: []
                }
            };
        },
        computed: {
            chartMode: {
                get() {
                    return this.chartView;
                },
                set(value) {
                    this.$emit('chart-mode-change', value);
                }
            },

            hasData() {
                let keys = Object.keys(this.chartData);
                if (this.isRevenueMode) {
                    keys = ['payments', 'paid', 'pending', 'refunded'];
                } else {
                    // For activity mode, check all available activity keys
                    keys = ['submissions', 'views', 'read', 'unread', 'spam', 'trashed'];
                }

                let status = false;
                keys.forEach(key => {
                    if (this.chartData[key] && this.chartData[key].length > 0 && this.chartData[key].some(val => val > 0)) {
                        status = true;
                        return true;
                    }
                });
                return status;
            },

            // Get current metrics based on chart mode
            currentMetrics() {
                if (this.chartMode === 'revenue') {
                    return ['paid', 'pending', 'refunded', 'payments'];
                }
                return this.selectedMetrics.length > 0 ? this.selectedMetrics : ['submissions', 'views'];
            },

            // Check if current mode is revenue
            isRevenueMode() {
                return this.chartMode === 'revenue';
            },

            // Chart options
            chartOptions() {
                return this.generateChartOptions(this.currentMetrics, this.isRevenueMode);
            },

            // SVG Icons
            lineChartIcon() {
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="width: 14px; height: 14px; margin-right: 5px;">
                <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle>
                <circle cx="14.5" cy="15.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle>
                <circle cx="18.5" cy="7.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle>
                <path d="M15.4341 14.2963L18 9M9.58251 11.5684L13.2038 14.2963M3 19L7.58957 11.8792" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                <path d="M20 21H9C5.70017 21 4.05025 21 3.02513 19.9749C2 18.9497 2 17.2998 2 14V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
            </svg>`;
            },

            barChartIcon() {
                return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="width: 14px; height: 14px; margin-right: 5px;">
                <rect x="3" y="8" width="4" height="13" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"></rect>
                <rect x="10" y="4" width="4" height="17" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"></rect>
                <rect x="17" y="12" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"></rect>
            </svg>`;
            }
        },
        watch: {
            data: {
                handler() {
                    this.processChartData();
                },
                deep: true,
                immediate: true
            },
            chartType() {
                // Chart will automatically update due to reactive chartOptions
                this.$nextTick(() => {
                    // Force chart resize after type change
                    if (this.$refs.chart) {
                        this.$refs.chart.resize();
                    }
                });
            }
        },
        methods: {
            // Process chart data for ECharts
            processChartData() {
                if (!this.data) return;

                const data = this.data;
                this.categories = data.dates || [];

                // Reset chart data
                this.chartData = {
                    views: [],
                    submissions: [],
                    conversions: [],
                    payments: [],
                    paid: [],
                    pending: [],
                    refunded: [],
                    spam: [],
                    unread: [],
                    read: [],
                    trashed: []
                };
                // Handle different data structures based on the view type
                // Handle payment data types
                this.chartData.paid = data.values.paid || [];
                this.chartData.pending = data.values.pending || [];
                this.chartData.refunded = data.values.refunded || [];
                this.chartData.payments = data.values.payments || [];

                // Process activity data types
                this.chartData.submissions = data.values.submissions || [];
                this.chartData.views = data.values.views || [];
                this.chartData.conversions = data.values.conversions || [];
                this.chartData.spam = data.values.spam || [];
                this.chartData.unread = data.values.unread || [];
                this.chartData.read = data.values.read || [];
                this.chartData.trashed = data.values.trashed || [];
            },

            // Generate chart options for both chart types
            generateChartOptions(selectedMetrics, isPaymentChart = false) {
                const series = this.generateSeriesData(selectedMetrics, isPaymentChart);

                return {
                    title: {
                        show: false
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'shadow'
                        },
                        formatter: (params) => {
                            let result = `${params[0].axisValue}<br/>`;
                            params.forEach(param => {
                                let value = param.value;
                                if (isPaymentChart) {
                                    value = formatCurrency(
                                        typeof value === 'number' ? value : parseFloat(value) || 0,
                                        this.getCurrencySymbol()
                                    );
                                } else {
                                    value = formatNumber(typeof value === 'number' ? value : parseFloat(value) || 0);
                                }
                                result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
                            });
                            return result;
                        }
                    },
                    legend: {
                        show: true,
                        top: 'top',
                        orient: 'horizontal',
                        itemGap: 20,
                        itemWidth: 12,
                        itemHeight: 12,
                        icon: 'roundRect',
                        textStyle: {
                            color: '#6b7280',
                            fontSize: 12
                        }
                    },
                    grid: {
                        left: '3%',
                        right: '4%',
                        bottom: '12%',
                        top: '18%',
                        containLabel: true
                    },
                    xAxis: {
                        type: 'category',
                        data: this.categories,
                        axisTick: {
                            show: false
                        },
                        axisLine: {
                            show: false
                        },
                        axisLabel: {
                            color: '#8e8da4',
                            fontSize: 12
                        }
                    },
                    yAxis: {
                        type: 'value',
                        axisLine: {
                            show: false
                        },
                        axisTick: {
                            show: false
                        },
                        axisLabel: {
                            color: '#8e8da4',
                            fontSize: 12,
                            formatter: (value) => {
                                if (isPaymentChart) {
                                    return formatCurrency(value, this.getCurrencySymbol());
                                }
                                return formatNumber(value);
                            }
                        },
                        splitLine: {
                            lineStyle: {
                                color: '#f1f1f1',
                                type: 'dashed'
                            }
                        }
                    },
                    series: series
                };
            },

            // Generate series data for charts
            generateSeriesData(selectedMetrics, isPaymentChart = false) {
                const series = [];
                const isLineChart = this.chartType === 'line';

                // Define available series configurations
                const availableSeries = {
                    submissions: {
                        name: this.$t('Submissions'),
                        type: this.chartType,
                        data: this.chartData.submissions,
                        itemStyle: {
                            color: COLORS.submissions,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.submissions, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    views: {
                        name: this.$t('Views'),
                        type: this.chartType,
                        data: this.chartData.views,
                        itemStyle: {
                            color: COLORS.views,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.views, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    spam: {
                        name: this.$t('Spam'),
                        type: this.chartType,
                        data: this.chartData.spam,
                        itemStyle: {
                            color: COLORS.spam,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.spam, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    unread: {
                        name: this.$t('Unread'),
                        type: this.chartType,
                        data: this.chartData.unread,
                        itemStyle: {
                            color: COLORS.unread,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.unread, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    read: {
                        name: this.$t('Read'),
                        type: this.chartType,
                        data: this.chartData.read,
                        itemStyle: {
                            color: COLORS.read,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.read, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    trashed: {
                        name: this.$t('Trashed'),
                        type: this.chartType,
                        data: this.chartData.trashed,
                        itemStyle: {
                            color: COLORS.trashed,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.trashed, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    payments: {
                        name: this.$t('Total Revenue'),
                        type: this.chartType,
                        data: this.chartData.payments,
                        itemStyle: {
                            color: COLORS.revenue,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.revenue, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    paid: {
                        name: this.$t('Paid'),
                        type: this.chartType,
                        data: this.chartData.paid,
                        itemStyle: {
                            color: COLORS.paid,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.paid, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    pending: {
                        name: this.$t('Pending'),
                        type: this.chartType,
                        data: this.chartData.pending,
                        itemStyle: {
                            color: COLORS.pending,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.pending, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    },
                    refunded: {
                        name: this.$t('Refunded'),
                        type: this.chartType,
                        data: this.chartData.refunded,
                        itemStyle: {
                            color: COLORS.refunded,
                            ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                        },
                        ...(isLineChart ? {
                            lineStyle: { color: COLORS.refunded, width: 3 },
                            symbol: 'circle',
                            symbolSize: 5,
                            smooth: true
                        } : {
                            barWidth: '20%'
                        })
                    }
                };

                // Add selected metrics to series
                selectedMetrics.forEach(metricKey => {
                    if (availableSeries[metricKey] && this.chartData[metricKey] && this.chartData[metricKey].length > 0) {
                        series.push(availableSeries[metricKey]);
                    }
                });

                return series;
            },
            getCurrencySymbol() {
                return getCurrencySymbol(this.data?.currency_sign);
            }
        }
    };
</script>

<style scoped>
</style>

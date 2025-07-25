<template>
    <card>
        <card-head>
            <div class="overview-chart-header">
                <div class="chart-title-section">
                    <h3>{{$t('Overview Chart')}}</h3>
                </div>
                <div class="card-controls">
                    <el-radio-group
                        v-model="chartMode"
                        size="mini"
                        class="mode-toggle-group"
                        style="margin-right: 12px;"
                    >
                        <el-radio-button label="activity">{{ $t('Submissions') }}</el-radio-button>
                        <el-radio-button v-if="hasPayment" label="revenue">{{ $t('Payments') }}</el-radio-button>
                    </el-radio-group>
                    <div class="form-selector">
                        <el-select
                            popper-class="report-form-select-popper"
                            v-model="selectedFormId"
                            :placeholder="$t('Select Form')"
                            size="mini"
                            clearable
                            filterable
                            @change="handleFormChange"
                            style="width: 200px;"
                        >
                            <el-option :label="$t('All Forms')" :value="null"></el-option>
                            <el-option
                                v-for="form in forms_list"
                                :key="form.id"
                                :label="`#${form.id} - ${form.title}`"
                                :value="form.id"
                            ></el-option>
                        </el-select>
                    </div>
                </div>
            </div>
        </card-head>

        <card-body>
            <!-- Single Chart -->
            <div class="chart-wrapper">
                <!-- Show message when in revenue mode but no payment data -->
                <div v-if="chartMode === 'revenue' && !hasPaymentData" class="no-payment-data">
                    <h4>{{ $t('No Payment Data Available') }}</h4>
                    <p>{{ $t('Payment data will appear here once you have forms with payment fields and received payments.') }}</p>
                </div>

                <!-- Chart -->
                <v-chart
                    v-else
                    ref="chart"
                    :option="chartOptions"
                    style="height: 350px; width: 100%;"
                    autoresize
                />
                <div class="chart-footer-info">
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

export default {
    name: 'OverviewChart',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: ['overview_chart', 'forms_list', 'global_date_params', 'chart_view', 'selectedMetrics', 'hasPayment'],
    emits: ['form-change', 'chart-mode-change'],
    data() {
        return {
            selectedFormId: null,
            chartType: 'bar', // Default to bar chart
            categories: [],
            internalSelectedMetrics: ['submissions', 'views'],
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
                return this.chart_view;
            },
            set(value) {
                this.$emit('chart-mode-change', value);
            }
        },

        // Check if payment data exists
        hasPaymentData() {
            // Check multiple sources for payment data
            const hasPaymentArray = this.chartData.payments && this.chartData.payments.length > 0 && this.chartData.payments.some(val => val > 0);
            const hasPaidData = this.chartData.paid && this.chartData.paid.length > 0 && this.chartData.paid.some(val => val > 0);
            const hasPendingData = this.chartData.pending && this.chartData.pending.length > 0 && this.chartData.pending.some(val => val > 0);
            const hasRefundedData = this.chartData.refunded && this.chartData.refunded.length > 0 && this.chartData.refunded.some(val => val > 0);

            const hasPaymentInOverview = this.overview_chart &&
                ((this.overview_chart.values && this.overview_chart.values.paid && this.overview_chart.values.paid.length > 0) ||
                 (this.overview_chart.payment_values && this.overview_chart.payment_values.length > 0) ||
                 (this.overview_chart.values && typeof this.overview_chart.values === 'object' &&
                  (this.overview_chart.values.paid || this.overview_chart.values.pending || this.overview_chart.values.refunded)));
            return hasPaymentArray || hasPaidData || hasPendingData || hasRefundedData || hasPaymentInOverview;
        },

        // Get current metrics based on chart mode
        currentMetrics() {
            if (this.chartMode === 'revenue') {
                // Filter selected metrics to only include payment-related ones
                const paymentMetrics = this.internalSelectedMetrics.filter(metric =>
                    ['payments', 'paid', 'pending', 'refunded'].includes(metric)
                );

                // If no payment metrics selected, default to available payment data
                if (paymentMetrics.length === 0) {
                    if (this.chartData.paid && this.chartData.paid.some(val => val > 0)) {
                        const metrics = ['paid'];
                        if (this.chartData.pending && this.chartData.pending.some(val => val > 0)) {
                            metrics.push('pending');
                        }
                        if (this.chartData.refunded && this.chartData.refunded.some(val => val > 0)) {
                            metrics.push('refunded');
                        }
                        if (this.chartData.payments && this.chartData.payments.some(val => val > 0)) {
                            metrics.push('payments');
                        }
                        return metrics;
                    }
                    return ['payments'];
                }
                return paymentMetrics;
            }
            // For activity mode, filter out payment metrics
            const activityMetrics = this.internalSelectedMetrics.filter(metric =>
                !['payments', 'paid', 'pending', 'refunded'].includes(metric)
            );
            return activityMetrics.length > 0 ? activityMetrics : ['submissions', 'views'];
        },

        // Check if current mode is revenue
        isRevenueMode() {
            return this.chartMode === 'revenue';
        },

        // Chart options
        chartOptions() {
            return this.generateChartOptions(this.currentMetrics, this.isRevenueMode);
        }
    },
    watch: {
        global_date_params: {
            handler(newParams) {
                if (newParams) {
                    this.selectedFormId = newParams.formId || null;
                }
            },
            deep: true,
            immediate: true
        },
        overview_chart: {
            handler() {
                this.processChartData();
            },
            deep: true,
            immediate: true
        },
        selectedMetrics: {
            handler(newMetrics) {
                if (newMetrics && newMetrics.length > 0) {
                    this.internalSelectedMetrics = newMetrics;
                }
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        // Handle form selection
        handleFormChange() {
            this.$emit('form-change', this.selectedFormId);
        },

        // Process chart data for ECharts
        processChartData() {
            if (!this.overview_chart) return;

            const data = this.overview_chart;
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
                                value = this.getCurrencySymbol() + (typeof value === 'number' ? value.toLocaleString() : value);
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
                                return this.getCurrencySymbol() + (value >= 1000 ? (value/1000).toFixed(1) + 'K' : value);
                            }
                            return value >= 1000 ? (value/1000).toFixed(1) + 'K' : value;
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
                        color: '#8b5cf6',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#8b5cf6', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                views: {
                    name: this.$t('Views'),
                    type: this.chartType,
                    data: this.chartData.views,
                    itemStyle: {
                        color: '#3b82f6',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#3b82f6', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                spam: {
                    name: this.$t('Spam'),
                    type: this.chartType,
                    data: this.chartData.spam,
                    itemStyle: {
                        color: '#ef4444',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#ef4444', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                unread: {
                    name: this.$t('Unread'),
                    type: this.chartType,
                    data: this.chartData.unread,
                    itemStyle: {
                        color: '#f59e0b',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#f59e0b', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                read: {
                    name: this.$t('Read'),
                    type: this.chartType,
                    data: this.chartData.read,
                    itemStyle: {
                        color: '#10b981',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#10b981', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                trashed: {
                    name: this.$t('Trashed'),
                    type: this.chartType,
                    data: this.chartData.trashed,
                    itemStyle: {
                        color: '#A0AEC0',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#A0AEC0', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                payments: {
                    name: this.$t('Total Revenue'),
                    type: this.chartType,
                    data: this.chartData.payments,
                    itemStyle: {
                        color: '#10b981',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#10b981', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                paid: {
                    name: this.$t('Paid'),
                    type: this.chartType,
                    data: this.chartData.paid,
                    itemStyle: {
                        color: '#63B3ED',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#63B3ED', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                pending: {
                    name: this.$t('Pending'),
                    type: this.chartType,
                    data: this.chartData.pending,
                    itemStyle: {
                        color: '#f59e0b',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#f59e0b', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                refunded: {
                    name: this.$t('Refunded'),
                    type: this.chartType,
                    data: this.chartData.refunded,
                    itemStyle: {
                        color: '#ef4444',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#ef4444', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
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
            if (!this.overview_chart) {
                return '$';
            }
            const textarea = document.createElement('textarea');
            textarea.innerHTML = this.overview_chart?.currency_sign || '$';
            return textarea.value;
        }
    }
};
</script>

<style scoped>
/* Overview Chart Header Styles */
.overview-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    gap: 20px;
}

.chart-title-section {
    flex: 1;
    min-width: 0;
}

.chart-title-section h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #374151;
}

.card-controls {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-shrink: 0;
}

.chart-wrapper {
    position: relative;
    margin-top: 16px;
    width: 100%;
    overflow: visible;
    min-height: 450px;
    height: auto;
}

.no-payment-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    text-align: center;
    color: #6b7280;
}

.no-data-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
}

.no-payment-data h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #374151;
}

.no-payment-data p {
    margin: 0;
    font-size: 14px;
    max-width: 300px;
    line-height: 1.5;
}
</style>


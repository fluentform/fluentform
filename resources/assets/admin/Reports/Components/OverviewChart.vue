<template>
    <card class="ff-pro-component">
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
                </div>
            </div>
        </card-head>

        <card-body>
            <!-- Single Chart -->
            <div class="chart-wrapper">
              <el-skeleton v-if="loading" animated >
                <template #template>
                  <div class="loading-skeleton-header">
                    <el-skeleton-item  />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                  </div>
                  <div class="loading-skeleton-body">
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                    <el-skeleton-item />
                  </div>
                  <div class="loading-skeleton-footer">
                    <el-skeleton-item  />
                    <el-skeleton-item />
                  </div>
                </template>
              </el-skeleton>

                <!-- Show message when no data -->
                <div v-else-if="!hasData" class="no-data">
                    <h4>{{ isRevenueMode ? $t('No Payment Data Available') : $t('No Submission Data Available') }}</h4>
                    <p>{{ isRevenueMode ? $t('Payment data will appear here once you have forms with payment fields and received payments.') : $t('Submission data will appear here once you have forms and received submissions.') }}</p>
                </div>

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

export default {
    name: 'OverviewChart',
    components: {
        Card,
        CardBody,
        CardHead
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
        }
    },
    watch: {
        data: {
            handler() {
                this.processChartData();
            },
            deep: true,
            immediate: true
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
                        color: '#017EF3',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#017EF3', width: 3 },
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
            if (!this.data) {
                return '$';
            }
            const textarea = document.createElement('textarea');
            textarea.innerHTML = this.data?.currency_sign || '$';
            return textarea.value;
        }
    }
};
</script>


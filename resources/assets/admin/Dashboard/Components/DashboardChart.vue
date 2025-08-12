<template>
    <card>
        <card-head>
            <div class="overview-chart-header">
                <div class="chart-title-section">
                    <h4>{{$t('Overview Chart')}}</h4>
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
    name: 'DashboardChart',
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

        // Generate series data for the chart
        generateSeriesData(selectedMetrics, isPaymentChart = false) {
            const series = [];
            const colors = this.getMetricColors();

            selectedMetrics.forEach((metric, index) => {
                // Skip 'payments' metric as it represents total revenue, not a separate series
                // Following Reports module pattern where 'payments' is included in metrics but not displayed
                if (metric === 'payments') {
                    return;
                }

                if (this.chartData[metric] && this.chartData[metric].length > 0) {
                    series.push({
                        name: this.getMetricLabel(metric),
                        type: this.chartType,
                        data: this.chartData[metric],
                        itemStyle: {
                            color: colors[metric] || colors.default[index % colors.default.length]
                        },
                        emphasis: {
                            focus: 'series'
                        },
                        barMaxWidth: 40
                    });
                }
            });

            return series;
        },

        // Get metric colors
        getMetricColors() {
            return {
                submissions: '#409EFF',
                views: '#67C23A',
                conversions: '#E6A23C',
                payments: '#F56C6C',
                paid: '#67C23A',
                pending: '#E6A23C',
                refunded: '#F56C6C',
                spam: '#909399',
                unread: '#E6A23C',
                read: '#67C23A',
                trashed: '#F56C6C',
                default: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399']
            };
        },

        // Get metric label
        getMetricLabel(metric) {
            const labels = {
                submissions: this.$t('Submissions'),
                views: this.$t('Views'),
                conversions: this.$t('Conversions'),
                payments: this.$t('Payments'),
                paid: this.$t('Paid'),
                pending: this.$t('Pending'),
                refunded: this.$t('Refunded'),
                spam: this.$t('Spam'),
                unread: this.$t('Unread'),
                read: this.$t('Read'),
                trashed: this.$t('Trashed')
            };
            return labels[metric] || metric;
        },

        // Get currency symbol
        getCurrencySymbol() {
            return window.FluentFormApp?.currency_sign || '$';
        }
    },
    watch: {
        data: {
            handler(newData) {
                if (newData && typeof newData === 'object') {
                    // Update categories and chartData from the new data
                    this.categories = newData.categories || [];

                    // Update chartData with the new data
                    Object.keys(this.chartData).forEach(key => {
                        this.chartData[key] = newData[key] || [];
                    });
                }
            },
            deep: true,
            immediate: true
        }
    }
};
</script>

<style lang="scss" scoped>
.overview-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0;

    .chart-title-section {
        h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
        }
    }

    .card-controls {
        display: flex;
        align-items: center;
        gap: 12px;

        .mode-toggle-group {
            :deep(.el-radio-button__inner) {
                padding: 8px 16px;
                font-size: 12px;
            }
        }
    }
}

.chart-wrapper {
    .loading-skeleton-header {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;

        .el-skeleton-item {
            height: 20px;
            flex: 1;
        }
    }

    .loading-skeleton-body {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 10px;
        margin-bottom: 20px;

        .el-skeleton-item {
            height: 100px;
        }
    }

    .loading-skeleton-footer {
        display: flex;
        gap: 10px;

        .el-skeleton-item {
            height: 15px;
            flex: 1;
        }
    }

    .no-data {
        text-align: center;
        padding: 60px 20px;
        color: #9ca3af;

        h4 {
            font-size: 18px;
            margin-bottom: 12px;
            color: #6b7280;
        }

        p {
            font-size: 14px;
            line-height: 1.5;
            margin: 0;
        }
    }

    .chart-footer-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #f3f4f6;
        font-size: 12px;
        color: #6b7280;

        div {
            display: flex;
            align-items: center;
            gap: 4px;
        }

        i {
            font-size: 14px;
        }
    }
}

@media (max-width: 768px) {
    .overview-chart-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;

        .card-controls {
            width: 100%;
            justify-content: flex-start;
        }
    }
}
</style>

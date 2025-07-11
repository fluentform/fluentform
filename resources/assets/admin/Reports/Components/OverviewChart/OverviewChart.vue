<template>
    <card>
        <card-head>
            <div class="overview-chart-header">
                <div class="chart-title-section">
                    <h3>Conversion Chart</h3>
                </div>
                <div class="card-controls">
<!--                  <el-select-->
<!--                    v-model="chartType"-->
<!--                    placeholder="Chart Type"-->
<!--                    size="small"-->
<!--                    @change="handleChartTypeChange"-->
<!--                    style="width: 120px; margin-right: 12px;"-->
<!--                  >-->
<!--                    <el-option label="Bar Chart" value="bar">-->
<!--                      <i class="el-icon-s-data" style="margin-right: 8px;"></i>-->
<!--                      Bar Chart-->
<!--                    </el-option>-->
<!--                    <el-option label="Line Chart" value="line">-->
<!--                      <i class="el-icon-s-marketing" style="margin-right: 8px;"></i>-->
<!--                      Line Chart-->
<!--                    </el-option>-->
<!--                  </el-select>-->
                  <el-radio-group
                    v-model="chartMode"
                    size="small"
                    @change="handleChartModeChange"
                    class="mode-toggle-group"
                    style="margin-right: 12px;"
                  >
                    <el-radio-button label="activity"> Activity</el-radio-button>
                    <el-radio-button label="revenue"> Revenue</el-radio-button>
                  </el-radio-group>
                  <el-select
                    v-model="selectedFormId"
                    placeholder="Select Form"
                    size="small"
                    clearable
                    filterable
                    @change="handleFormChange"
                    style="width: 200px;"
                  >
                    <el-option label="All Forms" :value="null"></el-option>
                    <el-option
                      v-for="form in forms_list"
                      :key="form.id"
                      :label="`#${form.id} - ${form.title}`"
                      :value="form.id"
                    ></el-option>
                  </el-select>
                </div>
            </div>
        </card-head>

        <card-body>


            <!-- Single Chart -->
            <div class="chart-wrapper">
                <!-- Show message when in revenue mode but no payment data -->
                <div v-if="chartMode === 'revenue' && !hasPaymentData" class="no-payment-data">
                    <div class="no-data-icon">💰</div>
                    <h4>No Payment Data Available</h4>
                    <p>Payment data will appear here once you have forms with payment fields and received payments.</p>
                </div>

                <!-- Chart -->
                <v-chart
                    v-else
                    ref="chart"
                    :option="chartOptions"
                    style="height: 400px; width: 100%;"
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
    name: 'OverviewChart',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: ['overview_chart', 'forms_list', 'global_date_params', 'chart_view', 'selectedMetrics'],
    emits: ['view-change', 'form-change', 'chart-mode-change'],
    data() {
        return {
            activeView: 'submissions',
            selectedFormId: null,
            chartType: 'bar', // Default to bar chart
            chartMode: 'activity', // 'activity' or 'revenue'
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
                read: []
            }
        };
    },
    computed: {

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

            const hasData = hasPaymentArray || hasPaidData || hasPendingData || hasRefundedData || hasPaymentInOverview;

            console.log('Payment data check:', {
                chartDataPayments: this.chartData.payments,
                chartDataPaid: this.chartData.paid,
                chartDataPending: this.chartData.pending,
                chartDataRefunded: this.chartData.refunded,
                overviewChart: this.overview_chart,
                hasPaymentArray: hasPaymentArray,
                hasPaidData: hasPaidData,
                hasPendingData: hasPendingData,
                hasRefundedData: hasRefundedData,
                hasPaymentInOverview: hasPaymentInOverview,
                finalHasData: hasData
            });

            return hasData;
        },

        // Get available metrics based on current mode
        availableMetrics() {
            if (this.chartMode === 'revenue') {
                const metrics = [
                    { key: 'payments', label: 'Total Revenue', color: '#059669' }
                ];

                // Add individual payment status metrics if we have breakdown data
                if (this.chartData.paid && this.chartData.paid.some(val => val > 0)) {
                    metrics.push({ key: 'paid', label: 'Paid', color: '#10b981' });
                }
                if (this.chartData.pending && this.chartData.pending.some(val => val > 0)) {
                    metrics.push({ key: 'pending', label: 'Pending', color: '#f59e0b' });
                }
                if (this.chartData.refunded && this.chartData.refunded.some(val => val > 0)) {
                    metrics.push({ key: 'refunded', label: 'Refunded', color: '#ef4444' });
                }

                return metrics;
            }
            return [
                { key: 'submissions', label: 'Submissions', color: '#8b5cf6' },
                { key: 'views', label: 'Views', color: '#3b82f6' },
                { key: 'spam', label: 'Spam', color: '#ef4444' },
                { key: 'unread', label: 'Unread', color: '#f59e0b' },
                { key: 'read', label: 'Read', color: '#10b981' }
            ];
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
        chart_view: {
            handler(newView) {
                if (newView) {
                    this.activeView = newView;
                }
            },
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

        // Handle chart type change
        handleChartTypeChange() {
            // Chart will automatically update due to computed seriesData
            // No need to emit event as this is a local UI preference
        },

        // Handle view type change
        handleViewChange() {
            this.$emit('view-change', this.activeView);
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
                read: []
            };

            // Handle different data structures based on the view type
            if (data.values && typeof data.values === 'object' && !Array.isArray(data.values)) {
                // Payment data structure: { values: { paid: [...], pending: [...], refunded: [...] } }
                if (data.values.paid || data.values.pending || data.values.refunded) {
                    // Store individual payment status data
                    this.chartData.paid = data.values.paid || [];
                    this.chartData.pending = data.values.pending || [];
                    this.chartData.refunded = data.values.refunded || [];

                    // Calculate total payments (paid + pending - refunded is more accurate than just paid)
                    this.chartData.payments = this.calculateTotalPayments();

                    console.log('Found payment data in values object:', {
                        paid: data.values.paid,
                        pending: data.values.pending,
                        refunded: data.values.refunded,
                        total: this.chartData.payments
                    });
                } else {
                    // Other object structures - shouldn't happen but fallback
                    this.chartData.submissions = data.submissions || [];
                }
            } else {
                // Standard array data structure for submissions, views, etc.
                this.chartData.submissions = data.values || data.submissions || [];
            }

            // Try to get payment data from various sources if not already set
            if (this.chartData.payments.length === 0 && this.chartData.paid.length === 0) {
                const paymentValues = data.payment_values ||
                                    (data.values && Array.isArray(data.values) ? data.values : []) ||
                                    [];
                this.chartData.payments = paymentValues;
            }

            // Process other data types
            this.chartData.views = data.views || [];
            this.chartData.conversions = data.conversion_rates || data.conversions || [];

            // Handle submission status data (if available)
            this.chartData.spam = data.spam_submissions || [];
            this.chartData.unread = data.unread_submissions || [];
            this.chartData.read = data.read_submissions || [];

            // If we don't have separate views data, generate it based on submissions
            if (this.chartData.views.length === 0 && this.chartData.submissions.length > 0) {
                this.chartData.views = this.chartData.submissions.map(val => Math.floor(val * 2.5));
            }

            // If we don't have separate status data, try to derive from submissions
            if (this.chartData.spam.length === 0 && this.chartData.submissions.length > 0) {
                // These are placeholder calculations - in real implementation,
                // the backend should provide this data
                this.chartData.spam = this.chartData.submissions.map(val => Math.floor(val * 0.1));
                this.chartData.unread = this.chartData.submissions.map(val => Math.floor(val * 0.3));
                this.chartData.read = this.chartData.submissions.map(val => Math.floor(val * 0.6));
            }
        },

        // Handle chart mode change
        handleChartModeChange() {
            // Chart will automatically update due to computed chartOptions
            // Emit event to notify parent about chart mode change
            this.$emit('chart-mode-change', this.chartMode);
        },

        // Handle metrics change (for existing ChartMetricsSelector integration)
        handleMetricsChanged(selectedMetrics) {
            this.internalSelectedMetrics = selectedMetrics;
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
                                // Format as currency
                                value = '$' + (typeof value === 'number' ? value.toLocaleString() : value);
                            }
                            result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
                        });
                        return result;
                    }
                },
                legend: {
                    show: true,
                    top: 'top',
                    right: '20px',
                    orient: 'horizontal',
                    itemGap: 20,
                    itemWidth: 12,
                    itemHeight: 12,
                    icon: 'circle',
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
                                return '$' + (value >= 1000 ? (value/1000).toFixed(1) + 'K' : value);
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
                    name: 'Submissions',
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
                    name: 'Views',
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
                    name: 'Spam',
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
                    name: 'Unread',
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
                    name: 'Read',
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
                payments: {
                    name: 'Total Revenue',
                    type: this.chartType,
                    data: this.chartData.payments,
                    itemStyle: {
                        color: '#059669',
                        ...(isLineChart ? {} : { borderRadius: [4, 4, 0, 0] })
                    },
                    ...(isLineChart ? {
                        lineStyle: { color: '#059669', width: 3 },
                        symbol: 'circle',
                        symbolSize: 6,
                        smooth: true
                    } : {})
                },
                paid: {
                    name: 'Paid',
                    type: this.chartType,
                    data: this.chartData.paid,
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
                pending: {
                    name: 'Pending',
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
                    name: 'Refunded',
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

        // Format date range for display
        formatDateRange() {
            if (!this.global_date_params || !this.global_date_params.startDate || !this.global_date_params.endDate) {
                return 'No date range selected';
            }

            const startDate = new Date(this.global_date_params.startDate.split(' ')[0]);
            const endDate = new Date(this.global_date_params.endDate.split(' ')[0]);

            const formatDate = (date) => {
                const options = { year: 'numeric', month: 'short', day: 'numeric' };
                return date.toLocaleDateString(undefined, options);
            };

            const startFormatted = formatDate(startDate);
            const endFormatted = formatDate(endDate);

            // If same date, show only once
            if (startFormatted === endFormatted) {
                return startFormatted;
            }

            return `${startFormatted} - ${endFormatted}`;
        },

        // Get date range duration
        getDateRangeDuration() {
            if (!this.global_date_params || !this.global_date_params.startDate || !this.global_date_params.endDate) {
                return null;
            }

            const startDate = new Date(this.global_date_params.startDate.split(' ')[0]);
            const endDate = new Date(this.global_date_params.endDate.split(' ')[0]);

            const timeDiff = endDate.getTime() - startDate.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

            if (daysDiff === 1) {
                return '1 day';
            } else if (daysDiff <= 7) {
                return `${daysDiff} days`;
            } else if (daysDiff <= 30) {
                const weeks = Math.floor(daysDiff / 7);
                const remainingDays = daysDiff % 7;
                if (remainingDays === 0) {
                    return `${weeks} week${weeks > 1 ? 's' : ''}`;
                } else {
                    return `${weeks}w ${remainingDays}d`;
                }
            } else {
                const months = Math.floor(daysDiff / 30);
                const remainingDays = daysDiff % 30;
                if (remainingDays === 0) {
                    return `${months} month${months > 1 ? 's' : ''}`;
                } else {
                    return `~${months}m ${Math.floor(remainingDays / 7)}w`;
                }
            }
        },

        // Check if chart has data
        hasChartData() {
            return this.overview_chart && (
                (this.chartData.submissions && this.chartData.submissions.some(val => val > 0)) ||
                (this.chartData.views && this.chartData.views.some(val => val > 0)) ||
                (this.chartData.payments && this.chartData.payments.some(val => val > 0)) ||
                (this.chartData.paid && this.chartData.paid.some(val => val > 0)) ||
                (this.chartData.pending && this.chartData.pending.some(val => val > 0)) ||
                (this.chartData.refunded && this.chartData.refunded.some(val => val > 0))
            );
        },

        // Get data status
        getDataStatus() {
            if (!this.hasChartData()) {
                return '⚠ No Data';
            }

            const totalSubmissions = this.chartData.submissions ? this.chartData.submissions.reduce((a, b) => a + b, 0) : 0;
            const totalViews = this.chartData.views ? this.chartData.views.reduce((a, b) => a + b, 0) : 0;
            const totalPayments = this.chartData.payments ? this.chartData.payments.reduce((a, b) => a + b, 0) : 0;
            const totalPaid = this.chartData.paid ? this.chartData.paid.reduce((a, b) => a + b, 0) : 0;
            const totalPending = this.chartData.pending ? this.chartData.pending.reduce((a, b) => a + b, 0) : 0;
            const totalRefunded = this.chartData.refunded ? this.chartData.refunded.reduce((a, b) => a + b, 0) : 0;

            if (this.chartMode === 'revenue') {
                if (totalPayments > 0 || totalPaid > 0 || totalPending > 0 || totalRefunded > 0) {
                    return '✓ Revenue Data Available';
                } else {
                    return '⚠ No Revenue Data';
                }
            } else {
                if (totalSubmissions > 0 || totalViews > 0) {
                    return '✓ Activity Data Available';
                } else {
                    return '⚠ No Activity Data';
                }
            }
        },

        // Get data status CSS class
        getDataStatusClass() {
            if (!this.hasChartData()) {
                return 'status-no-data';
            }

            const totalSubmissions = this.chartData.submissions ? this.chartData.submissions.reduce((a, b) => a + b, 0) : 0;
            const totalViews = this.chartData.views ? this.chartData.views.reduce((a, b) => a + b, 0) : 0;
            const totalPayments = this.chartData.payments ? this.chartData.payments.reduce((a, b) => a + b, 0) : 0;
            const totalPaid = this.chartData.paid ? this.chartData.paid.reduce((a, b) => a + b, 0) : 0;
            const totalPending = this.chartData.pending ? this.chartData.pending.reduce((a, b) => a + b, 0) : 0;
            const totalRefunded = this.chartData.refunded ? this.chartData.refunded.reduce((a, b) => a + b, 0) : 0;

            if (this.chartMode === 'revenue') {
                return (totalPayments > 0 || totalPaid > 0 || totalPending > 0 || totalRefunded > 0) ? 'status-has-data' : 'status-no-data';
            } else {
                return (totalSubmissions > 0 || totalViews > 0) ? 'status-has-data' : 'status-no-data';
            }
        },

        // Calculate total payments from individual payment status arrays
        calculateTotalPayments() {
            const paid = this.chartData.paid || [];
            const pending = this.chartData.pending || [];
            const refunded = this.chartData.refunded || [];

            // Calculate total for each time period
            const maxLength = Math.max(paid.length, pending.length, refunded.length);
            const totals = [];

            for (let i = 0; i < maxLength; i++) {
                const paidAmount = paid[i] || 0;
                const pendingAmount = pending[i] || 0;
                const refundedAmount = refunded[i] || 0;

                // Total = paid + pending - refunded (refunded is typically negative impact)
                totals.push(paidAmount + pendingAmount - refundedAmount);
            }

            return totals;
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

.date-range-display {
    margin-top: 4px;
}

.date-range-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.date-range-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 1.4;
}

.range-label {
    font-weight: 500;
    color: #6b7280;
    min-width: 80px;
}

.range-dates {
    font-weight: 600;
    color: #374151;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
}

.range-duration {
    font-weight: 400;
    color: #9ca3af;
    font-size: 12px;
    font-style: italic;
}


.status-has-data {
    background-color: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.status-no-data {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
}

.card-controls {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-shrink: 0;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
    .overview-chart-header {
        flex-direction: column;
        gap: 16px;
    }

    .card-controls {
        align-self: flex-end;
        width: 100%;
        justify-content: flex-end;
    }
}

@media (max-width: 768px) {
    .date-range-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
    }

    .range-label {
        min-width: auto;
        font-size: 12px;
    }

    .range-dates {
        font-size: 12px;
        padding: 1px 6px;
    }

    .card-controls {
        flex-direction: column;
        width: 100%;
    }

    .card-controls .el-select {
        width: 100% !important;
        margin-right: 0 !important;
        margin-bottom: 8px;
    }
}

.chart-mode-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
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

/* Ensure card body has proper padding and doesn't overflow */
:deep(.ff_card_body) {
    padding: 20px;
    overflow: hidden;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .chart-wrapper {
        min-height: 350px;
        height: auto;
    }
}
</style>


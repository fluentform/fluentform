<template>
    <div class="ff_card">
        <div class="ff_card_head">
            <h4>Chart Metrics</h4>
        </div>
        <div class="ff_card_body">
            <div class="chart-metrics-selector">
                <div
                    v-for="(metric, index) in availableMetrics"
                    :key="metric.key"
                    :class="['metric-item', { 'last-item': index === availableMetrics.length - 1 }]"
                >
                    <div class="metric-title">
                        {{ metric.title }}
                    </div>
                    <div class="metric-value">
                        <el-checkbox
                            :model-value="internalSelectedMetrics.includes(metric.key)"
                            @change="(checked) => toggleMetric(metric.key)"
                        />
                        <div class="metric-display">
                            <span v-if="metric.showCurrency && hasPayment" class="currency">{{ decodedCurrency }}</span>
                            <span class="value">{{ formatValue(metric.value) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ChartMetricsSelector',
    props: {
        reports: {
            type: Object,
            default: () => ({})
        },
        hasPayment: {
            type: Boolean,
            default: false
        },
        paymentCurrency: {
            type: String,
            default: 'USD'
        },
        selectedMetrics: {
            type: Array,
            default: () => ['submissions', 'views']
        },
        chartMode: {
            type: String,
            default: 'activity' // 'activity' or 'revenue'
        }
    },
    emits: ['metrics-changed'],
    data() {
        return {
            internalSelectedMetrics: this.selectedMetrics || ['submissions', 'views']
        };
    },
    computed: {
        decodedCurrency() {
            return this.decodeHtmlEntities(this.paymentCurrency);
        },

        availableMetrics() {
            const stats = this.reports.form_stats || {};
            const overviewChart = this.reports.overview_chart || {};

            // Define all possible metrics
            const allMetrics = [
                {
                    key: 'submissions',
                    title: 'Submissions',
                    value: stats.total_submissions?.value || 0,
                    showCurrency: false,
                    category: 'activity'
                },
                {
                    key: 'views',
                    title: 'Form Views',
                    value: this.getTotalViews(),
                    showCurrency: false,
                    category: 'activity'
                },
                {
                    key: 'spam',
                    title: 'Spam Submissions',
                    value: stats.spam_submissions?.value || 0,
                    showCurrency: false,
                    category: 'activity'
                },
                {
                    key: 'unread',
                    title: 'Unread Submissions',
                    value: stats.unread_submissions?.value || 0,
                    showCurrency: false,
                    category: 'activity'
                },
                {
                    key: 'read',
                    title: 'Read Submissions',
                    value: stats.read_submissions?.value || 0,
                    showCurrency: false,
                    category: 'activity'
                }
            ];

            // Add payment metrics if payment is enabled
            if (this.hasPayment && stats.total_payments) {
                allMetrics.push({
                    key: 'payments',
                    title: 'Total Payments',
                    value: stats.total_payments?.raw_value || 0,
                    showCurrency: true,
                    category: 'revenue'
                });

                // Add pending payments if available
                if (stats.pending_payments) {
                    allMetrics.push({
                        key: 'pending',
                        title: 'Pending Payments',
                        value: stats.pending_payments?.raw_value || 0,
                        showCurrency: true,
                        category: 'revenue'
                    });
                }

                // Add refunded payments if available
                if (stats.total_refunds) {
                    allMetrics.push({
                        key: 'refunded',
                        title: 'Refunded Payments',
                        value: stats.total_refunds?.raw_value || 0,
                        showCurrency: true,
                        category: 'revenue'
                    });
                }
            }

            // Filter metrics based on chart mode
            if (this.chartMode === 'revenue') {
                return allMetrics.filter(metric => metric.category === 'revenue');
            } else {
                return allMetrics.filter(metric => metric.category === 'activity');
            }
        },
        currencySymbol() {
            const stats = this.reports.form_stats || {};
            if (stats.total_payments && stats.total_payments.currency_symbol) {
                return stats.total_payments.currency_symbol;
            }
            return '$'; // Default fallback
        }
    },
    methods: {
        toggleMetric(metricKey) {
            if (this.internalSelectedMetrics.includes(metricKey)) {
                this.internalSelectedMetrics = this.internalSelectedMetrics.filter(key => key !== metricKey);
            } else {
                this.internalSelectedMetrics.push(metricKey);
            }
            this.$emit('metrics-changed', this.internalSelectedMetrics);
        },

        formatValue(value) {
            if (typeof value === 'number') {
                return value.toLocaleString();
            }
            return value || '0';
        },

        getTotalViews() {
            const overviewChart = this.reports.overview_chart || {};
            if (overviewChart.chart_data && Array.isArray(overviewChart.chart_data)) {
                return overviewChart.chart_data.reduce((total, item) => {
                    return total + (item.views || 0);
                }, 0);
            }
            return 0;
        },

        decodeHtmlEntities(text) {
            if (!text) return '$';
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        }
    },
    watch: {
        chartMode: {
            handler(newMode, oldMode) {
                console.log('ChartMetricsSelector: chartMode changed from', oldMode, 'to', newMode);

                // When chart mode changes, update selected metrics to match available ones
                const availableKeys = this.availableMetrics.map(metric => metric.key);
                console.log('Available metrics for mode', newMode, ':', availableKeys);

                // Filter current selection to only include metrics available in new mode
                const validMetrics = this.internalSelectedMetrics.filter(key => availableKeys.includes(key));
                console.log('Valid metrics from current selection:', validMetrics);

                // If no valid metrics remain, set default based on mode
                if (validMetrics.length === 0) {
                    if (newMode === 'revenue') {
                        // Default to first available payment metric
                        this.internalSelectedMetrics = availableKeys.length > 0 ? [availableKeys[0]] : [];
                    } else {
                        // Default to submissions and views for activity mode
                        this.internalSelectedMetrics = ['submissions', 'views'].filter(key => availableKeys.includes(key));
                    }
                } else {
                    this.internalSelectedMetrics = validMetrics;
                }

                console.log('Updated selected metrics:', this.internalSelectedMetrics);
                // Emit the updated metrics
                this.$emit('metrics-changed', this.internalSelectedMetrics);
            },
            immediate: false
        },
        selectedMetrics: {
            handler(newMetrics) {
                this.internalSelectedMetrics = newMetrics || ['submissions', 'views'];
            },
            immediate: true
        },
        internalSelectedMetrics: {
            handler(newMetrics) {
                this.$emit('metrics-changed', newMetrics);
            },
            immediate: true
        }
    }
};
</script>

<style scoped>
.chart-metrics-selector {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
}

.metric-item.last-item {
    border-bottom: none;
}

.metric-title {
    font-size: 14px;
    color: #6b7280;
    font-weight: 500;
}

.metric-value {
    display: flex;
    align-items: center;
    gap: 12px;
}

.metric-display {
    display: flex;
    align-items: center;
    gap: 4px;
}

.currency {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 500;
}

.value {
    font-size: 16px;
    font-weight: 600;
    color: #1f2937;
}

.el-checkbox {
    margin-right: 0;
}
</style>

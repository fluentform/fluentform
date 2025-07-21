<template>
    <card>
        <card-head>
            <h3>Top Performing Forms</h3>
            <div class="card-controls">
                <el-radio-group
                    v-model="selectedMetric"
                    size="small"
                    @change="handleMetricChange"
                    class="metric-radio-group"
                >
                    <el-radio-button label="entries">Submissions</el-radio-button>
                    <el-radio-button label="payments" v-if="hasPayment">Payments</el-radio-button>
                </el-radio-group>
            </div>
        </card-head>

        <card-body>
            <div class="top-forms-loading" v-if="loading">
                <div class="loading-spinner">
                    <i class="el-icon-loading"></i>
                    <span>Loading top performing forms...</span>
                </div>
            </div>

            <div class="top-forms-chart" v-else>
                <div class="chart-wrapper">
                    <v-chart
                        ref="chart"
                        :option="chartOptions"
                        style="height: 256px;"
                        autoresize
                    />
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
    name: 'TopPerformingForms',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: {
        topFormsData: {
            type: Array,
            default: () => []
        },
        globalDateParams: {
            type: Object,
            default: () => ({})
        },
        hasPayment: {
            type: Boolean,
            default: false
        },
        paymentCurrency: {
            type: String,
            default: '$'
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ['metric-change'],
    data() {
        return {
            selectedMetric: 'entries'
        };
    },
    computed: {
        metricLabel() {
            const labels = {
                entries: 'Submissions',
                payments: 'Total Payments'
            };
            return labels[this.selectedMetric] || 'Submissions';
        },
        chartOptions() {
            if (!this.topFormsData || this.topFormsData.length === 0) {
                return this.getEmptyChartOptions();
            }

            const formNames = this.topFormsData.map(form => this.truncateTitle(form.title));
            const values = this.topFormsData.map(form => form.value || 0);
            const maxValue = Math.max(...values);

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
                        const param = params[0];
                        const originalForm = this.topFormsData[param.dataIndex];
                        return `
                            <div style="font-weight: bold; margin-bottom: 4px;">${originalForm.title}</div>
                            <div>${this.metricLabel}: ${this.formatValue(param.value)}</div>
                        `;
                    }
                },
                grid: {
                    left: '5%',
                    right: '15%',
                    top: '3%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
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
                            if (this.selectedMetric === 'payments') {
                                const currency = this.decodeHtmlEntities(this.paymentCurrency);
                                return `${currency}${this.formatNumber(value)}`;
                            }
                            return this.formatNumber(value);
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#f1f1f1',
                            type: 'dashed'
                        }
                    },
                    max: maxValue * 1.1 // Add 10% padding
                },
                yAxis: {
                    type: 'category',
                    data: formNames,
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        color: '#374151',
                        fontSize: 12,
                        fontWeight: 500
                    }
                },
                series: [{
                    type: 'bar',
                    data: values.map((value, index) => ({
                        value: value,
                        itemStyle: {
                            color: this.getBarColor(index),
                            borderRadius: [0, 2, 2, 0],
                        }
                    })),
                    barWidth: '40%',
                    barMinHeight: 24,
                    label: {
                        show: true,
                        position: 'right',
                        color: '#374151',
                        fontSize: 12,
                        fontWeight: 400,
                        formatter: (params) => {
                            return this.formatValue(params.value);
                        }
                    }
                }]
            };
        }
    },
    methods: {
        handleMetricChange() {
            this.$emit('metric-change', this.selectedMetric);
        },

        truncateTitle(title, maxLength = 25) {
            if (!title) return 'Untitled Form';
            return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
        },

        getBarColor(index) {
            const colors = ['#D5E2FF','#C0D5FF', '#97BAFF', '#6895FF', '#335CFF'];
                if (index < colors.length) {
                    return colors[index];
                }
            return '#D5E2FF';
        },

        formatValue(value) {
            if (this.selectedMetric === 'payments') {
                return this.formatCurrency(value);
            }
            return this.formatNumber(value);
        },

        formatNumber(value) {
            if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
            } else if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
            }
            return value.toFixed(0).toString();
        },

        formatCurrency(value) {
            const formatted = this.formatNumber(value);
            // Decode HTML entities like &#36; to $
            const currency = this.decodeHtmlEntities(this.paymentCurrency);
            return `${currency}${formatted}`;
        },

        decodeHtmlEntities(text) {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        },

        getEmptyChartOptions() {
            return {
                title: {
                    text: 'No Data Available',
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
                }
            };
        }
    }
};
</script>

<style scoped>
.top-forms-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #6b7280;
}

.loading-spinner {
    display: flex;
    align-items: center;
    gap: 8px;
}

.loading-spinner i {
    font-size: 18px;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.chart-wrapper {
    margin-bottom: 8px;
}

.chart-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background-color: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    margin-top: 8px;
}

.summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.summary-label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
}

.summary-value {
    font-size: 14px;
    color: #374151;
    font-weight: 600;
}

.no-data-message {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 100%;
    color: #6b7280;
    font-size: 14px;
}

.no-data-message i {
    font-size: 18px;
}
</style>

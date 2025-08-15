<template>
    <card>
        <card-head>
            <h3>Top Performing Forms</h3>
            <div class="card-controls">
                <el-radio-group
                    v-model="selectedMetric"
                    size="mini"
                    @change="handleMetricChange"
                    class="metric-radio-group"
                >
                    <el-radio-button label="entries">{{ $t('Submissions') }}</el-radio-button>
                    <el-radio-button label="views">{{ $t('Views') }}</el-radio-button>
                    <el-radio-button label="payments" v-if="hasPayment">{{ $t('Payments') }}</el-radio-button>
                </el-radio-group>
            </div>
        </card-head>

        <card-body>
            <chart-loader v-if="loading" :rows="6" />

            <div class="top-forms-chart" v-else>
                <no-data
                    v-if="!topFormsData || topFormsData.length === 0"
                    :message="$t('No form data available for the selected period')"
                />
                <div v-else class="chart-wrapper">
                    <v-chart
                        ref="chart"
                        :option="chartOptions"
                        style="height: 256px;"
                        autoresize
                        @click="handleChartClick"
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
import { COLORS, formatCurrency, formatNumber, ChartLoader, NoData } from './shared/simple-utils.js';

export default {
    name: 'TopPerformingForms',
    components: {
        Card,
        CardBody,
        CardHead,
        ChartLoader,
        NoData
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
                entries: this.$t('Submissions'),
                views: this.$t('Views'),
                payments: this.$t('Total Payments')
            };
            return labels[this.selectedMetric] || this.$t('Submissions');
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
                                return `${currency}${formatNumber(value)}`;
                            }
                            // views and entries are plain numbers
                            return formatNumber(value);
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

        handleChartClick(params) {
            // Handle clicks on form titles (yAxis labels) or bars
            if (params.componentType === 'yAxis' || params.componentType === 'series') {
                const dataIndex = params.componentType === 'yAxis' ? params.value : params.dataIndex;
                const formIndex = params.componentType === 'yAxis'
                    ? this.topFormsData.findIndex(form => this.truncateTitle(form.title) === dataIndex)
                    : dataIndex;

                if (formIndex >= 0 && this.topFormsData[formIndex]) {
                    const formId = this.topFormsData[formIndex].id;

                    const previewUrl = `${window.location.origin}/?fluent_forms_pages=1&design_mode=1&preview_id=${formId}#ff_preview`;
                    window.open(previewUrl, '_blank');
                }
            }
        },

        truncateTitle(title, maxLength = 25) {
            if (!title) return this.$t('Untitled Form');
            return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
        },

        getBarColor(index) {
            const colors = [COLORS.submissions, '#CAC0FF', '#A897FF', '#8C71F6', '#7D52F4'];
            const totalBars = this.topFormsData.length;

            // Always use the strongest colors, starting from the end of the array
            const colorIndex = Math.max(0, colors.length - totalBars) + index;

            if (colorIndex < colors.length) {
                return colors[colorIndex];
            }
            return '#D5E2FF';
        },

        formatValue(value) {
            if (this.selectedMetric === 'payments') {
                return formatCurrency(value, this.decodeHtmlEntities(this.paymentCurrency));
            }
            // views and entries are plain numbers
            return formatNumber(value);
        },

        decodeHtmlEntities(text) {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        },

        getEmptyChartOptions() {
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
                }
            };
        }
    }
};
</script>

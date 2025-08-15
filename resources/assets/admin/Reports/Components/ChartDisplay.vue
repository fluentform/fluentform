<template>
    <div class="report-line-chart">
        <card>
            <card-head>
                <h3>{{ title }}</h3>
                <div class="card-controls">
                    <div class="chart-type-toggle svg-icons" style="margin-right: 12px;">
                        <el-radio-group v-model="chartType" size="mini">
                            <el-radio-button label="line">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="width: 14px; height: 14px; margin-right: 4px;">
                                    <circle cx="8.5" cy="10.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle>
                                    <circle cx="14.5" cy="15.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle>
                                    <circle cx="18.5" cy="7.5" r="1.5" stroke="currentColor" stroke-width="1.5"></circle>
                                    <path d="M15.4341 14.2963L18 9M9.58251 11.5684L13.2038 14.2963M3 19L7.58957 11.8792" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
                                    <path d="M20 21H9C5.70017 21 4.05025 21 3.02513 19.9749C2 18.9497 2 17.2998 2 14V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
                                </svg>
                            </el-radio-button>
                            <el-radio-button label="bar">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="width: 14px; height: 14px; margin-right: 4px;">
                                    <rect x="3" y="8" width="4" height="13" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"></rect>
                                    <rect x="10" y="4" width="4" height="17" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"></rect>
                                    <rect x="17" y="12" width="4" height="9" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"></rect>
                                </svg>
                            </el-radio-button>
                        </el-radio-group>
                    </div>
                </div>
            </card-head>
            <card-body class="line-chart-body">
                <chart-loader v-if="loading" :rows="12" />
                <div class="chart-wrapper">
                    <v-chart
                        v-if="!loading"
                        :option="chartOptions"
                        style="height: 440px;"
                        autoresize
                    />

                    <div class="chart-footer-info">
                        <div class="">
                            <i class="el-icon-top"></i>
                            <span v-if="type === 'revenue'">{{ $t('Total Amount') }}</span>
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
    </div>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";
import { ChartLoader } from './shared/simple-utils.js';

export default {
    name: "ChartDisplay",
    props: ['data', 'title', 'type', 'loading'],
    components: {
        Card,
        CardBody,
        CardHead,
        ChartLoader
    },
    data() {
        return {
            loading: false,
            chartType: 'line', // Default to line chart
            statuses: {
                success: { name: this.$t('Success'), color: '#1FC16B' },
                pending: { name: this.$t('Processing'), color: '#335CFF' },
                failed: { name: this.$t('Failed'), color: '#FB3748' },
                read: { name: this.$t('Read'), color: '#335CFF' },
                unread: { name: this.$t('Unread'), color: '#F6B51E' },
                spam: { name: this.$t('Spam'), color: '#FB3748' },
                trashed: { name: this.$t('Trashed'), color: '#A0AEC0' },
                revenue: {
                    payments: { name: this.$t('Total Revenue'), color: '#7D52F4' },
                    paid: { name: this.$t('Paid'), color: '#23A682' },
                    pending: { name: this.$t('Pending'), color: '#F6B51E' },
                    refunded: { name: this.$t('Refunded'), color: '#FB4BA3' }
                }
            },
        };
    },
    computed: {
        series() {
            if (!this.data) {
                return [];
            }
            const dates = this.data?.dates || this.data.logs_data?.categories;
            const values = this.data?.values || this.data.logs_data?.series;
            if (!values || !dates) {
                return [];
            }
            const series = [];
            let statuses = this.statuses;
            if (this.type === 'revenue') {
                statuses = this.statuses.revenue;
            }
            // Dynamically generate series based on available data
            Object.keys(values || {}).forEach(status => {
                if (statuses[status] && values[status]) {
                    const statusData = [];
                    if (Array.isArray(values[status])) {
                        statusData.push(...values[status]);
                    } else {
                        Object.values(values[status]).forEach(value => {
                            statusData.push(value);
                        });
                    }
                    series.push({
                        name: statuses[status].name,
                        data: statusData,
                        color: statuses[status].color
                    });
                }
            });

            return series;
        },

        dates() {
            return this.data?.dates || this.data?.logs_data?.categories;
        },

        chartOptions() {
            return {
                title: {
                    show: false
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    },
                    formatter: function(params) {
                        let result = `${params[0].axisValue}<br/>`;
                        params.forEach(param => {
                            let value = param.value;
                            if (this.type === 'revenue') {
                                value = this.getCurrencySymbol() + (typeof value === 'number' ? value.toLocaleString() : value);
                            }
                            result += `${param.marker} ${param.seriesName}: ${value}<br/>`;
                        });
                        return result;
                    }.bind(this)
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
                    },
                    data: this.series.map(s => ({
                        name: s.name,
                        icon: 'roundRect',
                    }))
                },
                color: this.series.map(s => s.color),
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '12%',
                    top: '18%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: this.dates || [this.$t('No data')],
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
                    min: 0,
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        color: '#8e8da4',
                        fontSize: 12,
                        formatter: function(value) {
                            if (this.type === 'revenue') {
                                return this.getCurrencySymbol() + (value >= 1000 ? (value/1000).toFixed(1) + 'K' : value);
                            }
                            return value >= 1000 ? (value/1000).toFixed(1) + 'K' : value;
                        }.bind(this)
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#f1f1f1',
                            type: 'dashed'
                        }
                    }
                },
                series: this.series.map(s => {
                    const data = {
                        name: s.name,
                        type: this.chartType,
                        data: s.data,
                        itemStyle: {
                            color: s.color
                        }
                    };

                    // Line chart specific properties
                    if (this.chartType === 'line') {
                        data.smooth = true;
                        data.lineStyle = {
                            width: 3
                        };
                        data.symbol = "circle";
                        data.symbolSize = 5;

                        if (this.type === 'api_logs') {
                            data.areaStyle = {
                                opacity: 0.1
                            };
                        }
                    }

                    // Bar chart specific properties
                    if (this.chartType === 'bar') {
                        data.barWidth = '20%';
                        data.itemStyle.borderRadius = [4, 4, 0, 0];
                    }

                    return data;
                })
            };
        }
    },
    watch: {
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

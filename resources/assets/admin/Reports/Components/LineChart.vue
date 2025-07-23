<template>
    <div class="report-line-chart">
        <card>
            <card-head class="line-chart-header">
                <h3>{{ title }}</h3>
            </card-head>
            <card-body class="line-chart-body">
                <div v-if="loading" class="loading-overlay">
                    <div class="loading-spinner">
                        <i class="el-icon-loading"></i>
                        <span>{{ $t('Loading data...') }}</span>
                    </div>
                </div>
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

export default {
    name: "LineChart",
    props: ['data', 'title', 'type'],
    components: {
        Card,
        CardBody,
        CardHead,
    },
    data() {
        return {
            loading: false,
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
                    formatter: (params) => {
                        let result = `${params[0].axisValue}<br/>`;
                        params.forEach(param => {
                            let value = param.value;
                            if (this.type === 'revenue') {
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
                        formatter: (value) => {
                            if (this.type === 'revenue') {
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
                series: this.series.map(s => {
                    const data = {
                        name: s.name,
                        type: "line",
                        data: s.data,
                        smooth: true,
                        lineStyle: {
                            width: 3
                        },
                        itemStyle: {
                            color: s.color
                        },
                        symbol: "circle",
                        symbolSize: 5
                    };

                    if (this.type === 'api_logs') {
                        data.areaStyle = {
                            opacity: 0.1
                        };
                    }
                    return data;
                })
            };
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

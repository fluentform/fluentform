<template>
    <div class="api-logs">
        <card>
            <card-head class="api-logs-header">
                <h3>API Logs</h3>
            </card-head>
            <card-body class="api-logs-body">
                <div v-if="loading" class="loading-overlay">
                    <div class="loading-spinner">
                        <i class="el-icon-loading"></i>
                        <span>Loading data...</span>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <v-chart
                        v-if="!loading"
                        :option="chartOptions"
                        style="height: 400px;"
                        autoresize
                    />
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
    name: "ApiLogs",
    props: ['api_logs', 'global_date_params'],
    components: {
        Card,
        CardBody,
        CardHead,
    },
    data() {
        return {
            loading: false,
            viewMode: 'counts', // 'counts' or 'timeline'
            totalLogsByStatus: {
                success: 0,
                pending: 0,
                failed: 0
            }
        };
    },
    computed: {
        series() {
            if (!this.api_logs || !this.api_logs.logs_data) {
                return [
                    { name: 'Success', data: [0, 0, 0, 0, 0] },
                    { name: 'Processing', data: [0, 0, 0, 0, 0] },
                    { name: 'Failed', data: [0, 0, 0, 0, 0] }
                ];
            }

            const data = this.api_logs.logs_data;

            const successData = [];
            const pendingData = [];
            const failedData = [];

            // For each category (formatted date like "Mar 18")
            for (let i = 0; i < data.categories.length; i++) {
                // Get the corresponding full date key (like "2025-03-18")
                const fullDateKey = Object.keys(data.series.success)[i];

                // Get the values from the corresponding full date keys
                successData.push(data.series.success[fullDateKey] || 0);
                pendingData.push(data.series.pending[fullDateKey] || 0);
                failedData.push(data.series.failed[fullDateKey] || 0);
            }

            return [
                {
                    name: 'Success',
                    data: successData
                },
                {
                    name: 'Processing',
                    data: pendingData
                },
                {
                    name: 'Failed',
                    data: failedData
                }
            ];
        },

        chartOptions() {
            const categories = this.api_logs?.logs_data?.categories || ['No data'];
            const colors = ['#22c55e', '#4f46e5', '#ef4444']; // Success, Processing, Failed

            return {
                title: {
                    show: false
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
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
                        fontSize: 14
                    },
                    itemStyle: {
                        borderWidth: 0
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.3)'
                        }
                    },
                    data: [
                        {
                            name: 'Success',
                            icon: 'circle'
                        },
                        {
                            name: 'Processing',
                            icon: 'circle'
                        },
                        {
                            name: 'Failed',
                            icon: 'circle'
                        }
                    ]
                },
                color: colors,
                grid: {
                    left: '2%',
                    right: '2%',
                    bottom: '2%',
                    top: '15%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: categories,
                    axisTick: {
                        show: false
                    },
                    axisLine: {
                        show: false
                    },
                    axisLabel: {
                        color: '#666',
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
                        color: '#666',
                        fontSize: 12,
                        formatter: function(val) {
                            return Math.round(val);
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#e0e0e0',
                            type: 'dashed'
                        }
                    }
                },
                series: this.series.map((serie, index) => ({
                    name: serie.name,
                    type: 'line',
                    data: serie.data,
                    smooth: true,
                    lineStyle: {
                        width: 3
                    },
                    itemStyle: {
                        color: colors[index]
                    },
                    symbol: 'circle',
                    symbolSize: 5
                }))
            };
        }
    },
    watch: {
        api_logs: {
            handler(newData) {
                if (newData && newData.logs_data) {
                    // Update totals
                    this.totalLogsByStatus = {
                        success: newData.totals?.success || 0,
                        pending: newData.totals?.pending || 0,
                        failed: newData.totals?.failed || 0
                    };

                    this.loading = false;
                }
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        disableFutureDates(date) {
            return date > new Date();
        },

        getTotalByStatus(status) {
            return this.totalLogsByStatus[status] || 0;
        }
    }
};
</script>
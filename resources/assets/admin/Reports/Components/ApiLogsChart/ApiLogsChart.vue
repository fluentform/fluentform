<template>
    <div class="line-chart-container">
        <card>
            <card-head class="d-flex justify-between">
                <h3>API Logs</h3>
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="Start date"
                    end-placeholder="End date"
                    format="MMM d, yyyy"
                    value-format="MMM d, yyyy"
                    :default-time="['00:00:00', '23:59:59']"
                    @change="handleDateChange"
                    :disabledDate="disableFutureDates"
                />
            </card-head>
            <card-body>
                <div v-if="loading" class="loading-overlay">
                    <div class="loading-spinner">
                        <i class="el-icon-loading"></i>
                        <span>Loading data...</span>
                    </div>
                </div>
                <div class="chart-legend">
                    <div class="legend-item">
                        <span class="legend-dot success"></span>
                        <span>Success ({{ getTotalByStatus('success') }})</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot processing"></span>
                        <span>Processing ({{ getTotalByStatus('pending') }})</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot failed"></span>
                        <span>Failed ({{ getTotalByStatus('failed') }})</span>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <apexchart
                        v-if="!loading"
                        type="line"
                        height="400"
                        :options="chartOptions"
                        :series="series"
                    />
                </div>
                <div class="chart-nav">
                    <div class="nav-item">
                        <i class="el-icon-top"></i> Total Counts
                    </div>
                    <div class="nav-item">
                        Timeline <i class="el-icon-right"></i>
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
    name: "ApiLogs",
    props: ['api_logs'],
    emits: ['api-logs-date-change'],
    components: {
        Card,
        CardBody,
        CardHead,
    },
    data() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        return {
            loading: false,
            dateRange: [
                this.formatDateForDisplay(thirtyDaysAgo),
                this.formatDateForDisplay(now)
            ],
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
            if (!this.api_logs || !this.api_logs.logs_data) {
                return this.getDefaultChartOptions(['No data']);
            }

            return this.getDefaultChartOptions(this.api_logs.logs_data.categories);
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
        },

        handleDateChange(range) {
            if (!range || !range[0] || !range[1]) return;

            // Parse the date strings
            const startParts = range[0].split(" ");
            const startMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(startParts[0]);
            const startDay = parseInt(startParts[1].replace(',', ''));
            const startYear = parseInt(startParts[2]);

            const endParts = range[1].split(" ");
            const endMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(endParts[0]);
            const endDay = parseInt(endParts[1].replace(',', ''));
            const endYear = parseInt(endParts[2]);

            // Create Date objects
            const startDate = new Date(startYear, startMonth, startDay);
            const endDate = new Date(endYear, endMonth, endDay);

            // Format dates for API
            const formatDateForApi = (date, isStart) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const time = isStart ? '00:00:00' : '23:59:59';
                return `${year}-${month}-${day} ${time}`;
            };

            this.loading = true;

            // Emit event to parent
            this.$emit('api-logs-date-change', {
                startDate: formatDateForApi(startDate, true),
                endDate: formatDateForApi(endDate, false)
            });
        },

        formatDateForDisplay(date) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        },

        getDefaultChartOptions(categories) {
            return {
                chart: {
                    type: 'line',
                    toolbar: {
                        show: false
                    },
                    zoom: {
                        enabled: false
                    }
                },
                animations: {
                    enabled: true
                },
                colors: ['#22c55e', '#4f46e5', '#ef4444'], // Green, Blue, Red
                stroke: {
                    curve: 'smooth',
                    width: 3
                },
                grid: {
                    borderColor: '#e0e0e0',
                    row: {
                        colors: ['transparent'],
                        opacity: 0.5
                    },
                    xaxis: {
                        lines: {
                            show: false
                        }
                    },
                    yaxis: {
                        lines: {
                            show: true,
                            borderColor: '#e0e0e0',
                            strokeDashArray: 5
                        }
                    },
                },
                markers: {
                    size: 5,
                    hover: {
                        size: 7
                    }
                },
                xaxis: {
                    categories: categories,
                    labels: {
                        style: {
                            colors: '#666',
                            fontSize: '12px'
                        }
                    },
                    axisBorder: {
                        show: false
                    },
                    axisTicks: {
                        show: false
                    }
                },
                yaxis: {
                    min: 0,
                    tickAmount: 5,
                    labels: {
                        style: {
                            colors: '#666',
                            fontSize: '12px'
                        },
                        formatter: function(val) {
                            return Math.round(val);
                        }
                    }
                },
                legend: {
                    show: false // Using custom legend
                },
                dataLabels: {
                    enabled: false
                },
                tooltip: {
                    enabled: true,
                    shared: true,
                    intersect: false,
                    followCursor: false,
                    marker: {
                        show: true
                    },
                    x: {
                        show: true
                    },
                    y: {
                        formatter: function(val) {
                            return Math.round(val);
                        }
                    }
                }
            };
        }
    }
};
</script>

<style scoped>
.line-chart-container {
    background-color: #fff;
    border-radius: 8px;
    position: relative;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.loading-spinner i {
    font-size: 32px;
    color: #7B5CFA;
}

.chart-legend {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    margin-right: 20px;
    margin-bottom: 10px;
}

.legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 8px;
}

.legend-dot.success {
    background-color: #22c55e;
}

.legend-dot.processing {
    background-color: #4f46e5;
}

.legend-dot.failed {
    background-color: #ef4444;
}

.chart-wrapper {
    height: 400px;
    position: relative;
}

.no-data {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #909399;
    font-size: 16px;
}

.chart-stats {
    display: flex;
    margin: 20px 0;
    flex-wrap: wrap;
    border-top: 1px solid #EBEEF5;
    border-bottom: 1px solid #EBEEF5;
    padding: 15px 0;
}

.stat-item {
    margin-right: 40px;
    padding: 5px 0;
}

.stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
}

.stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 5px;
}

.chart-nav {
    display: flex;
    margin-top: 20px;
}

.nav-item {
    display: flex;
    align-items: center;
    color: #303133;
    margin-right: 30px;
    cursor: pointer;
    font-weight: 500;
}

.nav-item i {
    margin: 0 5px;
}

@media (max-width: 768px) {
    .chart-legend, .chart-stats {
        flex-direction: column;
    }

    .legend-item, .stat-item {
        margin-bottom: 10px;
    }
}
</style>
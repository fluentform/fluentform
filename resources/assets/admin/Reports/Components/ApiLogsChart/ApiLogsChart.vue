<template>
    <div class="line-chart-container">
        <card>
            <card-head class="d-flex justify-between">
                <h3>Api Logs</h3>
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="Start date"
                    end-placeholder="End date"
                    format="MMM d, yyyy"
                    value-format="MMM d, yyyy"
                    :default-time="['00:00:00', '23:59:59']"
                />
            </card-head>
            <card-body>
                <div class="chart-legend">
                    <div class="legend-item">
                        <span class="legend-dot success"></span>
                        <span>Success</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot processing"></span>
                        <span>Processing</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-dot failed"></span>
                        <span>Failed</span>
                    </div>
                </div>
                <div class="chart-wrapper">
                    <apexchart
                        type="line"
                        height="400"
                        :options="chartOptions"
                        :series="series"
                    />
                </div>
                <div class="chart-nav">
                    <div class="nav-item active">
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
    components: {
        Card,
        CardBody,
        CardHead,
    },
    data() {
        return {
            dateRange: ['Jan 1, 2023', 'Dec 30, 2023'],
            series: [
                {
                    name: 'Success',
                    data: [100, 140, 160, 170, 180, 160, 200, 200, 200, 200, 200, 200]
                },
                {
                    name: 'Processing',
                    data: [60, 80, 80, 100, 100, 80, 80, 80, 120, 140, 150, 170]
                },
                {
                    name: 'Failed',
                    data: [10, 30, 30, 15, 40, 55, 40, 40, 40, 40, 60, 55]
                }
            ],
            chartOptions: {
                chart: {
                    type: 'line',
                    toolbar: {
                        show: false
                    },
                    zoom: {
                        enabled: false
                    }
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
                    categories: ['Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023', 'Jul 2023', 'Aug 2023', 'Sep 2023', 'Oct 2023', 'Nov 2023', 'Dec 2023'],
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
                    max: 350,
                    tickAmount: 7,
                    labels: {
                        style: {
                            colors: '#666',
                            fontSize: '12px'
                        },
                        formatter: function(val) {
                            return val === 0 ? '00' : val;
                        }
                    }
                },
                legend: {
                    show: false // Using custom legend
                },
                dataLabels: {
                    enabled: true,
                    enabledOnSeries: [0], // Only show on Success series
                    formatter: function(val, opts) {
                        return '';
                    },
                    style: {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        colors: ['#333']
                    },
                    background: {
                        enabled: false
                    },
                    offsetY: -10
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
                        formatter: function(val, opts) {
                            // Add the series name to clearly identify each value
                            return val;
                        }
                    }
                }
            }
        };
    }
};
</script>

<style scoped>
.line-chart-container {
    background-color: #fff;
    border-radius: 8px;
}

.chart-legend {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.legend-item {
    display: flex;
    align-items: center;
    margin-right: 20px;
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
}

.chart-nav {
    display: flex;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #EBEEF5;
}

.nav-item {
    display: flex;
    align-items: center;
    color: #606266;
    margin-right: 30px;
    cursor: pointer;
}

.nav-item.active {
    color: #303133;
    font-weight: 500;
}

.nav-item i {
    margin: 0 5px;
}
</style>
<template>
    <div class="chart-container">
        <card>
            <card-head class="d-flex justify-between">
                <h3>Conversion Chart</h3>
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="Start date"
                    end-placeholder="End date"
                    :default-time="['00:00:00', '23:59:59']"
                    value-format="MMM d, yyyy"
                    format="MMM d, yyyy"
                />
            </card-head>
            <card-body>
                <!-- Series legend and toggles -->
                <div class="chart-controls">
                    <div class="chart-legend">
                        <div class="legend-item" v-if="!viewPayments && !viewConversion">
                            <span class="legend-dot entries"></span>
                            <span>Entries</span>
                        </div>
                        <div class="legend-item" v-if="viewConversion">
                            <span class="legend-dot views"></span>
                            <span>Views</span>
                        </div>
                        <div class="legend-item" v-if="viewConversion">
                            <span class="legend-dot conversions"></span>
                            <span>Conversions</span>
                        </div>
                        <div class="legend-item" v-if="viewPayments">
                            <span class="legend-dot payments"></span>
                            <span>Payments</span>
                        </div>
                    </div>
                    <div class="toggles-container">
                        <div class="toggle-item">
                            <el-switch v-model="viewConversion" @change="handleConversionToggle"></el-switch>
                            <span class="toggle-label">View Conversion</span>
                            <i class="el-icon-question info-icon" title="Show conversion data"></i>
                        </div>
                        <div class="toggle-item">
                            <el-switch v-model="viewPayments" @change="handlePaymentsToggle"></el-switch>
                            <span class="toggle-label">View Payments</span>
                            <i class="el-icon-question info-icon" title="Show payment data"></i>
                        </div>
                    </div>
                </div>

                <!-- Chart -->
                <div class="chart-wrapper">
                    <apexchart
                        type="bar"
                        height="400"
                        :options="chartOptions"
                        :series="currentSeries"
                    />
                </div>

                <!-- Navigation buttons -->
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
    name: 'ConversionChart',
    components: {
        Card,
        CardBody,
        CardHead,
    },
    data() {
        return {
            dateRange: ['Jan 1, 2023', 'Jul 30, 2023'],
            viewConversion: false, // Toggle for conversion data
            viewPayments: false,   // Toggle for payment data
            allSeries: [
                {
                    name: 'Views',
                    type: 'column',
                    data: [300, 200, 140, 230, 470, 170, 240]
                },
                {
                    name: 'Entries',
                    type: 'column',
                    data: [100, 70, 70, 60, 100, 45, 160]
                },
                {
                    name: 'Conversions',
                    type: 'column',
                    data: [40, 60, 25, 30, 35, 15, 50]
                },
                {
                    name: 'Payments',
                    type: 'column',
                    data: [25, 40, 15, 20, 25, 10, 35]
                }
            ],
            chartOptions: {
                chart: {
                    type: 'bar',
                    toolbar: {
                        show: false
                    },
                    stacked: false
                },
                colors: ['#72d0ff', '#7B5CFA', '#FFC107', '#4CAF50'], // Blue, Purple, Yellow, Green
                plotOptions: {
                    bar: {
                        borderRadius: 4,
                        columnWidth: '60%',
                        borderRadiusApplication: 'end',
                        dataLabels: {
                            position: 'top'
                        }
                    }
                },
                dataLabels: {
                    enabled: true,
                    formatter: function(val, opts) {
                        // Only show label for "Views" series in March (index 2)
                        // const dataPointIndex = opts.dataPointIndex;
                        // const seriesIndex = opts.seriesIndex;
                        // if (seriesIndex === 0 && dataPointIndex === 2) {
                        //     return val;
                        // }
                        return '';
                    },
                    offsetY: -20,
                    style: {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        colors: ['#333']
                    }
                },
                stroke: {
                    width: 0
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
                xaxis: {
                    categories: ['Jan 2023', 'Feb 2023', 'Mar 2023', 'Apr 2023', 'May 2023', 'Jun 2023', 'July 2023'],
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
                    max: 500,
                    tickAmount: 5,
                    labels: {
                        style: {
                            colors: '#666',
                            fontSize: '12px'
                        }
                    }
                },
                legend: {
                    show: false // Using custom legend
                },
                tooltip: {
                    shared: true,
                    intersect: false,
                    y: {
                        formatter: function(val) {
                            return val;
                        }
                    }
                }
            }
        };
    },
    computed: {
        // Dynamic series based on toggle states
        currentSeries() {
            // If payments toggle is on, show only payments
            if (this.viewPayments) {
                return [this.allSeries[3]]; // Only show Payments
            }

            // If conversion toggle is on, show Views and Conversions
            if (this.viewConversion) {
                return [this.allSeries[0], this.allSeries[1], this.allSeries[2]]; // Views, Entries, Conversions
            }

            // Default: show only Entries
            return [this.allSeries[1]];
        }
    },
    methods: {
        // Make the toggles mutually exclusive
        handleConversionToggle(val) {
            if (val && this.viewPayments) {
                this.viewPayments = false;
            }
        },
        handlePaymentsToggle(val) {
            if (val && this.viewConversion) {
                this.viewConversion = false;
            }
        },
        updateChart() {
            this.$nextTick(() => {
                // Any chart updates needed
            });
        }
    }
};
</script>

<style scoped>
.chart-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.chart-legend {
    display: flex;
    align-items: center;
    flex-wrap: wrap; /* Allow legend items to wrap on smaller screens */
}

.legend-item {
    display: flex;
    align-items: center;
    margin-right: 20px;
    margin-bottom: 8px; /* Add some space when they wrap */
}

.legend-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    display: inline-block;
    margin-right: 8px;
}

.legend-dot.entries {
    background-color: #7B5CFA; /* Purple */
}

.legend-dot.views {
    background-color: #72d0ff; /* Blue */
}

.legend-dot.conversions {
    background-color: #FFC107; /* Yellow */
}

.legend-dot.payments {
    background-color: #4CAF50; /* Green */
}

/* Changed to horizontal layout */
.toggles-container {
    display: flex;
    flex-direction: row;
    align-items: center;
}

.toggle-item {
    display: flex;
    align-items: center;
    margin-left: 20px; /* Space between toggles */
}

.toggle-label {
    margin-left: 8px;
    color: #606266;
}

.info-icon {
    color: #C0C4CC;
    margin-left: 5px;
    font-size: 16px;
    cursor: pointer;
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

/* Responsive adjustments */
@media (max-width: 768px) {
    .chart-controls {
        flex-direction: column;
        align-items: flex-start;
    }

    .toggles-container {
        margin-top: 15px;
        width: 100%;
        justify-content: flex-start;
    }

    .toggle-item:first-child {
        margin-left: 0;
    }

    .chart-legend {
        margin-bottom: 10px;
    }
}
</style>
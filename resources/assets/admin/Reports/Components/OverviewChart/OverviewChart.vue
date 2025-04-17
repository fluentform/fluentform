<template>
    <div class="chart-container">
        <card>
            <card-head class="d-flex justify-between">
                <h3>Overview Chart</h3>
                <div>
                    <el-select clearable class="form-stats-selectable" v-model="selectedRange" @change="handleRangeChange">
                        <el-option label="Today" value="today"></el-option>
                        <el-option label="Last Week" value="week"></el-option>
                        <el-option label="Last Month" value="month"></el-option>
                        <el-option label="Last Year" value="year"></el-option>
                    </el-select>
                    <el-date-picker
                        v-model="dateRange"
                        type="daterange"
                        range-separator="-"
                        start-placeholder="Start date"
                        end-placeholder="End date"
                        :default-time="['00:00:00', '23:59:59']"
                        value-format="MMM d, yyyy"
                        format="MMM d, yyyy"
                        @change="handleDateRangeChange"
                    />
                </div>
            </card-head>
            <card-body>
                <!-- Series legend and toggles -->
                <div class="chart-controls">
                    <div class="chart-legend">
                        <div class="legend-item" v-if="!viewPayments">
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
                    <div class="view-selector">
                        <el-select v-model="activeView" placeholder="Select view" size="medium">
                            <el-option
                                v-for="item in viewOptions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value">
                            </el-option>
                        </el-select>
                    </div>
                </div>

                <!-- Chart -->
                <div class="chart-wrapper">
                    <apexchart
                        ref="chart"
                        type="bar"
                        height="420"
                        :options="chartOptions"
                        :series="currentSeries"
                    />
                </div>

                <!-- Navigation buttons -->
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
    name: 'OverviewChart',
    components: {
        Card,
        CardBody,
        CardHead,
    },
    props: ['overview_chart'],
    emits: ['handleRangeChange', 'handleDateRangeChange', 'date-change'],
    data() {
        return {
            dateRange: null,
            activeView: 'entries',
            selectedRange: 'month',
            viewOptions: [
                {value: 'entries', label: 'Entries'},
                {value: 'conversion', label: 'Conversion'},
                {value: 'payments', label: 'Payments'}
            ],
            allSeries: [
                {name: 'Views', type: 'column', data: []},
                {name: 'Entries', type: 'column', data: []},
                {name: 'Conversions', type: 'column', data: []},
                {name: 'Payments', type: 'column', data: []}
            ],
            categories: [],
            isLoading: false,
            lastUsedSelector: 'range',
            chartOptions: {
                chart: {
                    type: 'bar',
                    toolbar: {
                        show: false,
                    },
                    zoom: {
                        enabled: false,
                    },
                    stacked: false,
                    animations: {
                        enabled: true,
                        easing: 'easeinout',
                        speed: 800,
                        animateGradually: {
                            enabled: true,
                            delay: 150
                        },
                        dynamicAnimation: {
                            enabled: true,
                            speed: 350
                        }
                    }
                },
                colors: ['#28a7f0', '#7B5CFA', '#FFC107', '#4CAF50'], // Blue, Purple, Yellow, Green
                plotOptions: {
                    bar: {
                        borderRadius: 4,
                        columnWidth: '60%',
                        borderRadiusApplication: 'end',
                        dataLabels: {
                            enabled: false
                        }
                    }
                },
                dataLabels: {
                    enabled: false,
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
                    type: 'category',
                    categories: [],
                    labels: {
                        style: {
                            colors: '#666',
                            fontSize: '12px'
                        },
                        rotate: -45,
                        rotateAlways: false,
                        hideOverlappingLabels: true,
                        trim: true,
                        maxHeight: 120
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
                        }
                    },
                    forceNiceScale: true,
                    decimalsInFloat: 0
                },
                legend: {
                    show: false,
                },
                tooltip: {
                    shared: true,
                    intersect: false,
                },
            }
        };
    },
    computed: {
        currentSeries() {
            if (this.activeView === 'payments') {
                return [this.allSeries[3]];
            } else if (this.activeView === 'conversion') {
                return [
                    {
                        name: 'Views',
                        type: 'column',
                        data: this.allSeries[0].data
                    },
                    {
                        name: 'Submissions',
                        type: 'column',
                        data: this.allSeries[1].data
                    },
                    {
                        name: 'Conversion Rate',
                        type: 'column', // Changed from 'line' to 'column'
                        data: this.allSeries[2].data
                    }
                ];
            } else {
                return [this.allSeries[1]]; // Default: show only Entries
            }
        },

        viewConversion() {
            return this.activeView === 'conversion';
        },

        viewPayments() {
            return this.activeView === 'payments';
        }
    },
    methods: {
        handleRangeChange() {
            this.lastUsedSelector = 'range';
            this.dateRange = null;
            this.emitDateChange();
        },

        handleDateRangeChange() {
            this.lastUsedSelector = 'datepicker';
            this.selectedRange = null;
            this.emitDateChange();
        },

        emitDateChange() {
            let startDate, endDate;
            const today = new Date();

            if (this.lastUsedSelector === 'range' || !this.dateRange) {
                if (this.selectedRange === 'today') {
                    startDate = this.formatDateForApi(today, true);
                    endDate = this.formatDateForApi(today, false);
                } else if (this.selectedRange === 'week') {
                    const now = new Date();
                    const firstDay = new Date(now);
                    firstDay.setDate(now.getDate() - 6);
                    let lastDay = new Date(now);
                    lastDay = this.ensureDateNotFuture(lastDay);
                    startDate = this.formatDateForApi(firstDay, true);
                    endDate = this.formatDateForApi(lastDay, false);
                } else if (this.selectedRange === 'month') {
                    const now = new Date();
                    const firstDay = new Date(now);
                    firstDay.setDate(now.getDate() - 29);
                    let lastDay = new Date(now);
                    lastDay = this.ensureDateNotFuture(lastDay);
                    startDate = this.formatDateForApi(firstDay, true);
                    endDate = this.formatDateForApi(lastDay, false);
                } else if (this.selectedRange === 'year') {
                    const now = new Date();
                    const firstDay = new Date(now);
                    firstDay.setFullYear(now.getFullYear() - 1);
                    let lastDay = new Date(now);
                    lastDay = this.ensureDateNotFuture(lastDay);
                    startDate = this.formatDateForApi(firstDay, true);
                    endDate = this.formatDateForApi(lastDay, false);
                }
            } else if (this.lastUsedSelector === 'datepicker' && this.dateRange && this.dateRange.length === 2) {
                try {
                    let startObj = new Date(this.dateRange[0]);
                    let endObj = new Date(this.dateRange[1]);
                    endObj = this.ensureDateNotFuture(endObj);
                    startDate = this.formatDateForApi(startObj, true);
                    endDate = this.formatDateForApi(endObj, false);
                } catch (e) {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDay = new Date(now);
                    startDate = this.formatDateForApi(firstDay, true);
                    endDate = this.formatDateForApi(lastDay, false);
                }
            }

            // Emit the event with date range and view
            this.$emit('date-change', {
                startDate,
                endDate,
                view: this.activeView
            });
        },

        formatDateForApi(date, isStart) {
            const d = new Date(date);

            if (!isStart) {
                const today = new Date();
                today.setHours(23, 59, 59, 999);

                if (d > today) {
                    d.setTime(today.getTime());
                }
            }

            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');

            const time = isStart ? '00:00:00' : '23:59:59';
            const formattedDate = `${year}-${month}-${day} ${time}`;

            return formattedDate;
        },

        ensureDateNotFuture(date) {
            const today = new Date();
            today.setHours(23, 59, 59, 999); // Set to end of today

            const dateObj = new Date(date);

            if (dateObj > today) {
                return today;
            }

            return dateObj;
        },

        updateChartForCurrentView() {
            if (!this.overview_chart) return;

            const data = this.overview_chart;
            const values = data.values ? data.values.map(Number) : [];

            this.categories = data.dates || [];

            // Assign values to the correct series based on active view
            if (this.activeView === 'payments') {
                this.allSeries[3].data = values;
                this.allSeries[0].data = Array(values.length).fill(0);
                this.allSeries[1].data = Array(values.length).fill(0);
                this.allSeries[2].data = Array(values.length).fill(0);

                // Update Y-axis for payments
                this.updateChartOptions({
                    colors: ['#4CAF50'],
                    xaxis: {
                        categories: this.categories, // Add this line to update x-axis
                        type: 'category'
                    },
                    yaxis: {
                        decimalsInFloat: 2,
                        labels: {
                            formatter: function(val) {
                                return '$' + parseFloat(val).toFixed(2);
                            }
                        }
                    }
                });
            } else if (this.activeView === 'conversion' && data.views && data.submissions && data.conversion_rates) {
                this.allSeries[0].data = data.views.map(Number);
                this.allSeries[1].data = data.submissions.map(val => Number(val) * 2);
                this.allSeries[2].data = data.conversion_rates.map(Number);


                this.updateChartOptions({
                    chart: {
                        type: 'bar',
                        stacked: false
                    },
                    colors: ['#28a7f0', '#7B5CFA', '#FFC107'], // Blue, Purple, Yellow
                    plotOptions: {
                        bar: {
                            columnWidth: '65%',
                            distributed: false
                        }
                    },
                    xaxis: {
                        categories: this.categories,
                        type: 'category'
                    },
                    yaxis: {
                        min: 0,
                        forceNiceScale: true,
                        decimalsInFloat: 0,
                        labels: {
                            formatter: function(val) {
                                return Math.floor(val);
                            }
                        }
                    },
                    tooltip: {
                        shared: true,
                        intersect: false,
                        y: {
                            formatter: function(value, { seriesIndex }) {
                                if (seriesIndex === 0) {
                                    return `Views: ${value}`;
                                } else if (seriesIndex === 1) {
                                    return `Submissions: ${value / 2}`;
                                } else {
                                    return `Conversion: ${value}%`;
                                }
                            }
                        }
                    }
                });
            } else { // entries
                this.allSeries[1].data = values;
                this.allSeries[0].data = Array(values.length).fill(0);
                this.allSeries[2].data = Array(values.length).fill(0);
                this.allSeries[3].data = Array(values.length).fill(0);

                // Update Y-axis for entries
                this.updateChartOptions({
                    colors: ['#7B5CFA'],
                    xaxis: {
                        categories: this.categories, // Add this line to update x-axis
                        type: 'category'
                    },
                    yaxis: {
                        decimalsInFloat: 0,
                        labels: {
                            formatter: function(val) {
                                return Math.floor(val);
                            }
                        }
                    }
                });
            }

            // Force chart update with new series
            this.$nextTick(() => {
                if (this.$refs.chart) {
                    this.$refs.chart.updateSeries(this.currentSeries);
                }
            });
        },

        updateChartOptions(newOptions) {
            if (!this.$refs.chart) return;

            this.$refs.chart.updateOptions(newOptions, false, true);
        },

        processChartData() {
            if (!this.overview_chart) return;

            const data = this.overview_chart;

            this.categories = this.overview_chart.dates || [];

            // Update chart options to use categories
            if (this.$refs.chart) {
                this.$refs.chart.updateOptions({
                    xaxis: {
                        categories: this.categories,
                        type: 'category'  // Ensure this is always set
                    }
                });
            }

            // Handle different data format for conversion view
            if (this.activeView === 'conversion') {
                // For conversion view, data is already in the right format
                this.categories = data.dates || [];
                this.allSeries[0].data = data.views || [];
                this.allSeries[1].data = data.submissions || [];
                this.allSeries[2].data = data.conversion_rates || [];

                // Setup for dual-axis chart
                this.updateChartOptions({
                    chart: {
                        type: 'line',
                        stacked: false
                    },
                    stroke: {
                        width: [0, 0, 3], // Bar, bar, line
                        curve: 'smooth'
                    },
                    colors: ['#28a7f0', '#7B5CFA', '#FFC107'], // Blue, Purple, Yellow
                    xaxis: {
                        categories: this.categories,
                        type: 'category'
                    },
                    yaxis: [
                        {
                            title: {
                                text: 'Count'
                            },
                            decimalsInFloat: 0
                        },
                        {
                            opposite: true,
                            title: {
                                text: 'Conversion %'
                            },
                            min: 0,
                            max: 100,
                            decimalsInFloat: 1,
                            labels: {
                                formatter: function(val) {
                                    return val.toFixed(1) + '%';
                                }
                            }
                        }
                    ],
                    tooltip: {
                        shared: true,
                        intersect: false,
                        y: {
                            formatter: function(value, { seriesIndex, dataPointIndex }) {
                                const formCount = data.form_counts ? data.form_counts[dataPointIndex] : 0;

                                if (seriesIndex === 0) {
                                    return `Views: ${value}${formCount ? ` (${formCount} forms)` : ''}`;
                                } else if (seriesIndex === 1) {
                                    return `Submissions: ${value}`;
                                } else {
                                    return `Conversion: ${value.toFixed(2)}%`;
                                }
                            }
                        }
                    }
                });
            } else {
                this.categories = data.dates || [];

                if (data.values) {
                    const values = data.values.map(Number);

                    if (this.activeView === 'payments') {
                        this.allSeries[3].data = values;
                        this.allSeries[0].data = Array(values.length).fill(0);
                        this.allSeries[1].data = Array(values.length).fill(0);
                        this.allSeries[2].data = Array(values.length).fill(0);

                        // Update chart options for payments
                        this.updateChartOptions({
                            colors: ['#4CAF50'], // Green for payments
                            yaxis: {
                                decimalsInFloat: 2,
                                labels: {
                                    formatter: function(val) {
                                        return '$' + parseFloat(val).toFixed(2);
                                    }
                                }
                            }
                        });
                    } else {
                        // Entries view
                        this.allSeries[1].data = values;
                        this.allSeries[0].data = Array(values.length).fill(0);
                        this.allSeries[2].data = Array(values.length).fill(0);
                        this.allSeries[3].data = Array(values.length).fill(0);

                        // Update chart options for entries
                        this.updateChartOptions({
                            colors: ['#7B5CFA'],
                            xaxis: {
                                categories: this.categories, // Add this line to update x-axis
                                type: 'category'
                            },
                            yaxis: {
                                decimalsInFloat: 0,
                                labels: {
                                    formatter: function(val) {
                                        return Math.floor(val);
                                    }
                                }
                            }
                        });
                    }
                }
            }

            // Force chart update
            this.$nextTick(() => {
                if (this.$refs.chart) {
                    this.$refs.chart.updateSeries(this.currentSeries);
                }
            });
        },
    },
    watch: {
        overview_chart: {
            handler(val) {
                this.processChartData();
            },
            deep: true,
            immediate: true
        },

        activeView() {
            this.emitDateChange();
            this.updateChartForCurrentView();
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

.view-selector {
    display: flex;
    align-items: center;
}

.view-selector .el-select {
    width: 160px;
}

.info-icon {
    color: #C0C4CC;
    margin-left: 8px;
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
    color: #303133;
    margin-right: 30px;
    cursor: pointer;
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
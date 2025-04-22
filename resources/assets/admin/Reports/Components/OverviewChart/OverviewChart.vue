<template>
    <div class="overview-chart">
        <card>
            <card-head class="overview-chart-header">
                <h3>Overview Chart</h3>
                <div>
                    <el-select clearable v-model="selectedRange" @change="handleRangeChange">
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
            <card-body class="overview-chart-body">
                <div class="chart-controls">
                    <el-select
                        v-model="selectedFormId"
                        placeholder="Select Form"
                        clearable
                        filterable
                        @change="handleFormChange"
                        class="form-selector"
                    >
                        <el-option
                            v-for="form in forms_list"
                            :key="form.id"
                            :label="'#' + form.id + ' - ' + form.title"
                            :value="form.id">
                        </el-option>
                    </el-select>

                    <!-- View Selector Dropdown -->
                    <el-select v-model="activeView" placeholder="Select view" @change="handleViewChange">
                        <el-option
                            v-for="item in viewOptions"
                            :key="item.value"
                            :label="item.label"
                            :value="item.value">
                        </el-option>
                    </el-select>
                </div>

                <!-- Chart -->
                <div class="chart-wrapper">
                    <apexchart
                        ref="chart"
                        type="bar"
                        height="440"
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
    props: ['overview_chart', 'forms_list'],
    emits: ['handleRangeChange', 'handleDateRangeChange', 'date-change'],
    data() {
        return {
            dateRange: null,
            activeView: 'submission',
            selectedRange: 'month',
            selectedFormId: '',
            viewOptions: [
                {value: 'submission', label: 'Submission'},
                {value: 'conversion', label: 'Conversion'},
                {value: 'payments', label: 'Payments'}
            ],
            allSeries: [
                {name: 'Views', type: 'column', data: []},
                {name: 'Submission', type: 'column', data: []},
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
                colors: ['#28a7f0', '#7B5CFA', '#FFC107', '#4CAF50'],
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
                    show: true,
                    position: 'top',
                    horizontalAlign: 'left',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    markers: {
                        width: 12,
                        height: 12,
                        radius: 6,
                        shape: 'circle',
                        strokeWidth: 0
                    },
                    itemMargin: {
                        horizontal: 15,
                        vertical: 5
                    }
                },
                tooltip: {
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
                            return val;
                        }
                    }
                }
            }
        };
    },
    computed: {
        currentSeries() {
            if (this.overview_chart &&
                this.overview_chart.values &&
                typeof this.overview_chart.values === 'object' &&
                !Array.isArray(this.overview_chart.values)) {

                const paidData = Array.isArray(this.overview_chart.values.paid) ?
                    this.overview_chart.values.paid.map(val => val === "" || val === null ? 0 : Number(val)) : [];

                const pendingData = Array.isArray(this.overview_chart.values.pending) ?
                    this.overview_chart.values.pending.map(val => val === "" || val === null ? 0 : Number(val)) : [];

                const refundedData = Array.isArray(this.overview_chart.values.refunded) ?
                    this.overview_chart.values.refunded.map(val => val === "" || val === null ? 0 : Number(val)) : [];

                return [
                    {
                        name: 'Paid',
                        type: 'column',
                        data: paidData
                    },
                    {
                        name: 'Pending',
                        type: 'column',
                        data: pendingData
                    },
                    {
                        name: 'Refunded',
                        type: 'column',
                        data: refundedData
                    }
                ];
            } else if (this.activeView === 'conversion') {
                // Ensure all data arrays exist for conversion view
                const viewsData = this.allSeries[0].data || [];
                const submissionsData = this.allSeries[1].data || [];
                const conversionData = this.allSeries[2].data || [];

                return [
                    {
                        name: 'Views',
                        type: 'column',
                        data: viewsData
                    },
                    {
                        name: 'Submissions',
                        type: 'column',
                        data: submissionsData
                    },
                    {
                        name: 'Conversion Rate',
                        type: 'column',
                        data: conversionData
                    }
                ];
            } else {
                // Submission view (single series)
                return [{
                    name: 'Submissions',
                    type: 'column',
                    data: this.allSeries[1].data || []
                }];
            }
        },
    },
    methods: {
        // Handle form selection
        handleFormChange() {
            if (this.selectedFormId) {
                // When a specific form is selected, reset other date selectors
                this.selectedRange = null;
                this.dateRange = null;
            } else {
                // When "All Forms" is selected, reset to default behavior
                this.selectedRange = 'month'; // Reset to default range
            }

            // Emit date change to get data
            this.emitDateChange();
        },

        // Handle view type change
        handleViewChange() {
            // Re-fetch with the appropriate data for this view
            this.emitDateChange();
        },

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

            // If a form is selected, we'll let the backend handle the date range
            if (this.selectedFormId) {
                // Send null dates to indicate backend should use form-specific timeline
                startDate = null;
                endDate = null;
            } else if (this.lastUsedSelector === 'range' || !this.dateRange) {
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

            // Emit the event with all necessary parameters
            this.$emit('date-change', {
                startDate,
                endDate,
                view: this.activeView,
                formId: this.selectedFormId
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

        formatDateForRange(date) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        },

        // Complete implementation of processChartData method with fixes
        processChartData() {
            if (!this.overview_chart) return;

            const data = this.overview_chart;
            this.categories = data.dates || [];

            // Handle different data format for conversion view
            if (this.activeView === 'conversion') {
                // For conversion view, data should have views, submissions, and conversion_rates arrays
                this.allSeries[0].data = data.views || [];
                this.allSeries[1].data = data.submissions || [];
                this.allSeries[2].data = data.conversion_rates || [];

                // Setup for conversion view chart
                this.updateChartOptions({
                    chart: {
                        type: 'bar',
                        stacked: false
                    },
                    stroke: {
                        width: [0, 0, 0], // All bars
                        curve: 'smooth'
                    },
                    colors: ['#28a7f0', '#7B5CFA', '#FFC107'], // Blue, Purple, Yellow
                    plotOptions: {
                        bar: {
                            columnWidth: '75%',
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
                    legend: {
                        show: true,
                        showForSingleSeries: true,
                        showForNullSeries: true,
                        showForZeroSeries: true,
                        position: 'top',
                        horizontalAlign: 'left',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        markers: {
                            width: 12,
                            height: 12,
                            radius: 6,
                            shape: 'circle',
                            strokeWidth: 0
                        },
                        itemMargin: {
                            horizontal: 15,
                            vertical: 5
                        }
                    },
                    tooltip: {
                        shared: true,
                        intersect: false,
                        y: {
                            formatter: function(value, { seriesIndex, dataPointIndex }) {
                                if (seriesIndex === 2) { // Conversion rate
                                    return `${value}%`;
                                } else if (seriesIndex === 0) { // Views
                                    const formCount = data.form_counts && data.form_counts[dataPointIndex];
                                    return formCount ? `${value} (${formCount} forms)` : value;
                                }
                                return value;
                            }
                        }
                    }
                });
            } else if (this.activeView === 'payments') {
                // Handle payment view data formats

                // Check if we have the multi-series format (with paid, pending, failed)
                if (data.values && typeof data.values === 'object' && !Array.isArray(data.values) && data.values.paid) {
                    // Multi-series payment data
                    this.allSeries[3].data = data.values.paid || [];

                    // Update chart options for payment view with multiple series
                    this.updateChartOptions({
                        chart: {
                            type: 'bar',
                            stacked: false
                        },
                        colors: ['#4CAF50', '#FFC107', '#F44336'], // Green, Yellow, Red
                        plotOptions: {
                            bar: {
                                columnWidth: '75%',
                                borderRadius: 4,
                                dataLabels: {
                                    enabled: false
                                }
                            }
                        },
                        xaxis: {
                            categories: this.categories,
                            type: 'category'
                        },
                        // Set appropriate y-axis range and minimum height for bars
                        yaxis: {
                            min: 0,
                            forceNiceScale: true,
                            decimalsInFloat: 2,
                            labels: {
                                formatter: function(val) {
                                    return '$' + parseFloat(val).toFixed(2);
                                }
                            },
                            // Ensure a minimum visible height even for small values
                            tickAmount: 5
                        },
                        // Show data labels on the bars to make small values visible
                        dataLabels: {
                            enabled: false,
                        },
                        legend: {
                            show: true,
                            position: 'top',
                            horizontalAlign: 'left',
                            fontSize: '13px',
                            fontFamily: 'inherit',
                            markers: {
                                width: 12,
                                height: 12,
                                radius: 12,
                                shape: 'circle',
                                strokeWidth: 0
                            }
                        },
                        tooltip: {
                            shared: true,
                            intersect: false,
                            y: {
                                formatter: function(value, { seriesIndex }) {
                                    const statusLabels = ['Paid', 'Pending', 'Refunded'];
                                    return `${statusLabels[seriesIndex]}: $${parseFloat(value).toFixed(2)}`;
                                }
                            }
                        }
                    });
                }
            } else {
                // Submission view (default)
                if (data.values && Array.isArray(data.values)) {
                    this.allSeries[1].data = data.values;
                } else {
                    // If data.values is not an array, initialize with empty array
                    this.allSeries[1].data = [];
                    console.warn('Unexpected data structure for submissions chart values:', data.values);
                }

                // Update chart options for submission view
                this.updateChartOptions({
                    chart: {
                        type: 'bar',
                        stacked: false
                    },
                    colors: ['#7B5CFA'], // Purple
                    plotOptions: {
                        bar: {
                            columnWidth: '65%'
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
                    legend: {
                        show: true,
                        showForSingleSeries: true,
                        showForNullSeries: true,
                        showForZeroSeries: true,
                        position: 'top',
                        horizontalAlign: 'left',
                        fontSize: '13px',
                        fontFamily: 'inherit',
                        markers: {
                            width: 12,
                            height: 12,
                            radius: 6,
                            shape: 'circle',
                            strokeWidth: 0
                        }
                    },
                    tooltip: {
                        y: {
                            formatter: function(value) {
                                return Math.floor(value);
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
            this.processChartData();
        }
    }
};
</script>
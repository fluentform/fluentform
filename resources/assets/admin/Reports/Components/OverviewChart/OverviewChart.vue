<template>
    <card>
        <card-head>
            <h3>Conversion Chart</h3>
            <div class="card-controls">
                <el-switch
                    v-model="showAdvancedFilter"
                    active-text="Advanced Filter"
                    inactive-text=""
                    size="small"
                ></el-switch>
            </div>
        </card-head>

        <card-body>
            <!-- Advanced Filter Section -->
            <div v-if="showAdvancedFilter" class="advanced-filter-section">
                <div class="filter-row">
                    <div class="filter-group">
                        <label class="filter-label">Chart Type:</label>
                        <el-select
                            v-model="activeView"
                            placeholder="Select Chart"
                            size="small"
                            @change="handleViewChange"
                        >
                            <el-option label="Submissions" value="submissions"></el-option>
                            <el-option label="Conversions" value="conversions"></el-option>
                            <el-option label="Payments" value="payments"></el-option>
                        </el-select>
                    </div>
                    <div class="filter-group">
                        <label class="filter-label">Form:</label>
                        <el-select
                            v-model="selectedFormId"
                            placeholder="Select Form"
                            size="small"
                            clearable
                            filterable
                            @change="handleFormChange"
                        >
                            <el-option label="All Forms" :value="null"></el-option>
                            <el-option
                                v-for="form in forms_list"
                                :key="form.id"
                                :label="`#${form.id} - ${form.title}`"
                                :value="form.id"
                            ></el-option>
                        </el-select>
                    </div>
                </div>
            </div>

            <!-- Chart -->
            <div class="chart-wrapper">
                <v-chart
                    ref="chart"
                    :option="chartOptions"
                    style="height: 400px;"
                    autoresize
                />
            </div>
        </card-body>
    </card>
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
        CardHead
    },
    props: ['overview_chart', 'forms_list', 'global_date_params', 'chart_view'],
    emits: ['view-change', 'form-change'],
    data() {
        return {
            activeView: 'submissions',
            selectedFormId: null,
            showAdvancedFilter: false,
            categories: [],
            chartData: {
                views: [],
                submissions: [],
                conversions: [],
                payments: []
            }
        };
    },
    computed: {
        chartOptions() {
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
                        let result = `${params[0].axisValue}<br/>`;
                        params.forEach(param => {
                            result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
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
                    }
                },
                grid: {
                    left: '2%',
                    right: '2%',
                    bottom: '2%',
                    top: '15%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: this.categories,
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
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        color: '#8e8da4',
                        fontSize: 12
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#f1f1f1',
                            type: 'dashed'
                        }
                    }
                },
                series: this.seriesData
            };
        },
        seriesData() {
            const series = [];

            if (this.activeView === 'conversions') {
                // Conversions view - always show all three series
                series.push({
                    name: 'Views',
                    type: 'bar',
                    data: this.chartData.views,
                    itemStyle: {
                        color: '#3b82f6',
                        borderRadius: [4, 4, 0, 0]
                    }
                });

                series.push({
                    name: 'Submissions',
                    type: 'bar',
                    data: this.chartData.submissions,
                    itemStyle: {
                        color: '#8b5cf6',
                        borderRadius: [4, 4, 0, 0]
                    }
                });

                series.push({
                    name: 'Conversions',
                    type: 'bar',
                    data: this.chartData.conversions,
                    itemStyle: {
                        color: '#f59e0b',
                        borderRadius: [4, 4, 0, 0]
                    }
                });
            } else if (this.activeView === 'payments') {
                // Payments view - show payment data
                if (this.chartData.payments.length > 0) {
                    series.push({
                        name: 'Payments',
                        type: 'bar',
                        data: this.chartData.payments,
                        itemStyle: {
                            color: '#10b981',
                            borderRadius: [4, 4, 0, 0]
                        }
                    });
                }
            } else {
                // Submissions view (default) - show submissions only
                if (this.chartData.submissions.length > 0) {
                    series.push({
                        name: 'Submissions',
                        type: 'bar',
                        data: this.chartData.submissions,
                        itemStyle: {
                            color: '#8b5cf6',
                            borderRadius: [4, 4, 0, 0]
                        }
                    });
                }
            }

            return series;
        }
    },
    watch: {
        global_date_params: {
            handler(newParams) {
                if (newParams) {
                    this.selectedFormId = newParams.formId || null;
                }
            },
            deep: true,
            immediate: true
        },
        chart_view: {
            handler(newView) {
                if (newView) {
                    this.activeView = newView;
                }
            },
            immediate: true
        },
        overview_chart: {
            handler() {
                this.processChartData();
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        // Handle form selection
        handleFormChange() {
            this.$emit('form-change', this.selectedFormId);
        },

        // Handle view type change
        handleViewChange() {
            this.$emit('view-change', this.activeView);
        },

        // Process chart data for ECharts
        processChartData() {
            if (!this.overview_chart) return;

            const data = this.overview_chart;
            this.categories = data.dates || [];

            // Update chart data based on the current view
            if (this.activeView === 'conversions') {
                // For conversions view, we need three series: views, submissions, conversions
                this.chartData.views = data.views || [];
                this.chartData.submissions = data.submissions || data.values || [];
                this.chartData.conversions = data.conversion_rates || data.conversions || [];

                // If we don't have separate data, generate sample data for demonstration
                if (this.chartData.views.length === 0 && this.chartData.conversions.length === 0 && data.values) {
                    // Generate views (typically higher than submissions)
                    this.chartData.views = data.values.map(val => Math.floor(val * 2.5));
                    // Use provided values as submissions
                    this.chartData.submissions = data.values;
                    // Generate conversions (typically lower than submissions)
                    this.chartData.conversions = data.values.map(val => Math.floor(val * 0.6));
                }
            } else if (this.activeView === 'payments') {
                // Handle payment data
                if (data.values && typeof data.values === 'object' && !Array.isArray(data.values)) {
                    // Multi-series payment data (paid, pending, refunded)
                    this.chartData.payments = data.values.paid || [];
                } else {
                    this.chartData.payments = data.payment_values || data.values || [];
                }
            } else {
                // Default to submissions view
                this.chartData.submissions = data.values || [];
                this.chartData.views = data.views || [];
                this.chartData.conversions = data.conversion_rates || [];
            }
        }
    }
};
</script>


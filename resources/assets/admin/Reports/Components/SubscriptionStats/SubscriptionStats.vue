<template>
    <card>
        <card-head>
            <h3>Subscription</h3>
            <div class="card-controls">
                <el-switch
                    v-model="advancedFilter"
                    active-text="Advanced Filter"
                    inactive-text=""
                    size="small"
                ></el-switch>
            </div>
        </card-head>

        <card-body>
            <div class="subscription-amount">
                <div v-if="advancedFilter" class="advanced-filter-section">
                    <div class="filter-row">
                        <div class="filter-group">
                            <el-select
                                v-model="selectedFormId"
                                placeholder="Select Form"
                                size="small"
                                clearable
                                filterable
                                @change="handleFilterChange"
                            >
                                <el-option
                                    label="All Forms"
                                    :value="null"
                                ></el-option>
                                <el-option
                                    v-for="form in formsList"
                                    :key="form.id"
                                    :label="`#${form.id} - ${form.title}`"
                                    :value="form.id"
                                ></el-option>
                            </el-select>
                        </div>
                        <div class="filter-group">
                            <el-select v-model="selectedStatus" size="small" @change="handleFilterChange">
                                <el-option label="All Status" value="all"></el-option>
                                <el-option label="Active" value="active"></el-option>
                                <el-option label="Pending" value="pending"></el-option>
                                <el-option label="Trialling" value="trialling"></el-option>
                                <el-option label="Failing" value="failing"></el-option>
                                <el-option label="Cancelled" value="cancelled"></el-option>
                            </el-select>
                        </div>
                        <div class="filter-group">
                            <el-select v-model="selectedInterval" size="small" @change="handleFilterChange">
                                <el-option label="All Interval" value="all"></el-option>
                                <el-option label="Day" value="day"></el-option>
                                <el-option label="Week" value="week"></el-option>
                                <el-option label="Month" value="month"></el-option>
                                <el-option label="Year" value="year"></el-option>
                            </el-select>
                        </div>
                    </div>
                </div>
                
                <p>Recurring Amount</p>
                <div class="subscription-total">
                    <span class="total-amount">${{ formatNumber(totalAmount) }}</span>
                    <span
                        class="growth-indicator"
                        :class="{ 'positive': growthPercentage > 0, 'negative': growthPercentage < 0 }"
                    >
                        <i :class="growthPercentage >= 0 ? 'el-icon-caret-top' : 'el-icon-caret-bottom'"></i> 
                        {{ Math.abs(growthPercentage) }}%
                    </span>
                </div>
            </div>

            <div class="subscription-chart">
                <div v-if="isLoading" class="loading-chart">
                    <i class="el-icon-loading"></i>
                    <span>Loading subscription data...</span>
                </div>
                <div v-else-if="!hasSubscriptionData" class="no-data">
                    <i class="el-icon-data-analysis"></i>
                    <span>No subscription data available for the selected period</span>
                </div>
                <v-chart
                    v-else
                    ref="chart"
                    :option="chartOptions"
                    style="height: 270px;"
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
    name: 'SubscriptionStats',
    components: {
        Card,
        CardBody,
        CardHead
    },
    emits: ['subscription-filter-change'],
    props: {
        subscriptionData: {
            type: Object,
            default: () => ({})
        },
        formsList: {
            type: Array,
            default: () => []
        }
    },
    data() {
        return {
            advancedFilter: false,
            selectedStatus: 'all',
            selectedInterval: 'all',
            selectedFormId: null,
            isLoading: false,
        };
    },
    computed: {
        hasSubscriptionData() {
            return this.subscriptionData &&
                this.subscriptionData.chart_data &&
                this.subscriptionData.chart_data.length > 0;
        },

        totalAmount() {
            return this.subscriptionData && this.subscriptionData.total_recurring !== undefined
                ? this.subscriptionData.total_recurring
                : 0;
        },

        growthPercentage() {
            return this.subscriptionData && this.subscriptionData.growth_percentage !== undefined
                ? this.subscriptionData.growth_percentage
                : 0;
        },

        subscriptionCount() {
            return this.subscriptionData && this.subscriptionData.subscription_count !== undefined
                ? this.subscriptionData.subscription_count
                : 0;
        },

        chartData() {
            return this.hasSubscriptionData
                ? this.subscriptionData.chart_data
                : [];
        },

        chartOptions() {
            if (!this.hasSubscriptionData) {
                return {
                    grid: { top: 10, right: 30, bottom: 30, left: 100 },
                    xAxis: { type: 'value', min: 0, max: 100 },
                    yAxis: { type: 'category', data: [] },
                    series: [{ type: 'bar', data: [] }]
                };
            }

            const chartData = [...this.chartData].reverse();

            // Calculate max value for axis scaling
            const maxValue = Math.max(...chartData.map(item => item.value));

            // Determine a good interval for the chart
            const interval = this.calculateInterval(maxValue);

            return {
                grid: {
                    top: 10,
                    right: 30,
                    bottom: 30,
                    left: 100,
                    containLabel: false
                },
                xAxis: {
                    type: 'value',
                    name: '',
                    min: 0,
                    max: this.roundUpToNiceNumber(maxValue),
                    interval: interval,
                    axisLabel: {
                        formatter: (value) => {
                            if (value === 0) return '0';
                            return value >= 1000 ? (value / 1000).toFixed(0) + 'K' : value;
                        },
                        color: '#909399'
                    },
                    splitLine: {
                        lineStyle: {
                            type: 'dashed',
                            color: '#E4E7ED'
                        }
                    },
                    axisLine: {
                        show: false
                    },
                    axisTick: {
                        show: false
                    }
                },
                yAxis: {
                    type: 'category',
                    data: chartData.map(item => item.name),
                    axisLabel: {
                        color: '#303133',
                        fontWeight: 600,
                        align: 'right',
                        padding: [0, 5, 0, 0]
                    },
                    axisTick: {
                        show: false
                    },
                    axisLine: {
                        show: false
                    },
                    position: 'left',
                    boundaryGap: [0, 0],
                    categoryGap: '0%'
                },
                series: [{
                    type: 'bar',
                    data: chartData.map(item => ({
                        value: item.value,
                        itemStyle: {
                            color: item.color
                        }
                    })),
                    barWidth: '40%',
                    barCategoryGap: '10%',
                    label: {
                        show: false
                    }
                }],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    },
                    formatter: (params) => {
                        const data = params[0];
                        return `${data.name}: $${this.formatNumber(data.value)}`;
                    }
                },
                animation: true
            };
        }
    },
    methods: {
        formatNumber(num) {
            return parseFloat(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        calculateInterval(maxValue) {
            if (maxValue <= 50) return 10;
            if (maxValue <= 100) return 20;
            if (maxValue <= 500) return 100;
            if (maxValue <= 1000) return 200;
            if (maxValue <= 5000) return 1000;

            // For larger values, create a nice round interval
            return Math.ceil(maxValue / 5 / 100) * 100;
        },

        roundUpToNiceNumber(num) {
            // Round up to a nice number for the chart max value
            if (num <= 50) return Math.ceil(num / 10) * 10;
            if (num <= 100) return Math.ceil(num / 20) * 20;
            if (num <= 500) return Math.ceil(num / 100) * 100;
            if (num <= 1000) return Math.ceil(num / 200) * 200;
            return Math.ceil(num / 1000) * 1000;
        },

        handleFilterChange() {
            this.$emit('subscription-filter-change', {
                status: this.selectedStatus,
                interval: this.selectedInterval,
                formId: this.selectedFormId
            });
        },
    },
};
</script>
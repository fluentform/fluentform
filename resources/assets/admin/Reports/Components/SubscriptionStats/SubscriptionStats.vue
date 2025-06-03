<template>
    <card>
        <card-head>
            <h3>Subscription</h3>
        </card-head>

        <card-body>
            <div class="subscription-summary">
                <div class="summary-row">
                    <el-select v-model="selectedFilter" placeholder="All" size="small" @change="handleFilterChange">
                        <el-option label="All" value="all"></el-option>
                        <el-option label="Active" value="active"></el-option>
                        <el-option label="Cancelled" value="cancelled"></el-option>
                    </el-select>
                    <el-select v-model="selectedStatus" placeholder="Active" size="small" @change="handleFilterChange">
                        <el-option label="Active" value="active"></el-option>
                        <el-option label="Inactive" value="inactive"></el-option>
                    </el-select>
                    <el-select v-model="selectedType" placeholder="Cancelled" size="small" @change="handleFilterChange">
                        <el-option label="Cancelled" value="cancelled"></el-option>
                        <el-option label="Pending" value="pending"></el-option>
                    </el-select>
                </div>
            </div>

            <div class="subscription-amount">
                <p>Recurring</p>
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
                    style="height: 280px;"
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
    props: {
        subscriptionData: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            selectedFilter: 'all',
            selectedStatus: 'active',
            selectedType: 'cancelled',
            isLoading: false,
            localSubscriptionData: null
        };
    },
    computed: {
        hasSubscriptionData() {
            return this.localSubscriptionData &&
                this.localSubscriptionData.chart_data &&
                this.localSubscriptionData.chart_data.length > 0;
        },

        totalAmount() {
            return this.localSubscriptionData && this.localSubscriptionData.total_recurring !== undefined
                ? this.localSubscriptionData.total_recurring
                : 0;
        },

        growthPercentage() {
            return this.localSubscriptionData && this.localSubscriptionData.growth_percentage !== undefined
                ? this.localSubscriptionData.growth_percentage
                : 0;
        },

        subscriptionCount() {
            return this.localSubscriptionData && this.localSubscriptionData.subscription_count !== undefined
                ? this.localSubscriptionData.subscription_count
                : 0;
        },

        chartData() {
            return this.hasSubscriptionData
                ? this.localSubscriptionData.chart_data
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
            // Emit an event to the parent to handle the filter change
            this.$emit('subscription-filter-change', {
                filter: this.selectedFilter,
                status: this.selectedStatus,
                type: this.selectedType
            });
        },

        updateLocalData() {
            this.localSubscriptionData = JSON.parse(JSON.stringify(this.subscriptionData));
        }
    },
    created() {
        this.updateLocalData();
    },
    mounted() {
        console.log('Initial Subscription Data:', this.subscriptionData);
    },
    watch: {
        subscriptionData: {
            handler(newValue) {
                console.log('Subscription Data Updated:', newValue);
                this.isLoading = true;

                // Use setTimeout to ensure the loading state is visible
                setTimeout(() => {
                    this.updateLocalData();
                    this.isLoading = false;
                }, 300);
            },
            deep: true,
            immediate: true
        }
    }
};
</script>
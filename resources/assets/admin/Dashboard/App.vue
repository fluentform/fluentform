<template>
    <div class="fluentform-dashboard">
        <!-- Dashboard Header -->
        <div class="dashboard-header">
            <div>
                <h1 class="dashboard-title">{{ $t('Overview') }}</h1>
            </div>
            <div class="dashboard-controls">
                <el-select
                    v-model="selectedRange"
                    :placeholder="$t('Select date range')"
                    @change="handleRangeSelect"
                    size="medium"
                    style="width: 150px;"
                >
                    <el-option :label="$t('All')" value="all"></el-option>
                    <el-option :label="$t('Today')" value="today"></el-option>
                    <el-option :label="$t('Last 7 days')" value="week"></el-option>
                    <el-option :label="$t('Last month')" value="month"></el-option>
                    <el-option :label="$t('Last 3 months')" value="3_months"></el-option>
                    <el-option :label="$t('Last 6 months')" value="6_months"></el-option>
                    <el-option :label="$t('Last Year')" value="year"></el-option>
                </el-select>
            </div>
        </div>

        <!-- Stats Cards Section -->
        <div class="stats-section">
            <div class="stats-grid">
                <dashboard-stats-card
                    v-for="stat in statsCards"
                    :key="stat.key"
                    :title="stat.title"
                    :value="stat.value"
                    :change="stat.change"
                    :change-type="stat.changeType"
                    :icon="stat.icon"
                    :color="stat.color"
                    :loading="loading"
                />
            </div>
        </div>

        <!-- Main Content Row -->
        <el-row :gutter="24" class="main-content-row">
            <!-- Chart Section -->
            <el-col :span="24" :md="16">
                <div class="chart-section">
                    <dashboard-chart
                        :data="chartData"
                        :chart-view="chartView"
                        :selected-metrics="selectedMetrics"
                        :has-payment="hasPayment"
                        :loading="loading"
                        @chart-mode-change="handleChartModeChange"
                    />
                </div>
            </el-col>

            <!-- Sidebar -->
            <el-col :span="24" :md="8">
                <!-- License Status -->
                <div class="lifetime-log-section">
                    <lifetime-log :license-status="licenseStatus" />
                </div>

                <!-- Country Map -->
                <div class="country-map-section">
                    <country-map
                        :country-heatmap="countryHeatmap"
                        :loading="loading"
                    />
                </div>
            </el-col>
        </el-row>

        <!-- Bottom Content Row -->
        <el-row :gutter="24" class="bottom-content-row">
            <!-- Latest Entries -->
            <el-col :span="24" :md="12">
                <div class="latest-entries-section">
                    <latest-entries-table
                        :entries="latestEntries"
                        :loading="loading"
                    />
                </div>
            </el-col>

            <!-- API Logs -->
            <el-col :span="24" :md="12">
                <div class="api-logs-section">
                    <api-logs-table
                        :logs="apiLogs"
                        :loading="loading"
                    />
                </div>
            </el-col>
        </el-row>

        <!-- Notifications and Support Section -->
        <el-row :gutter="20" class="notifications-support-row">
            <!-- Notifications Panel -->
            <el-col :span="24" :md="12">
                <div class="notifications-section">
                    <notifications-panel
                        :notifications="notifications"
                        :loading="loading"
                    />
                </div>
            </el-col>

            <!-- Fluent Support Ticket -->
            <el-col :span="24" :md="12">
                <div class="support-section">
                    <fluent-support-ticket />
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script>
import DashboardStatsCard from './Components/DashboardStatsCard.vue';
import DashboardChart from './Components/DashboardChart.vue';
import LifetimeLog from './Components/LifetimeLog.vue';
import CountryMap from './Components/CountryMap.vue';
import LatestEntriesTable from './Components/LatestEntriesTable.vue';
import ApiLogsTable from './Components/ApiLogsTable.vue';
import NotificationsPanel from './Components/NotificationsPanel.vue';
import FluentSupportTicket from './Components/FluentSupportTicket.vue';

export default {
    name: 'DashboardApp',
    components: {
        DashboardStatsCard,
        DashboardChart,
        LifetimeLog,
        CountryMap,
        LatestEntriesTable,
        ApiLogsTable,
        NotificationsPanel,
        FluentSupportTicket
    },
    data() {
        return {
            loading: false,
            selectedRange: 'month',
            chartView: 'activity',
            selectedMetrics: ['submissions', 'views'],
            hasPayment: false,
            dashboardData: {},
            stats: {},
            chartData: {},
            latestEntries: [],
            apiLogs: [],
            notifications: [],
            countryHeatmap: {},
            licenseStatus: {
                is_pro: false,
                status: 'free',
                message: 'You are currently using the free version of Fluent Forms.'
            }
        };
    },
    computed: {
        statsCards() {
            return [
                {
                    key: 'total_forms',
                    title: this.$t('Total Forms'),
                    value: this.stats.total_forms?.current || 0,
                    change: this.formatChangeValue(this.stats.total_forms?.change || 0),
                    changeType: this.mapChangeType(this.stats.total_forms?.change_type || 'neutral'),
                    icon: 'el-icon-document',
                    color: '#409EFF'
                },
                {
                    key: 'total_entries',
                    title: this.$t('Total Entries'),
                    value: this.stats.total_entries?.current || 0,
                    change: this.formatChangeValue(this.stats.total_entries?.change || 0),
                    changeType: this.mapChangeType(this.stats.total_entries?.change_type || 'neutral'),
                    icon: 'el-icon-edit-outline',
                    color: '#67C23A'
                },
                {
                    key: 'active_integrations',
                    title: this.$t('Active Integrations'),
                    value: this.stats.active_integrations?.current || 0,
                    change: this.formatChangeValue(this.stats.active_integrations?.change || 0),
                    changeType: this.mapChangeType(this.stats.active_integrations?.change_type || 'neutral'),
                    icon: 'el-icon-connection',
                    color: '#E6A23C'
                },
                {
                    key: 'total_revenue',
                    title: this.$t('Total Revenue'),
                    value: this.formatCurrency(this.stats.total_revenue?.current || 0),
                    change: this.formatChangeValue(this.stats.total_revenue?.change || 0),
                    changeType: this.mapChangeType(this.stats.total_revenue?.change_type || 'neutral'),
                    icon: 'el-icon-money',
                    color: '#F56C6C'
                }
            ];
        }
    },
    mounted() {
        this.fetchDashboardData();
    },
    methods: {
        fetchDashboardData() {
            this.loading = true;

            const dateParams = this.getDateParams();
            const data = {
                range: this.selectedRange,
                startDate: dateParams.startDate,
                endDate: dateParams.endDate
            };

            const url = FluentFormsGlobal.$rest.route("dashboard");
            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    this.dashboardData = response;
                    this.stats = response.stats || {};
                    this.chartData = response.chart_data || {};
                    this.latestEntries = response.latest_entries || [];
                    this.apiLogs = response.api_logs || [];
                    this.notifications = response.notifications || [];
                    this.countryHeatmap = response.country_heatmap || {};
                    this.licenseStatus = response.license_status || this.licenseStatus;

                    // Set hasPayment based on global app data
                    this.hasPayment = window.FluentFormApp?.has_payment || false;
                })
                .catch(error => {
                    console.error('Error fetching dashboard data:', error);
                    this.$message.error(this.$t('Failed to load dashboard data'));
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        handleRangeSelect(range) {
            this.selectedRange = range;
            this.fetchDashboardData();
        },

        getDateParams() {
            const today = new Date();
            let startDate, endDate;

            if (this.selectedRange === 'all') {
                // For 'all', return null dates to get all data
                return {
                    startDate: null,
                    endDate: null
                };
            }

            let firstDay = new Date(today);
            const rangeMap = {
                today: 0,
                week: 6,
                month: 30,
                '3_months': 90,
                '6_months': 180,
                year: 365,
            };

            if (this.selectedRange in rangeMap) {
                firstDay.setDate(today.getDate() - rangeMap[this.selectedRange]);
            }

            startDate = this.formatDateForApi(firstDay, true);
            endDate = this.formatDateForApi(today, false);

            return { startDate, endDate };
        },

        formatDateForApi(date, isStart) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const time = isStart ? '00:00:00' : '23:59:59';
            return `${year}-${month}-${day} ${time}`;
        },

        handleChartModeChange(mode) {
            this.chartView = mode;
            // Optionally refetch data if needed for different chart modes
        },

        formatCurrency(amount) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
            }).format(amount);
        },

        formatChangeValue(change) {
            // Convert number to string with percentage
            if (change === 0) {
                return '';
            }
            const absChange = Math.abs(change);
            return `${absChange}%`;
        },

        mapChangeType(changeType) {
            // Map Dashboard change types to Reports change types
            switch (changeType) {
                case 'increase':
                    return 'up';
                case 'decrease':
                    return 'down';
                case 'neutral':
                default:
                    return 'neutral';
            }
        }
    }
};
</script>

<style lang="scss" scoped>
.dashboard-app {
    padding: 20px;
    background-color: #f9fafb;
    min-height: 100vh;

    .stats-row,
    .chart-lifetime-row,
    .tables-row,
    .notifications-support-row {
        margin-bottom: 20px;

        &:last-child {
            margin-bottom: 0;
        }
    }

    .stats-section,
    .chart-section,
    .lifetime-log-section,
    .country-map-section,
    .latest-entries-section,
    .api-logs-section,
    .notifications-section,
    .support-section {
        height: 100%;
    }

    // Ensure equal height columns
    .notifications-support-row {
        .el-col {
            display: flex;

            > div {
                width: 100%;
            }
        }
    }
}

@media (max-width: 768px) {
    .dashboard-app {
        padding: 16px;

        .stats-row,
        .chart-lifetime-row,
        .tables-row,
        .notifications-support-row {
            margin-bottom: 16px;
        }
    }
}
</style>


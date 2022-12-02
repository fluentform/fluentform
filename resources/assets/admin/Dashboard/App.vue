<template>
    <div class="dashboard-wrapper" v-loading="loading">
        <div class="payment_header">
            <div class="payment_title">{{ $t('Dashboard') }}</div>
            <div class="payment_actions">
                <a href="#" class="el-button el-button--default el-button--mini">
                    <span class="el-icon-setting el-icon"></span>
                </a>
            </div>
        </div>
        <div class="dashboard-row">
            <el-row>
                <el-col :span="10">
                    <!-- Payment Statuses Summary -->
                    <dashboard-card :card_data="payment_data"></dashboard-card>
                </el-col>
                <el-col :span="14">
                    <!-- Form Types Summary -->
                    <dashboard-list-card :key="refreshToggle" :card_data="forms_data"></dashboard-list-card>
                </el-col>
            </el-row>
            <!-- Submission Types Summary -->
            <dashboard-list-card :key="refreshToggle" :card_data="submissionTypesSum"></dashboard-list-card>
        </div>
        <div class="dashboard-row ">
            <el-row :gutter="0">
                <el-col class="row-header">
                    <div class="row-filter-one">
                        <span> {{ $t('Monthly Submission') }}</span>
                        <el-date-picker
                                v-model="startDate"
                                size="mini"
                                type="month"
                                format="MMMM"
                                value-format="yyyy-MM-dd"
                                @change="fetchData"
                                :picker-options="pickerOptions">
                        </el-date-picker>
                    </div>
                    <div class="row-filter-two">
                        <span> {{ $t('Type') }}</span>
                        <el-radio-group @change="fetchData" v-model="submissionType" size="mini">
                            <el-radio-button :key="type" v-for="(label, type) in submissionTypes" :label="type">
                                {{ label }}
                            </el-radio-button>
                        </el-radio-group>
                    </div>
                </el-col>
                <el-col :span="14">
                    <div class=" dashboard-card ">
                        <!-- Monthly Entries Line Chart -->
                        <entries-chart
                                :key="refreshToggle"
                                :submission_type="submissionType"
                                :data="monthly_chartdata">
                        </entries-chart>
                    </div>
                </el-col>
                <el-col :span="10">
                    <!-- Monthly Entries Overview -->
                    <dashboard-card :card_data="submission_overview_details"></dashboard-card>
                </el-col>
            </el-row>
        </div>

        <div class="dashboard-row">
            <el-row>
                <!-- Highest Analytics -->
                <dashboard-card :card_data="analytics_data"></dashboard-card>
            </el-row>
        </div>

        <div class="dashboard-row">
            <el-row :gutter="0">
                <div class="dashboard-card">
                    <!-- Recent Activities -->
                    <recent-activities :activities="activities_data"></recent-activities>
                </div>
            </el-row>
        </div>
        <div class="dashboard-row">
            <el-row>
                <div class="dashboard-chart-pie dashboard-card ">
                    <!-- PieChart For Submissions per Form -->
                    <form-entries-chart :key="refreshToggle" :chartData="submission_per_form_data"></form-entries-chart>
                </div>
            </el-row>
        </div>
    </div>
</template>

<script>
    import DashboardListCard from './DashboardListCard.vue';
    import FormEntriesChart from './FormEntriesChart.vue';
    import EntriesChart from './EntriesChart.vue';
    import DashboardCard from './DashboardCard.vue';
    import RecentActivities from "./RecentActivities.vue";
    import moment from "moment";


    export default {
        name: 'Dashboard',
        components: {DashboardCard, EntriesChart, FormEntriesChart, RecentActivities, DashboardListCard},
        data() {
            return {
                hasPro: !!window.FluentFormDashboard.hasPro,
                forms_data: [],
                analytics_data: [],
                submissionTypesSum: [],
                activities_data: [],
                submission_per_form_data: [],
                payment_data: [],
                monthly_chartdata: [],
                submission_overview_details: [],
                refreshToggle: false,
                loading: false,
                startDate: moment().startOf('month').format('Y-MM-DD'),
                endDate: moment().endOf('month').format('Y-MM-DD'),
                pickerOptions: {
                    disabledDate(time) {
                        return time.getTime() >= Date.now();
                    },
                },
                submissionType: 'all',
                submissionTypes: {
                    'all': 'All',
                    'read': 'Read',
                    'unread': 'Unread',
                    'paid': 'Paid',
                }
            }
        },
        methods: {
            fetchData() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: "fluent_forms_dashboard",
                    date_range: this.date_range,
                    submission_type: this.submissionType,
                })
                    .then(response => {
                        const res = response.data;
                        this.forms_data = res.forms_data;
                        this.analytics_data = res.analytics_data;
                        this.submissionTypesSum = res.submission_types_sum;
                        this.monthly_chartdata = res.submission_chart_data;
                        this.activities_data = res.activities_data;
                        this.submission_overview_details = res.submission_overview_details;
                        this.submission_per_form_data = res.submission_per_form_data;
                        if (res.payment_data && this.hasPro) {
                            this.payment_data = res.payment_data
                        }
                        this.refreshToggle = !this.refreshToggle;
                        this.loading = false;
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
        },
        computed: {
            date_range() {
                return [this.startDate, moment(this.startDate).endOf('month').format('Y-MM-DD')]; //start and end date of month
            }
        },
        mounted() {
            this.fetchData();
        }
    };
</script>


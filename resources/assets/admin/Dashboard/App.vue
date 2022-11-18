<template>
    <div class="dashboard-wrapper" v-loading="loading">

        <div class="dashboard-row dashboard-row-top bg-white p-20">
            <dashboard-card
                    :card_data="analytics_data"
                    card_icon="el-icon-s-marketing"
                    interval=3000>
            </dashboard-card>
            <dashboard-card
                    :card_data="forms_data"
                    card_icon="el-icon-info"
                    interval=3050>
            </dashboard-card>
            <dashboard-card
                    :card_data="submission_data"
                    card_icon="el-icon-tickets"
                    interval=3100>
            </dashboard-card>
            <dashboard-card
                    :card_data="payment_data"
                    card_icon="el-icon-money"
                    interval=3150>
            </dashboard-card>
        </div>

        <div class="dashboard-row dashboard-row-chart bg-white p-20">
            <div class="dashboard-chart-bar dashboard-card ">
                <div class="card_header">
                    <h6>{{ $t('Monthly Submission') }}</h6>
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
                <div class="ff_card_body">
                    <entries-chart
                            :key="refreshToggle"
                            :data="monthly_submissions">
                    </entries-chart>
                </div>
            </div>
            <div class="dashboard-chart-pie dashboard-card ">
                <form-entries-chart
                        :key="refreshToggle"
                        :chartData="submission_per_form_data">
                </form-entries-chart>
            </div>
        </div>

        <div class="dashboard-row bg-white p-20">
            <recent-activities :activities="activities_data"></recent-activities>
        </div>

    </div>
</template>
<script type="text/babel">
    import FormEntriesChart from './FormEntriesChart.vue';
    import EntriesChart from './EntriesChart.vue';
    import DashboardCard from './DashboardCard.vue';
    import RecentActivities from "./RecentActivities.vue";
    import moment from "moment";


    export default {
        name: 'Dashboard',
        components: {DashboardCard, EntriesChart, FormEntriesChart, RecentActivities},
        data() {
            return {
                hasPro: !!window.FluentFormDashboard.hasPro,
                forms_data: [],
                analytics_data: [],
                submission_data: [],
                activities_data: [],
                submission_per_form_data: [],
                payment_data: [],
                monthly_submissions: [],
                refreshToggle: false,
                loading: false,
                startDate: moment().startOf('month').format('Y-MM-DD'),
                endDate: moment().endOf('month').format('Y-MM-DD'),
                pickerOptions: {
                    disabledDate(time) {
                        return time.getTime() >= Date.now();
                    },
                }
            }
        },
        methods: {
            fetchData() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: "fluent_forms_dashboard",
                    date_range: this.date_range
                })
                    .then(response => {
                        const res = response.data;
                        this.forms_data = res.forms_data;
                        this.analytics_data = res.analytics_data;
                        this.submission_data = res.submission_data;
                        this.monthly_submissions = res.submission_overview_data;
                        this.activities_data = res.activities_data;
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


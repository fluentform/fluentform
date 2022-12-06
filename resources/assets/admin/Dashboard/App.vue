<template>
    <div class="dashboard-wrapper" v-loading="loading">
        <div class="payment_header">
            <div class="payment_title">{{ $t('Dashboard') }}</div>
            <div class="payment_actions">

                <el-button href="#" @click="settingsVisible=true" size="mini">
                    <span class="el-icon-setting el-icon"></span>
                </el-button>
                <el-dialog title="Dashboard Settings" :visible.sync="settingsVisible" width="50%">

                    <el-checkbox-group   @change="updateVisibleCards" class="dashboard-radio-group" :min="1" v-model="visibleCards"  >
                        <div v-for="(cardGroup,groupName) in cardGroups"  v-if="cardGroup.length>0">
                            <p>{{groupName|title}}</p>
                            <el-checkbox class="dashboard-radio-input"  v-for="(cardName,key) in cardGroup" :label="cardName" :key="key">{{cardName}}</el-checkbox>

                        </div>
                    </el-checkbox-group>
                    <span slot="footer"></span>
                </el-dialog>
            </div>
        </div>
        <div class="dashboard-row" v-show="rowVisibility.paymentStatus || rowVisibility.formsCount">
            <el-row type="flex">
                <el-col  v-show="rowVisibility.paymentStatus">
                    <!-- Payment Statuses Summary -->
                    <dashboard-card :card_data="paymentInfo" :visible_cards="visibleCards"></dashboard-card>
                </el-col>
                <el-col   v-show="rowVisibility.formsCount">
                    <!-- Form Types Summary -->
                    <dashboard-list-card :key="refreshToggle" :card_data="formsCount" :visible_cards="visibleCards"></dashboard-list-card>
                </el-col>
            </el-row>
            <!-- Submission Types Summary -->
            <dashboard-list-card :key="refreshToggle"  :card_data="submissionSummary" :visible_cards="visibleCards"></dashboard-list-card>
        </div>
        <div class="dashboard-row " v-show="visibleCards.includes('Monthly Submission Chart') || rowVisibility.monthlySubmissionOverview ">
            <el-row :gutter="0">
                <el-col class="row-header" >
                    <div class="row-filter-one">
                        <span> {{ $t('Monthly Submission') }} </span>
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
                            <el-radio-button :key="type" v-for="(label, type) in submissionTypes" :label="type"> {{ label }} </el-radio-button>
                        </el-radio-group>
                    </div>
                </el-col>

            </el-row>
            <el-row type="flex" >
                <el-col   v-show="visibleCards.includes('Monthly Submission Chart')" >
                    <div class=" dashboard-card ">
                        <!-- Monthly Submission Chart -->
                        <entries-chart
                                :key="refreshToggle"
                                :submission_type="submissionType"
                                :data="monthlySubmissionChart">
                        </entries-chart>
                    </div>
                </el-col>
                <el-col  v-show="rowVisibility.monthlySubmissionOverview">
                    <!-- Monthly Entries Overview -->
                    <dashboard-card :card_data="monthlySubmissionOverview" :visible_cards="visibleCards"></dashboard-card>
                </el-col>
            </el-row>
        </div>

        <div class="dashboard-row" v-show="rowVisibility.analyticsInfo">
            <el-row>
                <!-- Highest Analytics -->
                <dashboard-card :card_data="analyticsInfo" :visible_cards="visibleCards"></dashboard-card>
            </el-row>
        </div>

        <div class="dashboard-row" v-show="visibleCards.includes('Recent Activities')">
            <el-row :gutter="0">
                <div class="dashboard-card">
                    <!-- Recent Activities -->
                    <recent-activities :activities="activitiesData"></recent-activities>
                </div>
            </el-row>
        </div>
        <div class="dashboard-row" v-if="visibleCards.includes('Submission per Form Chart')">
            <el-row>
                <div class="dashboard-chart-pie dashboard-card ">
                    <!-- Submission per Form Chart -->
                    <form-entries-chart :key="refreshToggle" :chartData="submissionPerFormChart"></form-entries-chart>
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
                formsCount: [],
                analyticsInfo: [],
                submissionSummary: [],
                activitiesData: [],
                submissionPerFormChart: [],
                paymentInfo: [],
                monthlySubmissionChart: [],
                monthlySubmissionOverview: [],
                refreshToggle: false,
                loading: false,
                startDate: moment().startOf('month').format('Y-MM-DD'),
                endDate: moment().endOf('month').format('Y-MM-DD'),
                submissionType: 'all',
                submissionTypes: {
                    'all': this.$t('All'),
                    'read': this.$t('Read'),
                    'unread': this.$t('Unread'),
                    'paid': this.$t('Paid'),
                },
                settingsVisible: false,
                visibleCards:[],
                rowVisibility : {},
                cardGroups : {},
                pickerOptions: {
                    disabledDate(time) {
                        return time.getTime() >= Date.now();
                    },
                },
            }
        },
        methods: {
            toggleCard(e){
            },
            fetchData() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: "fluent_forms_dashboard",
                    date_range: this.date_range,
                    submission_type: this.submissionType,
                })
                    .then(response => {
                        const res = response.data;
                        this.formsCount = res.forms_count;
                        this.analyticsInfo = res.analytics_info;
                        this.submissionSummary = res.submission_summary;
                        this.monthlySubmissionChart = res.monthly_submission_chart;
                        this.activitiesData = res.activities_data;
                        this.monthlySubmissionOverview = res.monthly_submission_overview;
                        this.submissionPerFormChart = res.submission_per_form_data;
                        this.visibleCards = res.visible_cards;
                        if (res.payment_info && this.hasPro) {
                            console.log('ok')
                            this.paymentInfo = res.payment_info
                        }
                        this.refreshToggle = !this.refreshToggle;
                        this.loading = false;
                        this.listVisibleCards(res);
                        this.rowVisibilityUpdate()
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            listVisibleCards(data){

                this.cardGroups = {};
                for (const cardKey in data) {
                    if(typeof data[cardKey] === 'object'){

                        if (data[cardKey].length > 0){
                            this.cardGroups[cardKey] = [];
                            for (const items in data[cardKey]) {
                                let item = data[cardKey][items];
                                if (item && item.info){
                                    this.cardGroups[cardKey].push(item.info)
                                }

                            }
                        }

                    }
                }
                this.cardGroups['chart_and_table'] = []
                this.cardGroups['chart_and_table'].push('Monthly Submission Chart','Submission per Form Chart','Recent Activities')



            },
            updateVisibleCards(){
                this.loading = true;

                FluentFormsGlobal.$get({
                    action: "fluent_forms_dashboard_cards",
                    visible_cards: this.visibleCards,
                })
                    .then(response => {
                        const res = response.data;
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            hideIfNotVisible(data){
                return  data.filter((item) => this.visibleCards.indexOf(item.info) !== -1).length > 0
            },
            rowVisibilityUpdate(){
                this.rowVisibility = {
                    paymentStatus: this.hideIfNotVisible(this.paymentInfo),
                    formsCount:this.hideIfNotVisible(this.formsCount),
                    submissionSummary:this.hideIfNotVisible(this.submissionSummary),
                    monthlySubmissionOverview:this.hideIfNotVisible(this.monthlySubmissionOverview),
                    analyticsInfo:this.hideIfNotVisible(this.analyticsInfo),
                };
            }
        },
        computed: {
            date_range() {
                return [this.startDate, moment(this.startDate).endOf('month').format('Y-MM-DD')]; //start and end date of month
            },
        },
        mounted() {
            this.fetchData();
        }
    };
</script>


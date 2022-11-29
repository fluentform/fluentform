<template>
    <div class="ff_reports">
        <div class="reports_header">
            <div class="reports_title">
                {{ $t('Reports') }}
            </div>
            <el-row :gutter="20">
                <el-col :span="24" :sm="6">
                    <div style="display: inline-block;  padding-right: 20px;" class="ff_nav_sub_actions">
                        <div class="ff_form_group ff_inline">
                            <el-select
                                @change="getReports()"
                                style="max-height:10px;" size="mini" clearable filterable
                                v-model="selectedFormId"
                                :placeholder="$t('Select Form')"
                            >
                                <el-option
                                    v-for="item in available_forms"
                                    :key="item.id"
                                    :label="item.title"
                                    :value="item.id">
                                </el-option>
                            </el-select>
                        </div>
                    </div>
                </el-col>

                <el-col :span="24" :sm="18">
                    <div class="text-right">
                        <el-row>
                            <div class="widget_title">
                                <el-date-picker
                                    size="mini"
                                    @change="getReports()"
                                    v-model="filter_date_range"
                                    type="daterange"
                                    :picker-options="pickerOptions"
                                    format="dd MMM, yyyy"
                                    value-format="yyyy-MM-dd"
                                    range-separator="-"
                                    :start-placeholder="$t('Start date')"
                                    :end-placeholder="$t('End date')">
                                </el-date-picker>
                                <el-button @click="getReports" size="mini" type="success">{{ $t('Search') }}</el-button>
                            </div>
                        </el-row>
                    </div>
                </el-col>
            </el-row>
            <hr/>
        </div>
        <div class="ff_report_body">
            <div class="" v-if="selectedFormId">
                <div class="report-section overview-reports" v-loading="loading">
                    <Overview :data="overview"/>
                </div>

                <el-row :gutter="30">
                    <el-col :sm="12" :span="24">
                        <div class="report-section view-reports" v-loading="loading">
                            <reports-details type="views" :data="views" icon="el-icon-view"/>
                        </div>
                    </el-col>
                    <el-col :sm="12" :span="24">
                        <div class="report-section submissions-reports" v-loading="loading">
                            <reports-details type="submissions" :data="submissions" icon="el-icon-s-order"/>
                        </div>
                    </el-col>
                </el-row>

                <el-row :gutter="30">
                    <el-col :sm="12" :span="24">
                        <div class="report-section conversion-reports" v-loading="loading">
                            <reports-details type="conversion" :data="conversion" icon="el-icon-set-up"/>
                        </div>
                    </el-col>
                    <el-col :sm="12" :span="24">
                        <div class="report-section integrations-reports" v-loading="loading">
                            <reports-details type="integrations" :data="integrations" icon="el-icon-share"/>
                        </div>
                    </el-col>
                </el-row>

                <div class="report-section payment-reports" v-loading="loading">
                    <reports-details type="payments" :data="payments" icon="el-icon-money"/>
                </div>
            </div>
            <div class="report-section ff-not-select-form" v-else>
                <i class="el-icon-info"></i>
                <p>{{ $t('Already there. Select a form to view its report.') }}</p>
            </div>
        </div>
    </div>
</template>

<script>

import Overview from './Overview';
import ReportsDetails from './ReportsDetails';
import moment from 'moment';

export default {
    name: 'Reports',
    components: {
        Overview,
        ReportsDetails
    },

    data() {
        return {
            loading: false,
            available_forms: [],
            selectedFormId: '',
            pickerOptions: {
                disabledDate(time) {
                    return time.getTime() >= Date.now();
                },
                shortcuts: [
                    {
                        text: 'Today',
                        onClick(picker) {
                            const start = new Date();
                            picker.$emit('pick', [start, start]);
                        }
                    },
                    {
                        text: 'Yesterday',
                        onClick(picker) {
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 1);
                            picker.$emit('pick', [start, start]);
                        }
                    },
                    {
                        text: 'Last week',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                            picker.$emit('pick', [start, end]);
                        }
                    },
                    {
                        text: 'Last month',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                            picker.$emit('pick', [start, end]);
                        }
                    },
                    {
                        text: 'Last 2 month',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 60);
                            picker.$emit('pick', [start, end]);
                        }
                    },
                    {
                        text: 'Last year',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setFullYear(start.getFullYear() - 1);
                            picker.$emit('pick', [start, end]);
                        }
                    }
                ]
            },
            filter_date_range: null,
            overview: null,
            views: null,
            conversion: null,
            integrations: null,
            payments: null,
            submissions: null,
        }
    },
    methods: {
        fetchForms() {
            this.loading = true;
            FluentFormsGlobal.$get({
                    action: 'fluentform-get-available-forms',
                })
                .then(reponse => {
                    if (reponse.success) {
                        this.available_forms = reponse.data.forms
                        if (window.localStorage && window.localStorage.getItem('fluent_forms_reports_var')) {
                            const {
                                form_id,
                                filter_date_range
                            } = JSON.parse(window.localStorage.getItem('fluent_forms_reports_var'));
                            this.selectedFormId = form_id;
                            if (filter_date_range) {
                                this.filter_date_range = filter_date_range;
                            }
                            this.getReports()
                        }
                    }
                })
                .fail(error => {
                    console.log(error)
                })
                .always(() => {
                    this.loading = false;
                })
        },

        getReports() {
            this.loading = true;
            if (!this.selectedFormId) {
                return this.loading = false;
            }
            let data = {
                action: 'fluentform_get_form_reports',
                form_id: this.selectedFormId,
            }

            if (!this.filter_date_range) {
                this.filter_date_range = [
                    moment(moment().subtract(30, 'days')).format('YYYY-MM-DD'),
                    moment().format('YYYY-MM-DD'),
                ]
            }
            data.date_range = this.filter_date_range;

            if (window.localStorage) {
                window.localStorage.setItem('fluent_forms_reports_var', JSON.stringify({
                    form_id: this.selectedFormId,
                    filter_date_range: this.filter_date_range
                }));
            }

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.success) {
                        this.overview = response.data.overview
                        this.views = response.data.views
                        this.submissions = response.data.submissions
                        this.payments = response.data.payments
                        this.integrations = response.data.integrations
                        this.conversion = response.data.conversion
                    }
                })
                .fail(error => {
                    console.log(error);
                })
                .always(() => {
                    this.loading = false;
                })
        },

    },
    computed: {},
    mounted() {
        this.fetchForms()
    }
}
</script>

<style scoped>

</style>
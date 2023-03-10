<template>
    <div id="print_view" class="ff_report_viewer">
        <el-row :gutter="12" class="mb-4 items-center">
            <el-col :span="12">
                <h1>{{ $t('Visual Data Reporting') }}</h1>
            </el-col>
            <el-col :span="12" class="text-right">
                <el-button @click="gotoRegularEntries()" type="primary">
                    <i class="ff-icon ff-icon-eye fs-15"></i> 
                    <span>{{ $t('View Regular Entries') }}</span>
                </el-button>
            </el-col>
        </el-row>
        <el-row :gutter="24">
            <el-col :sm="24" :md="17">
                <div class="all_report_items" v-loading="loading">
                    <card>
                        <card-head class="report_header">
                            <span class="mr-3 title">{{ $t('Submission Stats') }}</span>
                            <el-date-picker
                                v-model="date_range"
                                size="medium"
                                value-format="yyyy-MM-dd"
                                type="daterange"
                                :picker-options="pickerOptions"
                                range-separator="To"
                                :start-placeholder="$t('Start date')"
                                :end-placeholder="$t('End date')">
                            </el-date-picker>
                        </card-head>
                        <card-body>
                            <div v-if="loading">
                                <h6 class="mb-2">{{ $t('Fetching Data... Please wait!') }}</h6>
                            </div>
                            <template v-if="!loading">
                                <el-alert 
                                    :title="$t('Sorry! No reports found based on your filter, available form submissions and input types')"
                                    type="error" 
                                    v-if="(!total_entries && !loading) || (!reportIndexes.length && !loading)" 
                                    :closable="false"
                                    show-icon
                                    class="no_entries_found mb-4"
                                >
                                </el-alert>
                                <entries-chart :date_range="date_range" :form_id="form_id"></entries-chart>
                            </template>
                        </card-body>
                    </card>
                    <card>
                        <report-card
                            v-for="(report,report_key) in report_items"
                            :key="report_key"
                            :form_id="form_id"
                            :report_key="report_key"
                            :report_indexes="reportIndexes"
                            :report="report">
                        </report-card>
                    </card>
                </div>
            </el-col>
            <el-col :sm="8" :md="7">
                <div class="ff_print_hide">
                    <card class="entry_info_box">
                        <card-head class="entry_info_header">
                            <h6>{{ $t('Filter Data by Status') }}</h6>
                        </card-head>
                        <card-body class="entry_info_body report_status_filter">
                            <el-checkbox-group class="el-checkbox-group-column" @change="fetchReport()" v-model="filter_statuses">
                                <el-checkbox 
                                    v-for="(status, status_key) in entry_statuses" 
                                    :key="status_key"
                                    :label="status_key">
                                    {{ status }}
                                </el-checkbox>
                            </el-checkbox-group>
                            <p class="mt-2" v-show="!filter_statuses.length">{{ $t('Show from all except trashed') }}</p>
                        </card-body>
                    </card>
                    <card class="entry_info_box">
                        <card-head class="entry_info_header">
                            <h6>{{ $t('Other Info') }}</h6>
                        </card-head>
                        <card-body class="entry_info_body">
                            <ul class="ff_list_border_bottom">
                                <li>
                                    <div class="lead-title" style="display: inline-block; width: 100px;">
                                        {{ $t('Total Entries:') }}
                                    </div>
                                    <div style="display: inline-block;">{{ total_entries }}</div>
                                </li>
                                <li>
                                    <div class="lead-title">{{ $t('Entries By Browser') }}</div>
                                    <ul v-if="browsers" class="mt-2">
                                        <li v-for="(browserCount, browserName, browserIndex) in browsers" :key="browserIndex">
                                            {{ browserName }}: {{ browserCount }}
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    <div class="lead-title"> {{$t('Entries By Device')}}</div>
                                    <ul v-if="devices" class="mt-2">
                                        <li v-for="(deviceCount, deviceName, deviceIndex) in devices" :key="deviceIndex">
                                            {{ deviceName }}: {{ deviceCount }}
                                        </li>
                                    </ul>
                                </li>
                            </ul>
                        </card-body>
                    </card>
                    <btn-group>
                        <btn-group-item>
                            <el-button @click="printReport()" type="dark">{{ $t('Print this report') }}</el-button>
                        </btn-group-item>
                        <btn-group-item>
                            <el-button @click="resetAnalytics()">{{ $t('Reset Form Analytics') }}</el-button>
                        </btn-group-item>
                    </btn-group>
                </div>
            </el-col>
        </el-row>
    </div>
</template>

<script type="text/babel">
import ReportCard from './reportCard';
import each from 'lodash/each';
import EntriesChart from '../../AllEntries/Components/chartView';
import Card from '@/admin/components/Card/Card.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import BtnGroup from '@/admin/components/BtnGroup/BtnGroup.vue';
import BtnGroupItem from '@/admin/components/BtnGroup/BtnGroupItem.vue';
import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';

export default {
    name: 'visual_report',
    props: ['form_id'],
    components: {
        EntriesChart,
        ReportCard,
        Card,
        CardHead,
        CardBody,
        BtnGroup,
        BtnGroupItem,
        CardHeadGroup
    },
    data() {
        return {
            loading: true,
            total_entries: 0,
            entry_statuses: window.fluent_form_entries_vars.entry_statuses,
            filter_statuses: [],
            report_items: {},
            browsers: {},
            devices: {},
            date_range: ['', ''],
            pickerOptions: {
                shortcuts: [
                    {
                        text: 'Last week',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7);
                            picker.$emit('pick', [start, end]);
                        }
                    }, {
                        text: 'Last month',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30);
                            picker.$emit('pick', [start, end]);
                        }
                    }, {
                        text: 'Last 3 months',
                        onClick(picker) {
                            const end = new Date();
                            const start = new Date();
                            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90);
                            picker.$emit('pick', [start, end]);
                        }
                    }],
                disabledDate(date) {
                    return date.getTime() >= Date.now();
                }
            }
        }
    },
    computed: {
        reportIndexes() {
            let items = [];
            each(this.report_items, (item, item_name) => {
                items.push(item_name);
            });
            return items;
        }
    },
    methods: {
        fetchReport() {
            this.loading = true;
            const url = FluentFormsGlobal.$rest.route('formReport', this.form_id);
            FluentFormsGlobal.$rest.get(url, {
                    statuses: this.filter_statuses
                })
                .then(response => {
                    this.report_items = response.report_items;
                    this.total_entries = parseInt(response.total_entries);
                    this.browsers = response.browsers;
                    this.devices = response.devices;
                })
                .catch(error => {
                    console.log(`${error}`)
                })
                .finally(() => {
                    this.loading = false;
                });
        },
        resetAnalytics() {
            if (window.confirm('All the views recorded to this form will be deleted. Are you sure?')) {

                const url = FluentFormsGlobal.$rest.route('resetFormAnalytics', this.form_id);
                FluentFormsGlobal.$rest.post(url, {
                    form_id: this.form_id,
                }).then(response => {
                    this.$success(response.message);
                }).catch(error => {
                    const message = error.message || this.$t('Something went wrong, please try again.');
                    this.$fail(message);
                })

            }
        },
        gotoRegularEntries() {
            this.$router.push({
                name: 'form-entries'
            });
        },
        printReport() {
            window.print();
        }
    },
    mounted() {
        each(this.entry_statuses, (item, key) => {
            if (key != 'trashed') {
                this.filter_statuses.push(key);
            }
        });
        this.fetchReport();
    }
}
</script>


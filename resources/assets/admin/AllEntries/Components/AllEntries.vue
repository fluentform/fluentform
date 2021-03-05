<template>
    <div v-loading="loading" class="payments_wrapper">
        <div class="payment_header">
            <div class="payment_title">All Form Entries</div>
            <div class="payment_actions">
                <el-button @click="toggleChart()" type="info" size="mini">
                    <span v-if="chart_status == 'yes'">Hide Chart</span>
                    <span v-else>Show Chart</span>
                </el-button>
            </div>
        </div>
        <div v-if="chart_status == 'yes'" class="entry_chart">
            <entry-chart></entry-chart>
        </div>

        <div class="payment_details">
            <div style="margin-bottom: 20px" class="payment_header">
                <el-radio-group @change="fetchEntries('reset')" size="small" v-model="entry_status">
                    <el-radio-button label="">All</el-radio-button>
                    <el-radio-button label="unread">Unread Only</el-radio-button>
                    <el-radio-button label="read">Read Only</el-radio-button>
                </el-radio-group>
                <div class="payment_actions">
                    <el-input @keyup.enter.native="fetchEntries()" size="small" placeholder="Search Entry" v-model="search">
                        <el-button @click="fetchEntries()" slot="append" icon="el-icon-search"></el-button>
                    </el-input>
                </div>
            </div>

            <el-table v-loading="loading" stripe :data="entries">
                <el-table-column width="220" label="Submission ID">
                    <template slot-scope="scope">
                        <a class="payment_sub_url" :href="scope.row.entry_url">
                            #{{scope.row.id}}
                        </a>
                        <span class="ff_payment_badge" v-if="scope.row.total_paid">{{formatMoney(scope.row)}}</span>
                    </template>
                </el-table-column>
                <el-table-column label="Form" prop="title"></el-table-column>
                <el-table-column width="160" label="Status">
                    <template slot-scope="scope">
                        {{scope.row.status|ucFirst}}
                    </template>
                </el-table-column>
                <el-table-column width="160" label="Browser" prop="browser"></el-table-column>
                <el-table-column width="260" label="Date">
                    <template slot-scope="scope">
                        {{scope.row.human_date}} ago
                    </template>
                </el-table-column>
            </el-table>

            <div class="pull-right ff_paginate">
                <el-pagination
                        @size-change="handleSizeChange"
                        @current-change="goToPage"
                        hide-on-single-page
                        :current-page.sync="paginate.current_page"
                        :page-sizes="[5, 10, 20, 50, 100]"
                        :page-size="parseInt(paginate.per_page)"
                        layout="total, sizes, prev, pager, next, jumper"
                        :total="paginate.total">
                </el-pagination>
            </div>
        </div>
    </div>
</template>

<script type="text/babel">
    import EntryChart from './chartView';
    export default {
        name: 'payments',
        components: {
            EntryChart
        },
        data() {
            return {
                entries: [],
                loading: false,
                selectedFormId: '',
                selectedPaymentMethods: [],
                selectedPaymentStatuses: [],
                paginate: {
                    total: 0,
                    current_page: 1,
                    last_page: 1,
                    per_page: 10
                },
                chart_status: 'yes',
                entry_status: '',
                search: ''
            }
        },
        methods: {
            fetchEntries(type) {
                if(type == 'reset') {
                    this.paginate.current_page = 1;
                }
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_all_entries',
                    form_id: this.selectedFormId,
                    page: this.paginate.current_page,
                    per_page: this.paginate.per_page,
                    search: this.search,
                    entry_status: this.entry_status
                })
                    .then(response => {
                        this.entries = response.data.entries;
                        this.paginate.total = response.data.total;
                        this.paginate.last_page = response.data.last_page;
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(() => {
                        this.loading = false;
                    })
            },
            goToPage(value) {
                this.paginate.current_page = value;
                this.fetchEntries();
            },
            handleSizeChange(val) {
                this.paginate.per_page = val;
                this.fetchEntries();
            },
            formatMoney(row) {
                let amount = row.total_paid / 100;
                if(parseFloat(amount) % 1) {
                    amount = parseFloat(amount).toFixed(2);
                }
                return amount +' '+ row.currency;
            },
            toggleChart() {
                if(this.chart_status == 'yes') {
                    this.chart_status = 'no';
                } else {
                    this.chart_status = 'yes';
                }
                localStorage.setItem('ff_chart_status', this.chart_status);
            }
        },
        filters: {
            ucFirst: function (value) {
                if (!value) return ''
                value = value.toString()
                return value.charAt(0).toUpperCase() + value.slice(1)
            }
        },
        mounted() {
            let status = localStorage.getItem('ff_chart_status');
            if(status) {
                this.chart_status = status;
            }
            this.fetchEntries();
        }
    };
</script>


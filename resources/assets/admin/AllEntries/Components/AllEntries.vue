<template>
    <div v-loading="loading" class="payments_wrapper">
        <div class="payment_header">
            <div class="payment_title">All Form Entries</div>
            <div class="payment_actions">
            </div>
        </div>
        <div class="entry_chart">
            <entry-chart></entry-chart>
        </div>

        <div class="payment_details">
            <el-table stripe :data="entries">
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
                }
            }
        },
        methods: {
            fetchEntries() {
                this.loading = true;
                jQuery.get(window.ajaxurl, {
                    action: 'fluentform_get_all_entries',
                    form_id: this.selectedFormId,
                    page: this.paginate.current_page,
                    per_page: this.paginate.per_page
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
            this.fetchEntries();
        }
    };
</script>

<style lang="scss">
    .payment_header {
        overflow: hidden;
        .payment_actions {
            float: right;
        }
    }
    .entry_chart {
        padding: 10px;
        background: white;
        margin: 20px 0px;
        box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
    }
    .el-table .warning-row {
        background: oldlace;
    }

    span.ff_payment_badge {
        padding: 0px 10px 2px;
        border: 1px solid gray;
        border-radius: 9px;
        margin-left: 5px;
        font-size: 12px;
    }

    tr.el-table__row td {
        padding: 18px 0px;
    }

    .pull-right.ff_paginate {
        margin-top: 20px;
    }

</style>

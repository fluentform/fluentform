<template>
    <div>
        <card class="ff-pro-component">
            <card-head>
                <div class="net-revenue-header">
                    <div class="title-section">
                        <h3>{{ getDynamicTitle() }}</h3>
                    </div>
                    <div class="controls-section">
                        <el-select
                            v-model="selectedGroupBy"
                            :placeholder="$t('Group By')"
                            size="mini"
                            @change="hasPro ? handleGroupByChange() : null"
                            style="width: 150px; margin-right: 12px;"
                        >
                            <el-option
                                v-for="(option, value) in groupByOptionsWithDisabled"
                                :key="value"
                                :label="option.label"
                                :value="value"
                                :disabled="option.disabled"
                            />
                        </el-select>
                    </div>
                </div>
            </card-head>

            <card-body>
                <chart-loader v-if="loading" :rows="12" />

                <div v-else-if="revenueData.length === 0" class="no-data-state">
                    <i class="el-icon-money no-data-icon"></i>
                    <span>{{ $t('No revenue data found for the selected date range.') }}</span>
                </div>

                <div v-else class="revenue-table-container">
                    <el-table
                        :data="revenueData"
                        style="width: 100%"
                        :default-sort="{ prop: 'net_revenue', order: 'descending' }"
                        stripe
                    >
                        <!-- Dynamic columns based on group by selection -->
                        <el-table-column
                            v-if="selectedGroupBy === 'forms'"
                            prop="form_title"
                            :label="$t('Form')"
                            min-width="200"
                            sortable
                        >
                            <template #default="{ row }">
                                <div class="form-info">
                                    <a
                                        :href="getFormPreviewUrl(row.form_id)"
                                        target="_blank"
                                        class="form-title-link"
                                    >
                                        <span class="form-title">{{ row.form_title }}</span>
                                    </a>
                                    <span class="form-id">#{{ row.form_id }}</span>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column
                            v-if="selectedGroupBy === 'payment_method'"
                            prop="payment_method_name"
                            :label="$t('Payment Method')"
                            min-width="150"
                            sortable
                        >
                            <template #default="{ row }">
                                <div class="payment-method">
                                    <span class="method-name">{{ row.payment_method_name }}</span>
                                    <span class="method-code">({{ row.payment_method }})</span>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column
                            v-if="selectedGroupBy === 'payment_type'"
                            prop="payment_type_name"
                            :label="$t('Payment Type')"
                            min-width="150"
                            sortable
                        />

                        <el-table-column
                            prop="paid_amount"
                            label="Paid"
                            min-width="120"
                            sortable
                            align="right"
                        >
                            <template #default="{ row }">
                                <span class="amount paid">{{ formatCurrency(row.paid_amount) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column
                            prop="pending_amount"
                            :label="$t('Pending')"
                            min-width="120"
                            sortable
                            align="right"
                        >
                            <template #default="{ row }">
                                <span class="amount pending">{{ formatCurrency(row.pending_amount) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column
                            prop="refunded_amount"
                            :label="$t('Refunded')"
                            min-width="120"
                            sortable
                            align="right"
                        >
                            <template #default="{ row }">
                                <span class="amount refunded">{{ formatCurrency(row.refunded_amount) }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column
                            prop="net_revenue"
                            :label="$t('Net Revenue')"
                            min-width="140"
                            sortable
                            align="right"
                        >
                            <template #default="{ row }">
                            <span class="amount net-revenue" :class="{ negative: row.net_revenue < 0 }">
                                {{ formatCurrency(row.net_revenue) }}
                            </span>
                            </template>
                        </el-table-column>

                        <el-table-column
                            v-if="selectedGroupBy !== 'forms'"
                            prop="transaction_count"
                            :label="$t('Count')"
                            min-width="100"
                            sortable
                            align="center"
                        >
                            <template #default="{ row }">
                                <span class="transaction-count net-revenue" :class="{ negative: row.net_revenue < 0 }">
                                    {{ row.transaction_count }}
                                </span>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
                <notice class="ff_alert_between update-info-notice" type="info-soft" v-if="!hasPro">
                    <div>
                        <h2 class="text">{{ $t('Please upgrade to pro to unlock this feature.') }}</h2>
                    </div>
                    <a target="_blank"
                       href="https://fluentforms.com/pricing/?utm_source=plugin&amp;utm_medium=wp_install&amp;utm_campaign=ff_upgrade&amp;theme_style=twentytwentythree"
                       class="el-button el-button--info el-button--small mt-2">
                        {{ $t('Upgrade to Pro') }}
                    </a>
                </notice>
            </card-body>
        </card>
        <div v-if="totalItems > pageSize" class="ff_pagination_wrap text-right pagination-container mt-4">
            <el-pagination
                class="ff_pagination"
                background
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="currentPage"
                :page-sizes="[5, 10, 20, 50, 100]"
                :page-size="parseInt(pageSize)"
                layout="total, sizes, prev, pager, next, jumper"
                :total="totalItems">
            </el-pagination>
        </div>
    </div>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";
import Notice from "@/admin/components/Notice/Notice.vue";
import { ChartLoader } from './shared/simple-utils.js';

export default {
    name: 'NetRevenueByGroup',
    components: {
        Card,
        CardBody,
        CardHead,
        Notice,
        ChartLoader
    },
    props: {
        formsList: {
            type: Array,
            default: () => []
        },
        globalDateParams: {
            type: Object,
            default: () => ({})
        },
        paymentCurrency: {
            type: String,
            default: '$'
        },
        selectedFormId: {
            type: [Number, String]
        }
    },
    data() {
        return {
            loading: false,
            revenueData: [],
            selectedGroupBy: 'forms',
            currentPage: 1,
            pageSize: localStorage.getItem('ffReportNetRevenuePerPage') || 5,
            totalItems: 0,
            summaryTotals: {
                paid: 0,
                pending: 0,
                refunded: 0,
                net: 0
            }
        };
    },
    computed: {
        hasPro() {
            return !!window.FluentFormApp.has_pro;
        },

        decodedCurrency() {
            return this.decodeHtmlEntities(this.paymentCurrency);
        },
        groupByOptions() {
            const options = {
                'forms': this.$t('Forms'),
                'payment_method': this.$t('Payment Method'),
                'payment_type': this.$t('Payment Type')
            };
            if (this.selectedFormId) {
                delete options.forms;
            }
            return options;
        },

           groupByOptionsWithDisabled() {
            let options = {};

            if (!this.hasPro) {
                // For non-pro users: only 'forms' is selectable, others are disabled
                options = {
                    'forms': { label: this.$t('Forms'), disabled: false },
                    'payment_method': { label: this.$t('Payment Method'), disabled: true },
                    'payment_type': { label: this.$t('Payment Type'), disabled: true }
                };
            } else {
                // For pro users: all options are selectable
                Object.keys(this.groupByOptions).forEach(key => {
                    options[key] = { label: this.groupByOptions[key], disabled: false };
                });
            }

            if (this.selectedFormId) {
                delete options.forms;
                // If a form is selected, make payment_method the only selectable option
                if (options.payment_method) {
                    options.payment_method.disabled = false;
                }
            }

            return options;
        },
    },
    watch: {
        globalDateParams: {
            handler() {
                this.fetchRevenueData();
            },
            deep: true
        },
        selectedFormId() {
            if (this.selectedFormId) {
                this.selectedGroupBy = 'payment_method';
            } else {
                this.selectedGroupBy = 'forms';
            }
            this.fetchRevenueData();
        }
    },
    mounted() {
        this.fetchRevenueData();
    },
    methods: {
        fetchRevenueData() {
            this.loading = true;

            if (!this.hasPro) {
                // Show demo data
                setTimeout(() => {
                    this.revenueData = [
                        {
                            form_id: "1",
                            form_title: "Contact Form",
                            paid_amount: 380,
                            pending_amount: 1540,
                            refunded_amount: 0,
                            net_revenue: 380
                        },
                        {
                            form_id: "3",
                            form_title: "Feedback Form",
                            paid_amount: 30,
                            pending_amount: 2420,
                            refunded_amount: 20,
                            net_revenue: 380
                        }
                    ];
                    this.totalItems = 1;
                    this.summaryTotals = {
                        paid: 380,
                        pending: 1540,
                        refunded: 0,
                        net: 380
                    };
                    this.loading = false;
                }, 100); // Simulate loading time
                return;
            }

            const data = {
                group_by: this.selectedGroupBy,
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                form_id: this.selectedFormId,
                per_page: this.pageSize,
                page: this.currentPage
            };
            const url = FluentFormsGlobal.$rest.route("netRevenueReport");

            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    if (response) {
                        this.revenueData = response.data || [];
                        this.totalItems = response.total || 0;
                        this.summaryTotals = response.totals || { paid: 0, pending: 0, refunded: 0, net: 0 };
                    } else {
                        this.revenueData = [];
                        this.totalItems = 0;
                        this.summaryTotals = { paid: 0, pending: 0, refunded: 0, net: 0 };
                    }
                })
                .catch(error => {
                    this.revenueData = [];
                    this.totalItems = 0;
                    this.summaryTotals = { paid: 0, pending: 0, refunded: 0, net: 0 };
                    this.$message.error('Failed to load revenue data');
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        handleGroupByChange() {
            this.currentPage = 1;
            this.fetchRevenueData();
        },

        formatCurrency(amount) {
            if (amount === null || amount === undefined) {
                return this.decodedCurrency + '0.00';
            }

            const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });

            return (amount < 0 ? '-' : '') + this.decodedCurrency + formattedAmount;
        },

        decodeHtmlEntities(text) {
            if (!text) return '$';
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        },

        handleSizeChange(newSize) {
            this.pageSize = newSize;
            localStorage.setItem('ffReportNetRevenuePerPage', newSize);
            this.currentPage = 1;
            this.fetchRevenueData();
        },
        handleCurrentChange(newPage) {
            this.currentPage = newPage;
            this.fetchRevenueData();
        },
        getDynamicTitle() {
            const baseTitle = this.$t('Payment Analysis');
            if (this.selectedGroupBy && this.groupByOptions[this.selectedGroupBy]) {
                return `${baseTitle} ${this.$t('by')} ${this.groupByOptions[this.selectedGroupBy]}`;
            }
            return baseTitle;
        },
        getFormPreviewUrl(formId) {
            return `${window.location.origin}/?fluent_forms_pages=1&design_mode=1&preview_id=${formId}#ff_preview`;
        }
    }
};
</script>

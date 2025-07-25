<template>
    <div>
        <card>
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
                            @change="handleGroupByChange"
                            style="width: 150px; margin-right: 12px;"
                        >
                            <el-option
                                v-for="(label, value) in groupByOptions"
                                :key="value"
                                :label="label"
                                :value="value"
                            />
                        </el-select>
                    </div>
                </div>
            </card-head>

            <card-body>
                <div v-if="loading" class="loading-state">
                    <el-skeleton :rows="12" animated />
                </div>

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

export default {
    name: 'NetRevenueByGroup',
    components: {
        Card,
        CardBody,
        CardHead
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
            type: Number
        }
    },
    data() {
        return {
            loading: false,
            revenueData: [],
            selectedGroupBy: 'forms',
            groupByOptions: {
                'forms': this.$t('Forms'),
                'payment_method': this.$t('Payment Method'),
                'payment_type': this.$t('Payment Type')
            },
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
        decodedCurrency() {
            return this.decodeHtmlEntities(this.paymentCurrency);
        }
    },
    watch: {
        globalDateParams: {
            handler() {
                this.fetchRevenueData();
            },
            deep: true
        },
        selectedFormId() {
            this.fetchRevenueData();
        }
    },
    mounted() {
        this.fetchRevenueData();
    },
    methods: {
        fetchRevenueData() {
            this.loading = true;

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

<style scoped>
/* Add pagination styling */
.pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

/* Keep existing styles */
.net-revenue-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    gap: 20px;
}

.title-section {
    flex: 1;
}

.title-section h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: #374151;
}

.controls-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}

.loading-state {
    padding: 20px;
}

.no-data-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: #6b7280;
}

.no-data-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
}

.no-data-state h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #374151;
}

.no-data-state p {
    margin: 0;
    font-size: 14px;
    max-width: 300px;
    line-height: 1.5;
}

.revenue-table-container {
    margin-top: 16px;
}

.form-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.form-title {
    font-weight: 500;
    color: #374151;
}

.form-id {
    font-size: 12px;
    color: #9ca3af;
}

.payment-method {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.method-name {
    font-weight: 500;
    color: #374151;
}

.method-code {
    font-size: 12px;
    color: #9ca3af;
    text-transform: lowercase;
}

.form-title-link:hover {
    text-decoration: underline;
}
</style>

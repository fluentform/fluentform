<template>
    <div>
        <card>
            <card-head>
                <div class="net-revenue-header">
                    <div class="title-section">
                        <h3>Revenue Analysis </h3>
                    </div>
                    <div class="controls-section">
                        <el-select
                            v-model="selectedGroupBy"
                            placeholder="Group By"
                            size="small"
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

                        <el-select
                            v-if="selectedGroupBy !== 'forms'"
                            v-model="selectedFormId"
                            placeholder="Select Form"
                            size="small"
                            clearable
                            filterable
                            @change="handleFormChange"
                            style="width: 200px;"
                        >
                            <el-option label="All Forms" :value="null" />
                            <el-option
                                v-for="form in formsList"
                                :key="form.id"
                                :label="`#${form.id} - ${form.title}`"
                                :value="form.id"
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
                    <div class="no-data-icon">💰</div>
                    <h4>No Revenue Data Available</h4>
                    <p>No revenue data found for the selected criteria and date range.</p>
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
                            label="Form"
                            min-width="200"
                            sortable
                        >
                            <template #default="{ row }">
                                <div class="form-info">
                                    <span class="form-title">{{ row.form_title }}</span>
                                    <span class="form-id">#{{ row.form_id }}</span>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column
                            v-if="selectedGroupBy === 'payment_method'"
                            prop="payment_method_name"
                            label="Payment Method"
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
                            label="Payment Type"
                            min-width="150"
                            sortable
                        />

                        <el-table-column
                            prop="paid_amount"
                            label="Paid Amount"
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
                            label="Pending Amount"
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
                            label="Refunded Amount"
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
                            label="Net Revenue"
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
                            label="Transactions"
                            min-width="100"
                            sortable
                            align="center"
                        >
                            <template #default="{ row }">
                                <el-tag size="small" type="info">{{ row.transaction_count }}</el-tag>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </card-body>
        </card>
        <div class="ff_pagination_wrap text-right pagination-container mt-4">
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
        }
    },
    data() {
        return {
            loading: false,
            revenueData: [],
            selectedGroupBy: 'forms',
            selectedFormId: null,
            groupByOptions: {
                'forms': 'Forms',
                'payment_method': 'Payment Method',
                'payment_type': 'Payment Type'
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
        }
    },
    mounted() {
        this.fetchRevenueData();
    },
    methods: {
        fetchRevenueData() {
            this.loading = true;

            const data = {
                action: 'fluentform-get-net-revenue-by-group',
                group_by: this.selectedGroupBy,
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                form_id: this.selectedFormId,
                per_page: this.pageSize,
                page: this.currentPage
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data) {
                        this.revenueData = response.data.data || [];
                        this.totalItems = response.data.total || 0;
                        this.summaryTotals = response.data.totals || { paid: 0, pending: 0, refunded: 0, net: 0 };
                    } else {
                        this.revenueData = [];
                        this.totalItems = 0;
                        this.summaryTotals = { paid: 0, pending: 0, refunded: 0, net: 0 };
                    }
                })
                .fail(error => {
                    this.revenueData = [];
                    this.totalItems = 0;
                    this.summaryTotals = { paid: 0, pending: 0, refunded: 0, net: 0 };
                    this.$message.error('Failed to load revenue data');
                })
                .always(() => {
                    this.loading = false;
                });
        },

        handleGroupByChange() {
            // Reset form selection when changing group by
            this.selectedFormId = null;
            this.currentPage = 1;
            this.fetchRevenueData();
        },

        handleFormChange() {
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

        formatCurrentDateRange() {
            if (!this.globalDateParams.startDate || !this.globalDateParams.endDate) {
                return 'No date range selected';
            }

            const startDate = new Date(this.globalDateParams.startDate);
            const endDate = new Date(this.globalDateParams.endDate);

            // Check if it's the same day
            if (this.isSameDay(startDate, endDate)) {
                return this.formatDate(startDate);
            }

            // Check if it's the same month
            if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
                return `${this.formatDateShort(startDate)} - ${this.formatDate(endDate)}`;
            }

            // Different months or years
            return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
        },

        isSameDay(date1, date2) {
            return date1.getDate() === date2.getDate() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getFullYear() === date2.getFullYear();
        },

        formatDate(date) {
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };
            return date.toLocaleDateString('en-US', options);
        },

        formatDateShort(date) {
            const options = {
                month: 'short',
                day: 'numeric'
            };
            return date.toLocaleDateString('en-US', options);
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

/* Responsive adjustments */
@media (max-width: 1024px) {
    .net-revenue-header {
        flex-direction: column;
        gap: 16px;
    }

    .controls-section {
        align-self: flex-end;
        flex-wrap: wrap;
        justify-content: flex-end;
    }
}

@media (max-width: 768px) {
    .controls-section {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        width: 100%;
    }

    .controls-section .el-select {
        width: 100% !important;
    }
}
</style>

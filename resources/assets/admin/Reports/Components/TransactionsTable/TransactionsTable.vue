<template>
    <div class="transactions-table">
        <card>
            <card-head>
                <h3>Recent Transaction</h3>
                <div class="card-controls">
                    <el-switch
                        v-model="advancedFilter"
                        active-text="Advanced Filter"
                        inactive-text=""
                        size="small"
                    ></el-switch>
                </div>
            </card-head>

            <card-body class="transactions-table-body">
                <!-- Advanced Filter Section -->
                <div v-if="advancedFilter" class="advanced-filter-section">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label class="filter-label">Form:</label>
                            <el-select
                                v-model="formFilter"
                                placeholder="All Forms"
                                size="small"
                                @change="applyFilters"
                                filterable
                                clearable
                            >
                                <el-option label="All Forms" :value="null"></el-option>
                                <el-option
                                    v-for="form in paymentForms"
                                    :key="form.id"
                                    :label="`#${form.id} - ${form.title}`"
                                    :value="form.id"
                                ></el-option>
                            </el-select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Status:</label>
                            <el-select
                                v-model="statusFilter"
                                placeholder="All Status"
                                size="small"
                                @change="applyFilters"
                                clearable
                            >
                                <el-option label="All Status" :value="null"></el-option>
                                <el-option
                                    v-for="(value, key, index) in payment_statuses"
                                    :key="key"
                                    :label="value"
                                    :value="key"
                                ></el-option>
                            </el-select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Methods:</label>
                            <el-select
                                v-model="paymentMethodFilter"
                                placeholder="All Methods"
                                size="small"
                                clearable
                                filterable
                                @change="applyFilters"
                            >
                                <el-option label="All Methods" :value="null"></el-option>
                                <el-option
                                    v-for="(value, key, index) in payment_methods"
                                    :key="key"
                                    :label="value.title"
                                    :value="key"
                                ></el-option>
                            </el-select>
                        </div>
                    </div>
                </div>

                <div v-if="!transactions || transactions.length === 0" class="empty-state">
                    No transactions found
                </div>

                <div v-else>
                    <el-table
                        :data="paginatedTransactions"
                        style="width: 100%"
                        :show-header="true"
                        class="modern-table"
                        size="medium"
                    >
                        <el-table-column prop="transactionId" label="Transaction ID">
                            <template slot-scope="{ row }">
                                <a href="#" class="transaction-link" @click.prevent="viewTransaction(row.submissionLink)">
                                    {{ row.transactionId }}
                                </a>
                            </template>
                        </el-table-column>

                        <el-table-column prop="date" label="Date" width="120" align="center">
                            <template slot-scope="{ row }">
                                <span class="date-text">{{ row.date }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column prop="amount" label="Amount" width="90" align="center">
                            <template slot-scope="{ row }">
                                <span class="amount-text">${{ row.amount }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column prop="paymentMethod" label="Payment" width="90" align="center">
                            <template slot-scope="{ row }">
                                <span class="payment-method">{{ row.paymentMethod }}</span>
                            </template>
                        </el-table-column>

                        <el-table-column label="Status" width="90" align="center">
                            <template slot-scope="{ row }">
                                <el-tag
                                    :type="getStatusType(row.status)"
                                    effect="light"
                                    size="mini"
                                    class="status-tag"
                                >
                                    {{ row.status }}
                                </el-tag>
                            </template>
                        </el-table-column>
                    </el-table>

                    <!-- Pagination component -->
                    <div class="pagination-container">
                        <el-pagination
                            class="ff_pagination"
                            :page-sizes="[5, 10, 20, 50, 100]"
                            @current-change="handlePageChange"
                            :current-page.sync="currentPage"
                            :page-size="pageSize"
                            layout="prev, pager, next"
                            :total="totalTransactions"
                            :hide-on-single-page="true"
                            background
                            small
                        >
                        </el-pagination>
                    </div>
                </div>
            </card-body>
        </card>
    </div>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'TransactionsTable',
    components: {
        Card,
        CardBody,
        CardHead,
    },
    props: ['transactions', 'forms_list', 'global_date_params'],
    emits: ['transactions-filter-change', 'page-change'],
    data() {
        return {
            formFilter: null,
            statusFilter: null,
            paymentMethodFilter: null,
            advancedFilter: false,
            currentPage: 1,
            pageSize: 5
        };
    },
    methods: {
        getStatusType(status) {
            if (status === 'Paid' || status === 'Completed') {
                return 'success';
            } else if (status === 'Failed') {
                return 'danger';
            } else {
                return 'warning';
            }
        },
        getStatusIcon(status) {
            if (status === 'Paid' || status === 'Completed' || status === 'Success') {
                return 'ff-icon-check';
            } else if (status === 'Failed') {
                return 'ff-icon-close';
            } else if (status === 'Processing') {
                return 'ff-icon-refresh';
            } else if (status === 'Refunded' || status === 'Partially Refunded') {
                return 'ff-icon-refresh';
            } else {
                return 'ff-icon-calendar';
            }
        },
        viewTransaction(link) {
            window.location.href = link;
        },
        applyFilters() {
            this.currentPage = 1;
            this.$emit('transactions-filter-change', {
                formId: this.formFilter,
                paymentStatus: this.statusFilter,
                paymentMethod: this.paymentMethodFilter
            });
        },
        handlePageChange(page) {
            this.currentPage = page;
            this.$emit('page-change', page);
        }
    },
    computed: {
        totalTransactions() {
            return this.transactions ? this.transactions.length : 0;
        },
        paginatedTransactions() {
            if (!this.transactions) return [];

            const startIndex = (this.currentPage - 1) * this.pageSize;
            const endIndex = startIndex + this.pageSize;

            return this.transactions.slice(startIndex, endIndex);
        },
        paymentForms() {
            return this.forms_list ? this.forms_list.filter(form => form.has_payment == 1) : [];
        },
        payment_statuses() {
            return window.FluentFormApp?.payment_statuses;
        },
        payment_methods() {
            return window.FluentFormApp?.payment_methods;
        }
    }
};
</script>
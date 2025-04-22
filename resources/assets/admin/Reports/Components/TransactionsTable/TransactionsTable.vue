<template>
    <div class="transactions-table">
        <card>
            <card-head class="transactions-table-header">
                <h3>Recent Transactions</h3>
                <div>
                    <el-select
                        v-model="formFilter"
                        placeholder="Filter by Form"
                        clearable
                        @change="applyFilters"
                        class="filter-select"
                    >
                        <el-option
                            v-for="form in paymentForms"
                            :key="form.id"
                            :label="'#' + form.id + ' - ' + form.title"
                            :value="form.id">
                        </el-option>
                    </el-select>
                    <el-select
                        v-model="statusFilter"
                        placeholder="Filter by Status"
                        clearable
                        @change="applyFilters"
                        class="filter-select"
                    >
                        <el-option
                            v-for="(label, key) in payment_statuses"
                            :key="key"
                            :label="label"
                            :value="key"
                        />
                    </el-select>
                    <el-select
                        v-model="paymentMethodFilter"
                        placeholder="Filter by Payment Method"
                        clearable
                        @change="applyFilters"
                        class="filter-select"
                    >
                        <el-option
                            v-for="status in payment_methods"
                            :key="status.method_value"
                            :label="status.title"
                            :value="status.method_value"
                        />
                    </el-select>
                    <el-date-picker
                        v-model="dateRange"
                        type="daterange"
                        range-separator="-"
                        start-placeholder="Start date"
                        end-placeholder="End date"
                        format="MMM d, yyyy"
                        value-format="MMM d, yyyy"
                        :default-time="['00:00:00', '23:59:59']"
                        @change="handleDateChange"
                        :disabledDate="disableFutureDates"
                    />
                </div>
            </card-head>

            <card-body class="transactions-table-body">
                <div v-if="!transactions || transactions.length === 0" class="empty-state">
                    No transactions found
                </div>
                <el-table
                    v-else
                    :data="transactions"
                    stripe
                    style="width: 100%"
                >
                    <el-table-column prop="transactionId" label="Transaction ID">
                        <template slot-scope="{ row }">
                            <a href="#" class="transaction-link" @click.prevent="viewTransaction(row.submissionLink)">
                                {{ row.transactionId }}
                            </a>
                        </template>
                    </el-table-column>

                    <el-table-column prop="date" label="Date" sortable width="150"></el-table-column>
                    <el-table-column prop="amount" label="Amount" sortable width="120">
                        <template slot-scope="{ row }">
                            {{ row.currency + ' ' + row.amount }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="paymentMethod" label="Payment Method" width="150"></el-table-column>

                    <el-table-column label="Status" width="120">
                        <template slot-scope="{ row }">
                            <el-tag :type="getStatusType(row.status)" effect="light">
                                <i :class="getStatusIcon(row.status)"></i> {{ row.status }}
                            </el-tag>
                        </template>
                    </el-table-column>
                </el-table>
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
    props: ['transactions', 'forms_list'],
    emits: ['transactions-date-change'],
    data() {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return {
            dateRange: [
                this.formatDateForDisplay(thirtyDaysAgo),
                this.formatDateForDisplay(now)
            ],
            formFilter: null,
            statusFilter: null,
            paymentMethodFilter: null,
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
        disableFutureDates(date) {
            return date > new Date();
        },
        formatDateForDisplay(date) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        },
        handleDateChange(range) {
            if (!range || !range[0] || !range[1]) return;

            // Parse the date strings
            const startParts = range[0].split(" ");
            const startMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(startParts[0]);
            const startDay = parseInt(startParts[1].replace(',', ''));
            const startYear = parseInt(startParts[2]);

            const endParts = range[1].split(" ");
            const endMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(endParts[0]);
            const endDay = parseInt(endParts[1].replace(',', ''));
            const endYear = parseInt(endParts[2]);

            // Create Date objects
            const startDate = new Date(startYear, startMonth, startDay);
            const endDate = new Date(endYear, endMonth, endDay);

            // Format dates for API
            const formatDateForApi = (date, isStart) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const time = isStart ? '00:00:00' : '23:59:59';
                return `${year}-${month}-${day} ${time}`;
            };

            this.$emit('transactions-filter-change', {
                startDate: formatDateForApi(startDate, true),
                endDate: formatDateForApi(endDate, false),
                formId: this.formFilter,
                paymentStatus: this.statusFilter,
                paymentMethod: this.paymentMethodFilter
            });
        },

        applyFilters() {
            // If we have date range, use it to trigger the filter with all current values
            if (this.dateRange && this.dateRange[0] && this.dateRange[1]) {
                this.handleDateChange(this.dateRange);
            }
        },
    },
    computed: {
        paymentForms() {
            return this.forms_list.filter(form => form.has_payment == 1);
        },
        payment_statuses() {
            return window.FluentFormApp.payment_statuses || [];
        },
        payment_methods() {
            return window.FluentFormApp.payment_methods || [];
        }
    }
};
</script>
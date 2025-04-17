<template>
    <div class="transcriptions-table">
        <card>
            <card-head class="d-flex justify-between">
                <h3>Recent Transactions</h3>
                <div>
                    <el-input v-model="search" placeholder="Search..." clearable></el-input>
                </div>
            </card-head>

            <card-body>
                <div v-if="loading" class="loading-state">
                    <i class="el-icon-loading"></i> Loading transactions...
                </div>
                <div v-else-if="!transactions || transactions.length === 0" class="empty-state">
                    No transactions found
                </div>
                <el-table
                    v-else
                    :data="filteredTransactions"
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
                            {{ formatCurrency(row.amount, row.currency) }}
                        </template>
                    </el-table-column>

                    <el-table-column prop="paymentMethod" label="Payment Method" width="150"></el-table-column>

                    <el-table-column label="Status" width="120">
                        <template slot-scope="{ row }">
                            <el-tag :type="statusType(row.status)" effect="plain" size="small">
                                <i :class="statusIcon(row.status)"></i> {{ row.status }}
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
    props: {
        transactions: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            search: "",
        };
    },
    computed: {
        filteredTransactions() {
            if (!this.transactions) return [];

            return this.transactions.filter((txn) =>
                Object.values(txn).some(value =>
                    String(value).toLowerCase().includes(this.search.toLowerCase())
                )
            );
        }
    },
    methods: {
        formatCurrency(value, currency = 'USD') {
            const currencySymbols = {
                'USD': '$',
                'EUR': '€',
                'GBP': '£',
                'JPY': '¥',
                'INR': '₹'
            };

            const symbol = currencySymbols[currency] || '$';
            return `${symbol}${value.toFixed(2)}`;
        },
        statusType(status) {
            const statusMap = {
                'Pending': 'warning',
                'Paid': 'success',
                'Completed': 'success',
                'Processing': 'info',
                'Failed': 'danger',
                'Refunded': 'info',
                'Cancelled': 'info'
            };

            return statusMap[status] || 'info';
        },
        statusIcon(status) {
            const iconMap = {
                'Pending': 'el-icon-time',
                'Paid': 'el-icon-check',
                'Completed': 'el-icon-check',
                'Processing': 'el-icon-loading',
                'Failed': 'el-icon-close',
                'Refunded': 'el-icon-back',
                'Cancelled': 'el-icon-close'
            };

            return iconMap[status] || 'el-icon-question';
        },
        viewTransaction(link) {
            window.location.href = link;
        }
    }
};
</script>

<style scoped>
.transaction-link {
    color: #409EFF;
    text-decoration: none;
}

.transaction-link:hover {
    text-decoration: underline;
}

.loading-state, .empty-state {
    padding: 40px;
    text-align: center;
    color: #909399;
}

.loading-state i {
    margin-right: 8px;
}
</style>
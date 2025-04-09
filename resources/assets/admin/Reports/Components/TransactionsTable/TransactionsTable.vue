<template>
    <div class="transcriptions-table">
        <card>
            <card-head class="d-flex justify-between">
                <h3>Recent Transaction</h3>
                <div>
                    <el-input v-model="search" placeholder="Search..." clearable></el-input>
                </div>
            </card-head>

            <card-body>
                <el-table
                    :data="filteredTransactions"
                    stripe
                    style="width: 100%"
                >
                    <el-table-column prop="transactionId" label="Transaction ID">
                        <template slot-scope="{ row }">
                            <a href="#" class="transaction-link">{{ row.transactionId }}</a>
                        </template>
                    </el-table-column>
    
                    <el-table-column prop="date" label="Date" sortable></el-table-column>
                    <el-table-column prop="amount" label="Amount" sortable>
                        <template slot-scope="{ row }">
                            {{ formatCurrency(row.amount) }}
                        </template>
                    </el-table-column>
    
                    <el-table-column prop="paymentMethod" label="Payment Method"></el-table-column>
    
                    <el-table-column label="Status">
                        <template slot-scope="{ row }">
                            <el-tag :type="statusType(row.status)" effect="plain">
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
    data() {
        return {
            search: "",
            transactions: [
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "05 Jul, 2024", amount: 280, paymentMethod: "Paypal", status: "Pending" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "12 May, 2024", amount: 240, paymentMethod: "Stripe", status: "Paid" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "20 Feb, 2024", amount: 180, paymentMethod: "SSLCommerz", status: "Processing" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "02 Feb, 2024", amount: 150, paymentMethod: "Paypal", status: "Failed" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "15 Jan, 2024", amount: 380, paymentMethod: "Paypal", status: "Paid" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "15 Jan, 2024", amount: 380, paymentMethod: "Paypal", status: "Paid" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "02 Feb, 2024", amount: 150, paymentMethod: "Paypal", status: "Failed" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "20 Feb, 2024", amount: 180, paymentMethod: "SSLCommerz", status: "Processing" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "05 Jul, 2024", amount: 280, paymentMethod: "Paypal", status: "Pending" },
                { transactionId: "txn_01j9157040zhj73yf36h864fz", date: "20 Feb, 2024", amount: 180, paymentMethod: "SSLCommerz", status: "Processing" },
            ]
        };
    },
    computed: {
        filteredTransactions() {
            return this.transactions.filter((txn) =>
                Object.values(txn).some(value =>
                    String(value).toLowerCase().includes(this.search.toLowerCase())
                )
            );
        }
    },
    methods: {
        formatCurrency(value) {
            return `$${value.toFixed(2)}`;
        },
        statusType(status) {
            switch (status) {
                case "Pending": return "warning";
                case "Paid": return "success";
                case "Processing": return "info";
                case "Failed": return "danger";
                default: return "";
            }
        },
        statusIcon(status) {
            switch (status) {
                case "Pending": return "el-icon-time";
                case "Paid": return "el-icon-check";
                case "Processing": return "el-icon-loading";
                case "Failed": return "el-icon-warning";
                default: return "";
            }
        }
    }
};
</script>

<style scoped>
.table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}
.transaction-link {
    color: #409EFF;
    text-decoration: none;
}
</style>

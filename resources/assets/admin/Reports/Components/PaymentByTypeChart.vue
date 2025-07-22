<template>
    <card>
        <card-head>
            <h3>Transaction</h3>

            <div class="card-controls">
                <el-radio-group v-model="paymentType" size="small">
                    <el-radio-button label="subscription">Recurring</el-radio-button>
                    <el-radio-button label="onetime">One Time</el-radio-button>
                </el-radio-group>
            </div>
        </card-head>

        <card-body>
            <div class="payment-amount-section">
                <div class="total-amount-section">
                    <p class="amount-label">Total Amount</p>
                    <div class="amount-value">{{ currencySymbol }}{{ formatNumber(totalAmount) }}</div>
                </div>
            </div>

            <div class="payment-chart-section">
                <div v-if="!hasPaymentData"  class="no-data">
                    <i class="el-icon-data-analysis  no-data-icon"></i>
                    <span>No payment data available for the selected period</span>
                </div>
                <div v-else class="payment-bar-chart">
                    <div class="payment-bars">
                        <div class="payment-bar-container">
                            <template v-for="status in paymentStatusData">
                                <template v-if="status.percentage > 0">
                                    <el-tooltip
                                        :key="status.label" effect="dark"
                                        :content="status.percentage + '%'"
                                        placement="top"
                                    >
                                        <div
                                            class="payment-bar"
                                            :style="{ width: status.percentage + '%', backgroundColor: status.color }"
                                        ></div>
                                    </el-tooltip>
                                </template>
                            </template>
                        </div>
                    </div>

                    <div class="payment-status-list">
                        <div v-for="status in paymentStatusData" :key="status.label" class="payment-status-item">
                            <div class="status-icon" :style="{ backgroundColor: status.color }"></div>
                            <div class="status-label">{{ status.label }}</div>
                            <div class="status-amount">{{ currencySymbol }}{{ formatNumber(status.amount) }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="hasPaymentData" class="weekly-average">
                Weekly average paid {{ currencySymbol }}{{ formatNumber(weeklyAverage) }}
            </div>
        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'PaymentByTypeChart',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: {
        paymentData: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            paymentType: 'onetime',
        };
    },
    computed: {
        statuses() {
            let statuses ={
                paid: { label: 'Paid', color: '#23A682' },
                pending: { label: 'Pending', color: '#F6B51E' },
                refunded: { label: 'Refunded', color: '#FB4BA3' },
                revenue: { label: 'Revenue', color: '#7D52F4' },
                cancelled: { label: 'Cancelled', color: '#FB3748' },
                failed: { label: 'Failed', color: '#FB3748' },
            };
            if (this.paymentType === 'onetime') {
                delete statuses.cancelled;
            }
            return statuses;
        },
        hasPaymentData() {
            return this.totalAmount > 0;
        },
        paymentStatusData() {
            let data = [];
            if (this.paymentData && this.paymentData[this.paymentType]) {
                let statuses = this.paymentData[this.paymentType].payment_statuses;
                for (let status in this.statuses) {
                    if (statuses[status]) {
                        data.push({
                            label: this.statuses[status].label,
                            amount: statuses[status].amount,
                            percentage: statuses[status].percentage,
                            color: this.statuses[status].color
                        });
                    } else {
                        data.push({
                            label: this.statuses[status].label,
                            amount: 0,
                            percentage: 0,
                            color: this.statuses[status].color
                        });
                    }
                }
            }
            return data;
        },
        totalAmount() {
            return this.paymentData && this.paymentData[this.paymentType] ? this.paymentData[this.paymentType].total_amount : 0;
        },
        weeklyAverage() {
            return this.paymentData && this.paymentData[this.paymentType] ? this.paymentData[this.paymentType].weekly_average : 0;
        },
        currencySymbol() {
            return this.paymentData?.currency_symbol || '$';
        }
    },
    methods: {
        formatNumber(num) {
            return parseFloat(num).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    }
};
</script>

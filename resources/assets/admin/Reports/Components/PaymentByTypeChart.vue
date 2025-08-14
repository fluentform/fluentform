<template>
    <card>
        <card-head>
            <h3>{{ $t('Transaction') }}</h3>

            <div class="card-controls">
                <el-radio-group v-model="paymentType" size="mini">
                    <el-radio-button label="subscription">{{ $t('Recurring') }}</el-radio-button>
                    <el-radio-button label="onetime">{{ $t('One Time') }}</el-radio-button>
                </el-radio-group>
            </div>
        </card-head>

        <card-body>
            <div class="payment-amount-section" v-if="hasPaymentData">
                <div class="total-amount-section">
                    <p class="amount-label">{{ $t('Total Amount') }}</p>
                    <div class="amount-value">{{ currencySymbol }}{{ formatNumber(totalAmount) }}</div>
                </div>
            </div>

            <div class="payment-chart-section" :class="{ 'no-data': !hasPaymentData }">
                <div v-if="!hasPaymentData"  class="no-data">
                    <i class="el-icon-data-analysis  no-data-icon"></i>
                    <span>{{ $t('No payment data available for the selected period') }}</span>
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

        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";
import { COLORS, formatNumber, formatCurrency, getCurrencySymbol } from './shared/simple-utils.js';

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
                paid: { label: this.$t('Paid'), color: COLORS.paid },
                pending: { label: this.$t('Pending'), color: COLORS.pending },
                refunded: { label: this.$t('Refunded'), color: COLORS.refunded },
                revenue: { label: this.$t('Revenue'), color: COLORS.revenue },
                cancelled: { label: this.$t('Cancelled'), color: COLORS.cancelled },
                failed: { label: this.$t('Failed'), color: COLORS.failed },
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
        currencySymbol() {
            return getCurrencySymbol(this.paymentData?.currency_symbol || '$');
        }
    },
    methods: {
        formatNumber
    }
};
</script>

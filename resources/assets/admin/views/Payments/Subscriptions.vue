<template>
    <div class="entry_info_box entry_submission_order_data">
        <div class="entry_info_header">
            <div class="info_box_header">
                {{ $t('Subscriptions (Recurring Payments)') }}
            </div>
        </div>

        <div class="entry_info_body">
            <div
                    :key="subscriptionIndex"
                    class="payment_header subscripton_item"
                    v-for="(subscription, subscriptionIndex) in subscriptions"
            >
                <div class="payment_head_top">
                    <div class="payment_header_left">
                        <p class="head_small_title">
                            {{ subscription.plan_name }}

                            <span class="mini_title">
                                ({{ subscription.item_name }})
                            </span>
                        </p>

                        <div class="head_payment_amount">
                            <span
                                    class="pay_amount"
                                    v-html="mayBeHandleDiscount(subscription.recurring_amount)"
                            />

                            <span>/{{ subscription.billing_interval }}</span><span v-if="subscription.quantity > 1"> x {{ subscription.quantity }}</span>

                            <span :class="'ff_pay_status_badge ff_pay_status_' + subscription.status">
                                <i :class="getPaymentStatusIcon(subscription.status)"></i> {{ subscription.status }}
                            </span>

                            <span v-show="parseInt(subscription.initial_amount)"> & Signup Fee: <em v-html="formatMoney(subscription.initial_amount)"></em></span>
                        </div>
                    </div>

                    <div class="payment_header_right">
                        <a
                                rel="noopener"
                                target="_blank"
                                :href="getSubscriptionUrl(subscription)"
                                v-show="getSubscriptionUrl(subscription)"
                                class="el-button el-button--default el-button--mini"
                        >
                            View on {{ payment_method }}
                        </a>

                        <p style="margin-top: 0">
                            <span>Total Payment Received: </span>
                            <span
                                    class="table_payment_amount"
                                    v-html="subscriptionTotal(subscription.related_payments)"
                            />
                        </p>

                        <p style="margin-top: 0" v-html="subscriptionHumanText(subscription.original_plan)"></p>
                    </div>
                </div>

                <div class="payment_head_bottom wpf_entry_order_items">
                    <h3>Related Payments</h3>

                    <table
                            v-if="subscription.related_payments.length"
                            class="wp-list-table widefat table table-bordered striped"
                    >
                        <thead>
                        <tr>
                            <th>{{ $t('Amount') }}</th>
                            <th>{{ $t('Date (GMT)') }}</th>
                            <th></th>
                        </tr>
                        </thead>

                        <tbody>
                        <tr
                                :key="i"
                                v-for="(payment,i) in subscription.related_payments"
                        >
                            <td>
                                    <span
                                            class="table_payment_amount"
                                            v-html="mayBeHandleDiscount(payment.payment_total)"
                                    />

                                <span class="payment_currency">
                                    {{ payment.currency }}
                                </span>

                                <span class="ff_pay_status_badge ff_pay_status_active">
                                    {{ payment.status }}
                                </span>
                            </td>

                            <td>
                                {{ payment.created_at | dateFormat('MMM DD, YYYY h:mm:ss a') }}
                            </td>

                            <td>
                                <a
                                        rel="noopener"
                                        target="_blank"
                                        v-if="payment.action_url"
                                        :href="payment.action_url"
                                        class="el-button el-button--mini"
                                >
                                    <i class="el-icon-view"></i>
                                </a>
                            </td>
                        </tr>

                        <template v-if="discounts.percent">
                            <tr v-for="(payment,i) in subscription.related_payments">
                                <td>
                                    {{ $t('Discounts') }}
                                </td>

                                <td>
                                    <span v-html="getDiscountsTotal(payment.payment_total)"/>
                                </td>
                            </tr>
                        </template>
                        </tbody>
                    </table>
                    <div v-else>
                        <p>
                            {{ $t('All received payments will be shown here. No payments received yet!') }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import each from "lodash/each";

    export default {
        name: "Subscriptions",
        props: ['subscriptions', 'discounts', 'payment_method'],
        methods: {
            mayBeHandleDiscount(amount) {
                if (this.discounts.percent) {
                    amount -= amount * (this.discounts.percent / 100)
                }

                return this.formatMoney(amount);
            },

            getSubscriptionUrl(subscription) {
                if (this.payment_method === 'stripe') {
                    if (subscription.payment_mode === 'test') {
                        return 'https://dashboard.stripe.com/test/subscriptions/' + subscription.vendor_subscription_id;
                    }

                    return 'https://dashboard.stripe.com/subscriptions/' + subscription.vendor_subscription_id;
                }
            },

            subscriptionTotal(payments) {
                let total = 0;

                each(payments, (payment) => {
                    if (payment.status === 'paid') {
                        total += payment.payment_total;
                    }
                });

                return this.mayBeHandleDiscount(total);
            },

            subscriptionHumanText(plan) {
                if (parseInt(plan.bill_times)) {
                    return this.$t('Customer will be billed ' + plan.bill_times + ' times in total');
                } else {
                    return this.$t('Customer will be billed until cancelled');
                }
            },

            getDiscountsTotal(amount) {
                let discounted = '-';

                if (this.discounts.percent) {
                    discounted = amount * (this.discounts.percent / 100);
                }

                return this.formatMoney(discounted);
            }
        }
    }
</script>

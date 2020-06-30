<template>
    <div v-if="order_data.order_items.length" class="ff-payment_details">
        <div class="entry_info_box entry_submission_order_data">
            <div class="entry_info_header">
                <div class="info_box_header">
                    Order Details
                </div>
            </div>
            <div class="entry_info_body">
                <div class="wpff_order_items_wrapper">
                    <table class="ff-table ff-payment-table">
                        <thead>
                        <tr>
                            <th>Product</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Price</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="orderItem in order_data.order_items" :key="orderItem.id">
                            <td>{{orderItem.item_name}}</td>
                            <td>{{orderItem.quantity}}</td>
                            <td><span v-html="formatMoney(orderItem.item_price, submission.currency)"></span></td>
                            <td><span v-html="formatMoney(orderItem.line_total, submission.currency)"></span></td>
                        </tr>
                        </tbody>
                        <tfoot>
                        <tr>
                            <th colspan="3" class="text-right">Total</th>
                            <th><span v-html="formatMoney(order_data.order_items_total, submission.currency)"></span></th>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>

        <div class="entry_info_box entry_submission_order_data">
            <div class="entry_info_header">
                <div class="info_box_header">
                    Payment Details
                </div>
            </div>
            <div class="entry_info_body">
                <div v-for="(transaction,index) in order_data.transactions"
                     class="wpf_entry_transaction">
                    <h4 v-show="order_data.transactions.length > 1">Transaction #{{ index+1 }}</h4>
                    <ul class="ff_list_items">
                        <li>
                            <div class="ff_list_header">ID</div>
                            <div class="ff_list_value">{{ transaction.id }}</div>
                        </li>
                        <li v-if="transaction.payer_name">
                            <div class="ff_list_header">Billing Name</div>
                            <div class="ff_list_value">{{ transaction.payer_name }}</div>
                        </li>
                        <li v-if="transaction.payer_email">
                            <div class="ff_list_header">Billing Email</div>
                            <div class="ff_list_value">{{ transaction.payer_email }}</div>
                        </li>
                        <li v-if="transaction.billing_address">
                            <div class="ff_list_header">Billing Address</div>
                            <div class="ff_list_value">{{ transaction.billing_address }}</div>
                        </li>
                        <li v-if="transaction.shipping_address">
                            <div class="ff_list_header">Shipping Address</div>
                            <div class="ff_list_value">{{ transaction.shipping_address }}</div>
                        </li>
                        <li>
                            <div class="ff_list_header">Payment Method</div>
                            <div class="ff_list_value">
                                <span class="ff_card_badge" v-if="transaction.payment_method">{{ transaction.payment_method }}</span>
                                <span v-else>n/a</span>
                            </div>
                        </li>
                        <li v-if="transaction.charge_id">
                            <div class="ff_list_header">Transaction ID</div>
                            <div class="ff_list_value">

                                <a v-if="transaction.action_url" target="_blank"
                                   :href="transaction.action_url">
                                    {{ transaction.charge_id}}
                                </a>
                                <span v-else>{{ transaction.charge_id }}</span>

                            </div>
                        </li>
                        <li v-show="transaction.card_last_4">
                            <div class="ff_list_header">Card Last 4</div>
                            <div class="ff_list_value"><span
                                    class="ff_card_badge">{{ transaction.card_brand }}</span> <i
                                    class="el-icon-more"></i> {{ transaction.card_last_4 }}
                            </div>
                        </li>
                        <li>
                            <div class="ff_list_header">Payment Total</div>
                            <div class="ff_list_value" v-html="formatMoney(transaction.payment_total, transaction.currency)"></div>
                        </li>
                        <li>
                            <div class="ff_list_header">Payment Status</div>
                            <div class="ff_list_value">{{ transaction.status }}</div>
                        </li>
                        <li>
                            <div class="ff_list_header">Date</div>
                            <div class="ff_list_value">{{ transaction.created_at }}</div>
                        </li>
                        <li v-if="transaction.additional_note && typeof transaction.additional_note == 'string'">
                            <div v-html="transaction.additional_note" class="ff_list_value"></div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div v-if="order_data.refunds.length" class="entry_info_box entry_submission_order_data">
            <div class="entry_info_header">
                <div class="info_box_header">
                    Refunds
                </div>
            </div>
            <div class="entry_info_body">
                <div v-for="(transaction,index) in order_data.refunds"
                     class="wpf_entry_transaction">
                    <div class="transaction_item_small">
                        <div class="transaction_item_heading">
                            <div class="transaction_heading_title">Refund #{{ index+1 }}</div>
                            <div class="transaction_heading_action">
                                <a class="el-button el-button--danger el-button--mini" v-if="transaction.action_url" target="_blank"
                                   :href="transaction.action_url">
                                    View
                                </a>
                            </div>
                        </div>
                        <div class="transaction_item_body">
                            <div class="transaction_item_line">
                                <span class="ff_list_value" v-html="formatMoney(transaction.payment_total, transaction.currency)"></span> has been refunded via
                                <span class="ff_card_badge" v-if="transaction.payment_method">{{ transaction.payment_method }}</span> at
                                {{ transaction.created_at }}
                            </div>
                            <p v-if="transaction.payment_note && typeof transaction.payment_note == 'string'">Note: {{transaction.payment_note}}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script type="text/babel">
    export default {
        name: 'PaymentSummary',
        props: ['order_data', 'submission'],
        data() {
            return {}
        },
        methods: {
            getFormattedMoney(amount) {
                return amount;
                if (!amount) {
                    return 'n/a';
                }
               // return fromatPrice(amount, this.submission.currencySetting);
            },
        }
    }
</script>

<style lang="scss">
    .transaction_item_small {
        margin: 0px -20px 20px;
        padding: 10px 20px;
        background: whitesmoke;
    }

    .transaction_item_heading {
        display: block;
        border-bottom: 1px solid gray;
        margin: 0 -20px 20px;
        padding: 10px 20px;
    }

    .transaction_heading_title {
        display: inline-block;
        font-size: 16px;
        font-weight: 500;
    }

    .transaction_heading_action {
        float: right;
        margin-top: -10px;
    }

    .transaction_item_line {
        padding: 0px;
        font-size: 15px;
        margin-bottom: 10px;
    }

    .transaction_item_line .ff_list_value {
        background: #ffff44;
        padding: 2px 6px;
    }
</style>

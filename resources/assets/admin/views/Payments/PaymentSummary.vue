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
                <div class="info_box_header_actions">
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
                            <div class="ff_list_value">
                                <span class="ff_card_badge" :class="'ff_badge_status_'+transaction.status">{{ transaction.status }}</span>
                            </div>
                        </li>
                        <li>
                            <div class="ff_list_header">Date</div>
                            <div class="ff_list_value">{{ transaction.created_at }}</div>
                        </li>
                        <li v-if="transaction.additional_note && typeof transaction.additional_note == 'string'">
                            <div v-html="transaction.additional_note" class="ff_list_value"></div>
                        </li>
                    </ul>
                    <el-button @click="initTransactionEditor(transaction)" size="small" type="primary">Edit Transaction</el-button>
                </div>
            </div>
        </div>

        <div v-if="order_data.refunds && order_data.refunds.length" class="entry_info_box entry_submission_order_data">
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

        <el-dialog
            v-loading="editing"
            title="Edit Transaction"
            :visible.sync="transactionModal"
            width="60%">
            <el-form label-position="left" v-if="editingTransaction" :data="editingTransaction">
                <el-form-item label="Billing Name">
                    <el-input placeholder="Billing Name" v-model="editingTransaction.payer_name"/>
                </el-form-item>
                <el-form-item label="Billing Email">
                    <el-input type="email" placeholder="Billing Email" v-model="editingTransaction.payer_email"/>
                </el-form-item>
                <el-form-item label="Billing Address">
                    <el-input type="textarea" placeholder="Billing Address" v-model="editingTransaction.billing_address"/>
                </el-form-item>
                <el-form-item label="Shipping Address">
                    <el-input type="textarea" placeholder="Shipping Address" v-model="editingTransaction.shipping_address"/>
                </el-form-item>
                <el-form-item label="Reference ID">
                    <el-input type="text" placeholder="Reference ID" v-model="editingTransaction.charge_id"/>
                </el-form-item>
                <el-form-item v-if="editingTransaction.payment_method == 'test'" label="Note">
                    <el-input type="textarea" placeholder="Reference ID" v-model="editingTransaction.payment_note"/>
                </el-form-item>
                <el-form-item label="Status">
                    <el-radio-group v-model="editingTransaction.status">
                        <el-radio
                            v-for="(paymentStatus, status_key) in payment_statuses"
                            :key="status_key"
                            :label="status_key"
                        >{{paymentStatus}}</el-radio>
                    </el-radio-group>
                    <p v-if="(editingTransaction.status == 'refunded' || editingTransaction.status == 'partial-refunded') && original_editing_status != editingTransaction.status">
                        Please note that, Actual Refund needs to be handled in your Payment Service Provider.
                    </p>
                </el-form-item>
                <template v-if="editingTransaction.status == 'partially-refunded'">
                    <el-form-item label="New Refund Amount">
                        <el-input type="number" step="any" v-model="editingTransaction.refund_amount"></el-input>
                        <p>Please Provide new refund amount only.</p>
                    </el-form-item>
                    <el-form-item label="Refund Note">
                        <el-input type="textarea" v-model="editingTransaction.refund_note"></el-input>
                    </el-form-item>
                </template>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="transactionModal = false">Cancel</el-button>
                <el-button type="primary" @click="updateTransaction()">Confirm</el-button>
            </span>
        </el-dialog>

    </div>
</template>
<script type="text/babel">
    export default {
        name: 'PaymentSummary',
        props: ['order_data', 'submission'],
        data() {
            return {
                editingTransaction: false,
                transactionModal: false,
                payment_statuses: window.fluent_form_entries_vars.payment_statuses,
                editing: false,
                original_editing_status: ''
            }
        },
        methods: {
            getFormattedMoney(amount) {
                return amount;
                if (!amount) {
                    return 'n/a';
                }
            },
            initTransactionEditor(transaction) {
                this.editingTransaction = transaction;
                this.original_editing_status = JSON.parse(JSON.stringify(transaction.status));
                this.transactionModal = true;
            },
            updateTransaction() {
                this.editing = true;
                jQuery.post(window.ajaxurl, {
                    action: 'handle_payment_ajax_endpoint',
                    form_id: this.editingTransaction.form_id,
                    transaction: this.editingTransaction,
                    route: 'update_transaction'
                })
                .then(response => {
                    this.$notify.success(response.data.message);
                    this.$emit('reload_payments');
                    this.transactionModal = false;
                    this.editingTransaction = false;
                    this.original_editing_status = '';
                })
                .fail((errors) => {
                    console.log(errors);
                })
                .always(() => {
                    this.editing = false;
                });
            }
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

    .ff_badge_status_ {
        &pending {
            background-color: #ffff03;
        }
        &paid {
            background: #67c23a;
            color: white;
        }
    }
</style>

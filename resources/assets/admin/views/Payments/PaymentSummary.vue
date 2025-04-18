<template>
    <div v-if="order_data" class="ff-payment_details">
        <card  v-if="order_data.order_items.length">
            <card-head>
                <h6>
                    {{$t('Order Details')}}
                </h6>
            </card-head>
            <card-body>
                <div class="wpff_order_items_wrapper">
                    <table class="ff-table ff-payment-table">
                        <thead>
                        <tr>
                            <th>{{ $t('Product') }}</th>
                            <th>{{ $t('Qty') }}</th>
                            <th>{{ $t('Unit Price') }}</th>
                            <th>{{ $t('Price') }}</th>
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
                        <template v-if="order_data.discount_items && order_data.discount_items.length">
                            <tr>
                                <th colspan="3" class="text-right">{{$t('Sub-Total')}}</th>
                                <th><span v-html="formatMoney(order_data.order_items_subtotal, submission.currency)"></span></th>
                            </tr>
                            <tr v-for="(discount, index) in order_data.discount_items" :key="index">
                                <th colspan="3" class="text-right">{{$t('Discount: %s', discount.item_name)}}</th>
                                <th>-<span v-html="formatMoney(discount.line_total, submission.currency)"></span></th>
                            </tr>
                        </template>
                        <tr>
                            <th colspan="3" class="text-right">{{$t('Total')}}</th>
                            <th><span v-html="formatMoney(order_data.order_items_total, submission.currency)"></span></th>
                        </tr>
                        </tfoot>
                    </table>
                </div>
            </card-body>
        </card>

        <subscriptions
            :discounts="{}"
            @reload_payments="emitReload()"
            :subscriptions="order_data.subscriptions"
            :payment_method="submission.payment_method"
            v-if="order_data.subscriptions && order_data.subscriptions.length"
        />

        <card v-if="parseFloat(submission.total_paid) || (order_data.transactions && order_data.transactions.length)"
        >
            <card-head>
                <h6>{{$t('Payment Details')}}</h6>
            </card-head>
            <card-body class="entry_info_body ff_payment_detail_data">
                <div class="ff_payment_detail_data_payment">
                    <template v-if="parseFloat(submission.payment_total)">
                        <span class="pay_amount" v-html="formatMoney(submission.payment_total)"/>

                        <span class="payment_currency">
                            {{ submission.currency }}
                        </span>

                        <span :class="'ff_badge ff_badge_' + submission.payment_status">
                            <i :class="getPaymentStatusIcon(submission.payment_status)"/>
                            {{ payment_statuses[submission.payment_status] || submission.payment_status }}
                        </span>
                    </template>

                    <template v-if="order_data.subscription_payment_total">
                        <span>
                            <template v-if="parseFloat(submission.payment_total)">
                                &
                            </template>

                            <span
                                    class="pay_amount"
                                    v-html="formatMoney(order_data.subscription_payment_total)"
                            />
                            ({{ $t('From Subscriptions') }})
                        </span>
                    </template>
                </div>

                <div v-for="(transaction, index) in order_data.transactions" class="wpf_entry_transaction" :key="index">
                    <h4 v-show="order_data.transactions.length > 1">{{$t('Transaction #%s', index+1)}}</h4>
                    <ul class="ff_list_items mb-3">
                        <li>
                            <div class="ff_list_header">{{$t('ID')}}</div>
                            <div class="ff_list_value">{{ transaction.id }}</div>
                        </li>
                        <li v-if="transaction.payer_name">
                            <div class="ff_list_header">{{$t('Billing Name')}}</div>
                            <div class="ff_list_value">{{ transaction.payer_name }}</div>
                        </li>
                        <li v-if="transaction.payer_email">
                            <div class="ff_list_header">{{$t('Billing Email')}}</div>
                            <div class="ff_list_value">{{ transaction.payer_email }}</div>
                        </li>
                        <li v-if="transaction.billing_address">
                            <div class="ff_list_header">{{$t('Billing Address')}}</div>
                            <div class="ff_list_value">{{ transaction.billing_address }}</div>
                        </li>
                        <li v-if="transaction.shipping_address">
                            <div class="ff_list_header">{{$t('Shipping Address')}}</div>
                            <div class="ff_list_value">{{ transaction.shipping_address }}</div>
                        </li>
                        <li>
                            <div class="ff_list_header">{{$t('Payment Method')}}</div>
                            <div class="ff_list_value">
                                <span class="ff_badge ff_badge_primary" v-if="transaction.payment_method">{{ transaction.payment_method }}</span>
                                <span v-else>n/a</span>
                            </div>
                        </li>
                        <li v-if="transaction.charge_id">
                            <div class="ff_list_header">{{$t('Transaction ID')}}</div>
                            <div class="ff_list_value">

                                <a v-if="transaction.action_url" target="_blank"
                                   :href="transaction.action_url">
                                    {{ transaction.charge_id }}
                                </a>
                                <span v-else>{{ transaction.charge_id }}</span>

                            </div>
                        </li>
                        <li v-show="transaction.card_last_4">
                            <div class="ff_list_header">{{$t('Card Last 4')}}</div>
                            <div class="ff_list_value"><span
                                    class="ff_badge ff_badge_primary">{{ transaction.card_brand }}</span> <i
                                    class="el-icon-more"></i> {{ transaction.card_last_4 }}
                            </div>
                        </li>
                        <li>
                            <div class="ff_list_header">{{$t('Payment Total')}}</div>
                            <div class="ff_list_value" v-html="formatMoney(transaction.payment_total, transaction.currency)"></div>
                        </li>
                        <li v-show="transaction.status">
                            <div class="ff_list_header">{{$t('Payment Status')}}</div>
                            <div class="ff_list_value">
                                <span class="ff_badge is-solid" :class="'ff_badge_'+transaction.status">{{ payment_statuses[transaction.status] || transaction.status }}</span>
                            </div>
                        </li>
                        <li>
                            <div class="ff_list_header">{{$t('Date')}}</div>
                            <div class="ff_list_value">{{ transaction.created_at }}</div>
                        </li>
                        <li v-if="transaction.additional_note && typeof transaction.additional_note == 'string'">
                            <div v-html="transaction.additional_note" class="ff_list_value"></div>
                        </li>
                    </ul>
                    
                    <el-button
                        v-if="hasPermission('fluentform_manage_entries')"
                        @click="initTransactionEditor(transaction)"
                        size="small" 
                        type="primary"
                    >
                        {{$t('Edit Transaction')}}
                    </el-button>
                </div>
            </card-body>
        </card>

        <card v-if="order_data.refunds && order_data.refunds.length">
            <card-head>
                <h6>{{$t('Refunds')}}</h6>
            </card-head>
            <card-body class="entry_info_body">
                <div v-for="(transaction, index) in order_data.refunds" class="wpf_entry_transaction" :key="index">
                    <div class="transaction_item_small">
                        <div class="transaction_item_heading">
                            <div class="transaction_heading_title">{{$t('Refund #%s', index+1)}}</div>
                            <div class="transaction_heading_action">
                                <a class="el-button el-button--danger el-button--mini" v-if="transaction.action_url" target="_blank"
                                   :href="transaction.action_url">
                                    {{$t('View')}}
                                </a>
                            </div>
                        </div>
                        <div class="transaction_item_body">
                            <div class="transaction_item_line">
                                <p
                                    v-html="$t(
                                        '%s has been refunded via %s at %s',
                                        `<span class='ff_badge is-solid small ff_badge_paid'>
                                            ${formatMoney(transaction.payment_total, transaction.currency)}
                                        </span>`,
                                        transaction.payment_method
                                        ? `<span class='ff_badge small ff_badge_primary'>
                                            ${transaction.payment_method}
                                        </span>`
                                        : '',
                                        transaction.created_at
                                    )"
                                >
                                </p>
                            </div>
                            <p v-if="transaction.payment_note && typeof transaction.payment_note == 'string'">
                                {{ $t('Note: %s', transaction.payment_note) }}
                            </p>
                        </div>
                    </div>
                </div>
            </card-body>
        </card>

        <el-dialog
            v-loading="editing"
            :visible.sync="transactionModal"
            width="60%"
        >
            <template slot="title">
                <h4>{{$t('Edit Transaction')}}</h4>
            </template>

            <el-form class="mt-4" label-position="top" v-if="editingTransaction" :data="editingTransaction">
                <el-form-item class="ff-form-item" :label="$t('Billing Name')">
                    <el-input :placeholder="$t('Billing Name')" v-model="editingTransaction.payer_name"/>
                </el-form-item>
                <el-form-item class="ff-form-item" :label="$t('Billing Email')">
                    <el-input type="email" :placeholder="$t('Billing Email')" v-model="editingTransaction.payer_email"/>
                </el-form-item>
                <el-form-item class="ff-form-item" :label="$t('Billing Address')">
                    <el-input type="textarea" :placeholder="$t('Billing Address')" v-model="editingTransaction.billing_address"/>
                </el-form-item>
                <el-form-item class="ff-form-item" :label="$t('Shipping Address')">
                    <el-input type="textarea" :placeholder="$t('Shipping Address')" v-model="editingTransaction.shipping_address"/>
                </el-form-item>
                <el-form-item class="ff-form-item" :label="$t('Reference ID')">
                    <el-input type="text" :placeholder="$t('Reference ID')" v-model="editingTransaction.charge_id"/>
                </el-form-item>
                <el-form-item class="ff-form-item" v-if="editingTransaction.payment_method == 'test'" :label="$t('Note')">
                    <el-input type="textarea" :placeholder="$t('Reference ID')" v-model="editingTransaction.payment_note"/>
                </el-form-item>
                <el-form-item class="ff-form-item" :label="$t('Status')">
                    <el-radio-group v-model="editingTransaction.status">
                        <el-radio
                            v-for="(paymentStatus, status_key) in payment_statuses"
                            :key="status_key"
                            :label="status_key"
                        >{{paymentStatus}}</el-radio>
                    </el-radio-group>
                    <p class="text-note mt-2" v-if="(editingTransaction.status == 'refunded' || editingTransaction.status == 'partial-refunded') && original_editing_status != editingTransaction.status">
                        $t{{'refunds-to-be-handled-from-provider-text'}}
                    </p>
                </el-form-item>
                <template v-if="editingTransaction.status == 'partially-refunded'">
                    <el-form-item class="ff-form-item" :label="$t('New Refund Amount')">
                        <el-input type="number" step="any" v-model="editingTransaction.refund_amount"></el-input>
                        <p class="text-note mt-1">{{$t('Please Provide new refund amount only.')}}</p>
                    </el-form-item>
                    <el-form-item class="ff-form-item" :label="$t('Refund Note')">
                        <el-input type="textarea" v-model="editingTransaction.refund_note"></el-input>
                    </el-form-item>
                </template>
                <el-form-item class="ff-form-item" :label="$t('Run Actions')" v-if="editingTransaction.status === 'paid'">
                    <el-checkbox true-label="yes" false-label="no" v-model="editingTransaction.should_run_actions">
                        {{ $t('Do you want to run all the integrations and email notifications?') }}
                    </el-checkbox>
                </el-form-item>
            </el-form>
            <span slot="footer" class="dialog-footer">
                <el-button @click="transactionModal = false" type="info" class="el-button--soft">{{$t('Cancel')}}</el-button>
                <el-button type="primary" @click="updateTransaction()">{{$t('Confirm')}}</el-button>
            </span>
        </el-dialog>

    </div>
</template>
<script type="text/babel">
    import Subscriptions from "./Subscriptions";
    import Card from '@/admin/components/Card/Card.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';

    export default {
        name: 'PaymentSummary',
        props: ['order_data', 'submission'],
        components: {
            Subscriptions, Card, CardHead, CardBody
        },
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
            },
            initTransactionEditor(transaction) {
                this.editingTransaction = transaction;
                this.$set(this.editingTransaction, 'should_run_actions', 'no');
                this.original_editing_status = JSON.parse(JSON.stringify(transaction.status));
                this.transactionModal = true;
            },
            updateTransaction() {
                this.editing = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    form_id: this.editingTransaction.form_id,
                    transaction: this.editingTransaction,
                    subscription_id: this.order_data.subscriptions.length && this.order_data.subscriptions[0].id,
                    route: 'update_transaction'
                })
                .then(response => {
                    this.original_editing_status = '';
                    this.editing = false;
                    this.editingTransaction = false;
                    this.transactionModal = false;
                    this.$success(response.data.message);
                    this.$emit('reload_payments');
                })
                .fail((errors) => {
                    console.log(errors);
                })
                .always(() => {
                    this.editing = false;
                    this.transactionModal = false;
                });
            },
            emitReload() {
                this.$emit('reload_payments');
            }
        }
    }
</script>

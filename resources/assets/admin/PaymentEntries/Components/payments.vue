<template>
    <div class="payments_wrapper">
        <div class="ff_section_head ff_section_head_between mb-0">
            <div class="ff_section_head_content">
                <h1 class="ff_section_title">{{$t('Transactions')}}</h1>
            </div>
            <div class="ff_section_head_content">
                <div v-if="hasPermission('fluentform_manage_payments')" class="payment_actions">
                    <ul class="ff_btn_group">
                        <li v-if="entrySelections.length">
                            <label for="bulk-action-selector-top" class="screen-reader-text">
                                {{$t('Select bulk action')}}
                            </label>
                            <el-select
                                class="mr-2 ff-input-s1"
                                clearable
                                :placeholder="$t('Bulk Actions')"
                                id="bulk-action-selector-top"
                                v-model="bulkAction"
                            >
                                <el-option
                                    key="delete"
                                    :label="$t('Delete Permanently')"
                                    value="delete_items">
                                </el-option>
                            </el-select>
                            <el-button
                                type="primary"
                                @click.prevent="handleBulkAction"
                            >
                                {{$t('Apply')}}
                            </el-button>
                        </li>
                        <li>
                            <a :href="settings_url" class="el-button el-button--primary">
                                <i class="ff-icon ff-icon-setting"></i>
                                <span>{{$t('Payment Settings')}}</span>
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div><!-- ff_section_head -->

        <div class="ff_filter_wrapper payment_filters">
            <div class="el-row" style="margin-left: -10px; margin-right: -10px;">
                <div class="el-col-8 el-col-lg-5" style="padding-left: 10px; padding-right: 10px;">
                    <div class="ff_form_group">
                        <label class="ff_form_group_label">{{$t('Form')}}</label>
                        <el-select class="ff-input-s1" @change="fetchPayments()" clearable v-model="selectedFormId" :placeholder="$t('Select Form')">
                            <el-option
                                v-for="item in available_forms"
                                :key="item.form_id"
                                :label="item.title"
                                :value="item.form_id">
                            </el-option>
                        </el-select>
                    </div>
                </div>
                <div class="el-col-8 el-col-lg-5" style="padding-left: 10px; padding-right: 10px;">
                    <div class="ff_form_group">
                        <label class="ff_form_group_label">{{$t('Status')}}</label>
                        <el-select class="ff-input-s1" @change="fetchPayments()" clearable v-model="selectedPaymentStatuses" :placeholder="$t('Select Status')">
                            <el-option
                                v-for="item in available_statuses"
                                :key="item"
                                :label="item"
                                :value="item">
                            </el-option>
                        </el-select>
                    </div>
                </div>
                <div class="el-col-8 el-col-lg-5" style="padding-left: 10px; padding-right: 10px;">
                    <div class="ff_form_group">
                        <label class="ff_form_group_label">{{$t('Payment Methods')}}</label>
                        <el-select class="ff-input-s1" @change="fetchPayments()" clearable v-model="selectedPaymentMethods" :placeholder="$t('Select Method')">
                            <el-option
                                v-for="item in available_methods"
                                :key="item.key"
                                :label="$t(item.value)"
                                :value="item.key">
                            </el-option>
                        </el-select>
                    </div>
                </div>
                <div class="el-col-8 el-col-lg-5" style="padding-left: 10px; padding-right: 10px;">
                    <div class="ff_form_group">
                        <label class="ff_form_group_label">{{$t('Payment Types')}}</label>
                        <el-select class="ff-input-s1" @change="fetchPayments()" clearable v-model="selectedPaymentTypes" :placeholder="$t('Select Type')">
                            <el-option
                                v-for="item in available_payment_types"
                                :key="item.key"
                                :label="$t(item.value)"
                                :value="item.key">
                            </el-option>
                        </el-select>
                    </div>
                </div>
            </div>
        </div><!-- ff_filter_wrapper -->

        <div class="payment_details">
            <div class="ff_table">
                <el-skeleton :loading="loading" animated :rows="10">
                    <el-table class="ff_payment_table" :stripe="true" :row-class-name="tableRowClassName"
                        :data="payments"  @selection-change="handleSelectionChange"
                    >
                    <el-table-column
                        v-if="hasPermission('fluentform_manage_payments')"
                        type="selection"
                        fixed
                        width="40">
                    </el-table-column>
                    <el-table-column width="120" :label="$t('Submission ID')">
                        <template slot-scope="scope">
                            <a class="payment_sub_url" :href="scope.row.entry_url">{{scope.row.submission_id}}</a>
                        </template>
                    </el-table-column>
                    <el-table-column width="200" :label="$t('Form')" prop="title"></el-table-column>

                    <el-table-column width="100" :label="$t('Type')">
                        <template slot-scope="scope">
                            <span v-if="scope.row.transaction_type == 'refund'">{{$t('Refund')}}</span>
                            <span v-else-if="scope.row.transaction_type == 'onetime'">{{$t('Charge')}}</span>
                            <span v-else>{{scope.row.transaction_type|ucFirst}}</span>
                        </template>
                    </el-table-column>
                    <el-table-column :label="$t('Customer')" prop="payer_name"></el-table-column>

                    <el-table-column width="160" :label="$t('Amount')">
                        <template slot-scope="scope">
                            <span v-if="scope.row.transaction_type == 'refund'">
                                -<span v-html="scope.row.formatted_payment_total"></span>
                            </span>
                            <span v-else v-html="scope.row.formatted_payment_total"></span>
                        </template>
                    </el-table-column>
                    <el-table-column width="180" :label="$t('Source')">
                        <template slot-scope="scope">
                            <div class="ff_badge_wrap">
                                <span class="ff_badge" :class="'ff_badge_' + scope.row.payment_method">
                                    <img :src="scope.row.payment_method == 'offline' ? payment_icon.offline :
                                    scope.row.payment_method == 'stripe' ? payment_icon.stripe :
                                    scope.row.payment_method == 'mollie' ? payment_icon.mollie :
                                    scope.row.payment_method == 'paypal' ? payment_icon.paypal : payment_icon.offline" alt="">
                                    {{scope.row.payment_method}}
                                </span>
                                <span v-if="scope.row.card_brand" :class="'ff_brand ff_brand_' + scope.row.card_brand">
                                    <img :src="scope.row.card_brand == 'visa' ? cardBrand.visa :
                                    scope.row.card_brand == 'amex' ? cardBrand.amex :
                                    scope.row.card_brand == 'paypal' ? cardBrand.paypal :
                                    scope.row.card_brand == 'master-card' ? cardBrand.mastercard :
                                    ''" alt="">
                                </span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column width="120" :label="$t('Status')">
                        <template slot-scope="scope">
                            <span :class="`ff_badge ff_badge_${scope.row.status == 'pending' ? 'pending' :
                            scope.row.status == 'refunded' ? 'refund' :
                            scope.row.status == 'paid' ? 'paid' :
                            scope.row.status == 'failed' ? 'failed' :
                            scope.row.status == 'processing' ? 'processing' :
                            scope.row.status == 'cancelled' ? 'cancelled' :
                            'status-default'}`">
                                {{$t(scope.row.status)|ucFirst}}
                            </span>
                        </template>
                    </el-table-column>

                    <el-table-column :width="dateColWidth" :label="$t('Time')" prop="created_at">
                        <template slot-scope="scope">
                            <el-tooltip class="item" placement="bottom" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    {{ tooltipDateTime(scope.row.created_at) || scope.row.created_at }}
                                </div>
                                <span>
                                    {{  humanDiffTime(scope.row.created_at) || scope.row.created_at }}
                                </span>
                            </el-tooltip>
                        </template>
                    </el-table-column>

                    </el-table>
                 </el-skeleton>
            </div><!-- .ff_table -->
            <div class="ff_pagination_wrap text-right mt-4">
                <el-pagination
                    class="ff_pagination"
                    background
                    @size-change="handleSizeChange"
                    @current-change="goToPage"
                    hide-on-single-page
                    :current-page.sync="paginate.current_page"
                    :page-sizes="[5, 10, 20, 50, 100]"
                    :page-size="parseInt(paginate.per_page)"
                    layout="total, sizes, prev, pager, next, jumper"
                    :total="paginate.total">
                </el-pagination>
            </div>

        </div>
    </div>
</template>

<script type="text/babel">
import { scrollTop } from '../../helpers'
import moment from 'moment';

    export default {
        name: 'payments',
        props: ['settings_url'],
        data() {
            return {
                payments: [],
                loading: false,
                selectedFormId: '',
                selectedPaymentMethods: [],
                selectedPaymentStatuses: [],
                selectedPaymentTypes: [],
                entrySelections:[],
                bulkAction:[],
                actionType:'',
                available_statuses:'',
                available_forms:'',
                available_methods:'',
                available_payment_types:'',
                paginate: {
                    total: 0,
                    current_page: 1,
                    last_page: 1,
                    per_page: localStorage.getItem('paymentEntriesPerPage') || 10
                },
                payment_icon:  window.fluent_forms_global_var.payment_icons,
                cardBrand:  window.fluent_forms_global_var.card_brands
            }
        },
        methods: {
            fetchPayments(withReports) {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_payments',
                    form_id: this.selectedFormId,
                    payment_methods: this.selectedPaymentMethods,
                    payment_statuses: this.selectedPaymentStatuses,
                    payment_types: this.selectedPaymentTypes,
                    with_report: withReports,
                    page: this.paginate.current_page,
                    per_page: this.paginate.per_page
                })
                    .then(response => {
                        this.payments = response.data.payments;
                        this.setPaginate(response.data);
                    })
                    .always(() => {
                        this.loading = false;
                    })
            },
	        submittedAt(date) {
		        return moment(date).format('MMM DD, YYYY');
	        },
            tableRowClassName({row}) {
                if(row.transaction_type == 'refund') {
                    return 'warning-row';
                } else if(row.status == 'pending') {
                    return 'pending-row';
                }
            },
            setPaginate(data = {}) {
                this.paginate = {
                    total: data.total || 0,
                    current_page: data.current_page || 1,
                    last_page: data.last_page || 1,
                    per_page: data.per_page || localStorage.getItem('paymentEntriesPerPage') || 10,
                }
            },
            goToPage(value) {
                scrollTop().then(elements => {
                    this.paginate.current_page = value
                    this.fetchPayments();
                });
            },
            handleSizeChange(val) {
                scrollTop().then(_ => {
                    this.paginate.per_page = val;
                    localStorage.setItem('paymentEntriesPerPage', val);
                    this.fetchPayments();
                })
            },
            handleSelectionChange(val){
                this.entrySelections = val;
            },
            handleBulkAction() {
                if (this.bulkAction) {
                    let actionType = this.bulkAction;
                    this.operationOnSelectedEntries(actionType);
                }
            },
            operationOnSelectedEntries(actionType) {
                let selectedEntries = [];

                this.entrySelections.forEach(function (element) {
                    selectedEntries.push(element.id);
                });

                let data = {
                    action: 'fluentform-do_entry_bulk_actions_payment',
                    entries: selectedEntries,
                    action_type: actionType
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.$notify.success({
                                                 title: 'Success',
                                                 message: response.data.message,
                                                 offset: 30
                                         });

                    })
                    .fail(error => {
                        this.$notify.error({
                                               title: 'Error',
                                               message: error.responseJSON.data.message,
                                               offset: 30
                                       });

                        console.log(error);
                    }).always(()=>{
                        this.fetchPayments();
                    });

            },
            getAvailableFilters() {
              FluentFormsGlobal.$get({
                action: "fluentform_get_all_payments_entries_filters"
              })
                .then(response => {
                  this.available_statuses = response.data.available_statuses;
                  this.available_forms = response.data.available_forms;
                  this.available_methods = response.data.available_methods;
                  this.available_payment_types = response.data.available_payment_types;
                })
                .fail(error => {
                  console.log(error);
                });
            },
        },
	    computed:{
		    dateColWidth(){
			    return window.fluent_forms_global_var.disable_time_diff ? '190' : '80';
		    }
	    },
        filters: {
            ucFirst: function(value) {
                if (!value) return ''
                value = value.toString()
                return value.charAt(0).toUpperCase() + value.slice(1)
            }
        },
        mounted() {
            this.fetchPayments(true);
            this.getAvailableFilters();
        }
    };
</script>


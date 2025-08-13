<template>
    <div class="ff_method_settings">
        <el-skeleton :loading="loading" animated :rows="10">
            <div class="ff_pre_settings_wrapper" v-if="!coupon_status">
                <h2 class="mb-3">
                    {{ $t('Fluent Forms Coupon Module') }}
                </h2>
                <p>
                    {{ $t('Enable your users to apply coupon/discount code while purchasing something using Fluent Forms Payment Module. Just activate this module and setup your coupons.') }}
                </p>
                <el-button @click="enableCouponModule()" type="primary" icon="el-icon-success">
                    {{ $t('Enable Coupon Module') }}
                </el-button>
            </div>
            <div v-else>
                <card-head>
                    <card-head-group class="justify-between">
                        <h5 class="title">{{ $t('Available Coupons') }}</h5>
                        <el-button @click="showAddCoupon()" type="info" size="medium" icon="ff-icon ff-icon-plus">
                            {{ $t('Add New Coupon') }}
                        </el-button>
                    </card-head-group>
                </card-head>
                <el-table :data="coupons" class="ff_table_s2">
                    <el-table-column width="100" :label="$t('ID')" prop="id" />
                    <el-table-column :label="$t('Title')" prop="title" />
                    <el-table-column :label="$t('Code')" prop="code" />
                    <el-table-column width="140" :label="$t('Amount')">
                        <template slot-scope="scope">
                            {{scope.row.amount}}<span v-if="scope.row.coupon_type == 'percent'">%</span>
                        </template>
                    </el-table-column>
                    <el-table-column width="90" :label="$t('Actions')">
                        <template slot-scope="scope">
                            <el-button
                                class="el-button--icon"
                                size="mini"
                                type="info"
                                icon="ff-icon-edit"
                                @click="editCoupon(scope.row)"
                            />
                            <confirm @on-confirm="deleteCoupon(scope.row)">
                                <el-button
                                    class="el-button--icon"
                                    size="mini"
                                    type="danger"
                                    icon="ff-icon-trash"
                                />
                            </confirm>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="ff_pagination_wrap text-right mt-4">
                    <pagination :pagination="pagination" storePerPageAs="couponsPerPage" @fetch="getCoupons" />
                </div>
            </div>

            <el-dialog
                top="40px"
                :visible.sync="show_modal"
                :append-to-body="true"
                width="60%"
            >
                <template slot="title">
                    <h4>{{(editing_coupon.id) ? $t('Edit Coupon') : $t('Add a New Coupon')}}</h4>
                </template>
                <div v-if="show_modal" class="ff_coupon_form mt-4">
                    <el-form :data="editing_coupon" label-position="top">
                        <el-form-item class="ff-form-item" :label="$t('Coupon Title')">
                            <el-input type="text" v-model="editing_coupon.title" :placeholder="$t('Coupon Title')" />
                            <p class="mt-1 text-note">{{ $t('The name of this discount') }}</p>
                            <error-view field="title" :errors="errors" />
                        </el-form-item>
                        <el-form-item class="ff-form-item" :label="$t('Coupon Code')">
                            <el-input type="text" v-model="editing_coupon.code" :placeholder="$t('Coupon Code')" />
                            <p class="mt-1 text-note">{{ $t('Enter a code for this discount, such as 10PERCENT. Only alphanumeric characters are allowed.') }}</p>
                            <error-view field="code" :errors="errors" />
                        </el-form-item>
                        <el-row :gutter="30">
                            <el-col :span="12">
                                <el-form-item class="ff-form-item" :label="$t('Discount Amount / Percent')">
                                    <el-input :placeholder="$t('Discount Amount / Percent')" type="number" v-model="editing_coupon.amount" :min="0" />
                                    <p v-if="editing_coupon.coupon_type == 'percent'" class="mt-1 text-note">{{ $t('Enter the discount percentage. 10 = 10%') }}</p>
                                    <error-view field="amount" :errors="errors" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item class="ff-form-item" :label="$t('Discount Type')">
                                    <el-radio-group v-model="editing_coupon.coupon_type">
                                        <el-radio label="percent">{{ $t('Percent based discount') }}</el-radio>
                                        <el-radio label="fixed">{{ $t('Fixed Discount') }}</el-radio>
                                    </el-radio-group>
                                    <p class="mt-4 text-note">{{ $t('The kind of discount to apply for this discount.') }}</p>
                                    <error-view field="coupon_type" :errors="errors" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="30">
                            <el-col :span="12">
                                <el-form-item class="ff-form-item" :label="$t('Min Purchase Amount')">
                                    <el-input :placeholder="$t('Min Purchase Amount')" type="number" v-model="editing_coupon.min_amount" :min="0" />
                                    <p class="mt-1 text-note">{{ $t('The minimum amount that must be purchased before this discount can be used. Leave blank for no minimum.') }}</p>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item class="ff-form-item" :label="$t('Stackable')">
                                    <el-radio-group v-model="editing_coupon.stackable">
                                        <el-radio label="yes">{{ $t('Yes') }}</el-radio>
                                        <el-radio label="no">{{ $t('No') }}</el-radio>
                                    </el-radio-group>
                                    <p class="mt-4 text-note">{{ $t('Can this coupon code can be used with other coupon code') }}</p>
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="30">
                            <el-col :span="12">
                                <el-form-item class="ff-form-item" :label="$t('Start Date')">
                                    <el-date-picker class="w-100" value-format="yyyy-MM-dd" format="yyyy-MM-dd" :placeholder="$t('Start Date')" v-model="editing_coupon.start_date"  />
                                    <p class="mt-1 text-note">
                                        {{ $t('Enter the start date for this discount code in the format of yyyy-mm-dd. For no start date, leave blank.') }}
                                    </p>
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item class="ff-form-item" :label="$t('End Date')">
                                    <el-date-picker class="w-100" value-format="yyyy-MM-dd" format="yyyy-MM-dd" :placeholder="$t('End Date')" v-model="editing_coupon.expire_date" />
                                    <p class="mt-1 text-note">
                                        {{ $t('Enter the expiration date for this discount code in the format of yyyy-mm-dd. For no expiration, leave blank') }}
                                    </p>
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <el-form-item class="ff-form-item" :label="$t('Applicable Forms')">
                            <el-select placeholer="Select Forms" style="width: 100%;" multiple v-model="editing_coupon.settings.allowed_form_ids">
                                <el-option v-for="(formName, formId) in available_forms" :key="formId" :label="formName" :value="formId"></el-option>
                            </el-select>
                            <p class="mt-1 text-note">{{ $t('Leave blank for applicable for all payment forms') }}</p>
                        </el-form-item>

                        <el-form-item class="ff-form-item" :label="$t('Coupon Limit')">
                            <el-input :placeholder="$t('Coupon Limit')" type="number" v-model="editing_coupon.settings.coupon_limit" :min="0" />
                            <p class="mt-1 text-note">
                                {{ $t('Set the limit for how many times a logged-in user can apply this coupon. Keep this empty or put zero for no limit.') }}
                            </p>
                        </el-form-item>

                        <el-form-item class="ff-form-item" :label="$t('Success Message')">
                            <el-input :placeholder="$t('Success Message')" v-model="editing_coupon.settings.success_message"/>
                            <p class="mt-1 text-note">
                                {{ $t('Set the success message for coupon. You can use {coupon.code}, {coupon.amount}, {total_amount}, {discount_amount} and {remain_amount} smartcodes.') }}
                            </p>
                        </el-form-item>

                        <el-form-item class="ff-form-item" :label="$t('Failed Message')">
                            <el-radio-group v-model="failure_type" class="mb-3">
                                <el-radio label="Inactive">{{ $t('Inactive Coupon') }}</el-radio>
                                <el-radio label="Minimum Amount">{{ $t('Minimum Amount') }}</el-radio>
                                <el-radio label="Stackable">{{ $t('Stackable') }}</el-radio>
                                <el-radio label="Limit">{{ $t('Limit Crossed') }}</el-radio>
                                <el-radio label="Date Expire">{{ $t('Date Expired') }}</el-radio>
                                <el-radio label="Allowed Form">{{ $t('Allowed Form') }}</el-radio>
                            </el-radio-group>
                            <el-input v-if="failure_type === 'Inactive'"
                                      :placeholder="$t('Inactive Coupon Failure Message')"
                                      v-model="editing_coupon.settings.failed_message.inactive"/>
                            <el-input v-if="failure_type === 'Minimum Amount'"
                                      :placeholder="$t('Minimum Amount Failure Message')"
                                      v-model="editing_coupon.settings.failed_message.min_amount"/>
                            <el-input v-if="failure_type === 'Stackable'"
                                      :placeholder="$t('Stackable Failure Message')"
                                      v-model="editing_coupon.settings.failed_message.stackable"/>
                            <el-input v-if="failure_type === 'Limit'"
                                      :placeholder="$t('Limit Failure Message')"
                                      v-model="editing_coupon.settings.failed_message.limit"/>
                            <el-input v-if="failure_type === 'Date Expire'"
                                      :placeholder="$t('Date Expired Message')"
                                      v-model="editing_coupon.settings.failed_message.date_expire"/>
                            <el-input v-if="failure_type === 'Allowed Form'"
                                      :placeholder="$t('Allowed Form')"
                                      v-model="editing_coupon.settings.failed_message.allowed_form"/>
                            <p class="mt-1 text-note">
                                {{ $t('Set different failed message for coupon.') }}
                            </p>
                        </el-form-item>

                        <el-form-item class="ff-form-item" :label="$t('Status')">
                            <el-radio-group class="el-radio-group-info" v-model="editing_coupon.status">
                                <el-radio-button label="active">{{ $t('Active') }}</el-radio-button>
                                <el-radio-button label="inactive">{{ $t('Inactive') }}</el-radio-button>
                            </el-radio-group>
                            <error-view field="status" :errors="errors" />
                        </el-form-item>
                    </el-form>
                </div>
                <div slot="footer" class="dialog-footer has-separator">
                    <el-button type="info" @click="show_modal = false" class="el-button--soft">
                        {{ $t('Cancel') }}
                    </el-button>
                    <el-button type="primary" v-loading="saving" @click="saveCoupon()">
                        {{ $t('Save Coupon') }}
                    </el-button>
                </div>
            </el-dialog>
        </el-skeleton>
    </div>
</template>

<script type="text/babel">
    import Pagination from './_Pagination'
    import ErrorView from "@fluentform/common/errorView.vue";
    import Confirm from "@fluentform/admin/components/confirmRemove.vue";
    import CardHead from '@fluentform/admin/components/Card/CardHead.vue';
    import CardHeadGroup from '@fluentform/admin/components/Card/CardHeadGroup.vue';
    
    export default {
        name: 'CouponSettings',
        components: {
            Pagination,
            Confirm,
            ErrorView,
            CardHead,
            CardHeadGroup
        },
        data() {
            return {
                loading: false,
                saving: false,
                coupons: [],
                coupon_status: true,
                pagination: {
                    total: 0,
                    current_page: 1,
                    last_page: 1,
                    per_page: localStorage.getItem('couponsPerPage') || 10
                },
                editing_coupon: {},
                show_modal: false,
                available_forms: {},
                errors: new Errors(),
                failure_type: 'Inactive'
            }
        },
        methods: {
            getCoupons() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'get_coupons',
                    page: this.pagination.current_page,
                    per_page: this.pagination.per_page
                })
                    .then(response => {
                        this.coupon_status = response.coupon_status;
                        if(response.coupon_status) {
                            this.coupons = response.coupons.data;
                            this.pagination.total = response.coupons.total;
                            this.pagination.last_page = response.coupons.last_page;
                            this.pagination.per_page = response.coupons.per_page || localStorage.getItem('couponsPerPage') || 10;
                            if(response.available_forms) {
                                this.available_forms = response.available_forms;
                            }
                        }
                    })
                    .fail(error => {
                        this.$fail(error.responseJSON.message);
                    })
                    .always(() => {
                        this.loading = false;
                    })
            },
            enableCouponModule() {
                this.loading = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'enable_coupons'
                })
                    .then(response => {
                        this.coupon_status = response.coupon_status;
                        this.getCoupons();
                    })
                    .fail(error => {
                        this.$fail(error.responseJSON.message);
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            showAddCoupon() {
                this.errors.clear();
                this.editing_coupon = {
                    title: '',
                    code: '',
                    amount: '',
                    coupon_type: 'percent',
                    status: 'active',
                    stackable: 'no',
                    settings: {
                        allowed_form_ids: [],
                        coupon_limit: 0,
                        success_message: '{coupon.code} - {coupon.amount}',
                        failed_message: {
                            inactive: 'The provided coupon is not valid',
                            min_amount: 'The provided coupon does not meet the requirements',
                            stackable: 'Sorry, you can not apply this coupon with other coupon code',
                            date_expire: 'The provided coupon is not valid',
                            allowed_form: 'The provided coupon is not valid',
                            limit: 'The provided coupon is not valid'
                        }
                    },
                    min_amount: '',
                    max_use: '',
                    start_date: '',
                    expire_date: ''
                }
                this.show_modal = true;
            },
            saveCoupon() {
                this.saving = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'save_coupon',
                    coupon: this.editing_coupon
                })
                    .then(response => {
                        this.getCoupons();
                        this.show_modal = false;
                        this.editing_coupon = {};
                        this.$success(response.message);
                    })
                    .fail(error => {
                        this.$fail(error.responseJSON.message);
                        this.errors.record(error.responseJSON.errors)
                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            editCoupon(coupon) {
                this.errors.clear();
                const editing_coupon = JSON.parse(JSON.stringify(coupon));
                editing_coupon.settings = editing_coupon.settings || {};
                editing_coupon.settings.allowed_form_ids = editing_coupon.settings.allowed_form_ids || [];
                editing_coupon.settings.failed_message = editing_coupon.settings.failed_message || {
                    inactive: 'The provided coupon is not valid',
                    min_amount: 'The provided coupon does not meet the requirements',
                    stackable: 'Sorry, you can not apply this coupon with other coupon code',
                    date_expire: 'The provided coupon is not valid',
                    allowed_form: 'The provided coupon is not valid',
                    limit: 'The provided coupon is not valid'
                };
                editing_coupon.settings.success_message = editing_coupon.settings.success_message || '{coupon.code} - {coupon.amount}';
                this.$set(this, 'editing_coupon', editing_coupon);
                this.$nextTick(() => {
                    this.show_modal = true;
                });

            },
            deleteCoupon(coupon) {
                this.loading = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'delete_coupon',
                    coupon_id: coupon.id
                })
                    .then(response => {
                        this.getCoupons();
                        this.$success(response.message);
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.loading = false;
                    });
            }
        },
        mounted() {
            this.getCoupons();
        }
    }
</script>


<style lang="scss">
.ff_coupon_form {
    .el-form-item {
        > label {
            font-weight: 500;
            line-height: 100%;
        }

        p {
            margin-top: 5px;
            color: gray;
            font-size: 12px;
        }
    }
}
</style>

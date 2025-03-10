<template>
    <div class="ff-payment-settings">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Payment Settings') }}</h5>
            </card-head>
            <card-body>
                <div v-loading="loading" class="ff-payment-settings-wrapper">
                    <el-form v-if="settings" label-position="top">
                        <el-form-item class="ff-form-item" :label="$t('Currency')">
                            <el-select class="ff_input_width" filterable v-model="settings.currency" :placeholder="('Select Currency')">
                                <el-option
                                        v-for="(currencyName, currenyKey) in currencies"
                                        :key="currenyKey"
                                        :label="currencyName"
                                        :value="currenyKey">
                                </el-option>
                            </el-select>
                        </el-form-item>

                        <el-form-item class="ff-form-item" :label="$t('Transaction Type')">
                            <el-radio-group v-model="settings.transaction_type">
                                <el-radio label="product">{{ $t('Products / Services') }}</el-radio>
                                <el-radio label="donation">{{ $t('Donations') }}</el-radio>
                            </el-radio-group>
                        </el-form-item>

                        <el-row :gutter="20" class="mb-4">
                            <el-col :span="8">
                                <el-form-item class="ff-form-item">
                                    <template slot="label">
                                        {{ $t('Customer Email') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p> {{ $t('Please select the customer email field from your form\'s email inputs. It\'s optional field but recommended.')  }} </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </template>
                                    <el-select class="w-100" autoComplete="new_password" v-model="settings.receipt_email" clearable filterable :placeholder="$t('Select an email field')">
                                        <el-option
                                            v-for="(item, index) in emailFields"
                                            :key="index"
                                            :label="item.admin_label"
                                            :value="item.attributes.name">
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item class="ff-form-item">
                                    <template slot="label">
                                        {{ $t('Customer Name') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p> {{ $t('Please select the customer name field from your form inputs. It\'s an optional but recommended field. If the user is logged in then this data will be picked from logged in user.') }} </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </template>
                                    <input-popover
                                        v-model="settings.customer_name"
                                        :placeholder="$t('Customer Name')"
                                        icon="el-icon-arrow-down"
                                        :data="editorShortcodes"
                                    />
                                </el-form-item>
                            </el-col>
                            <el-col :span="8">
                                <el-form-item class="ff-form-item">
                                    <template slot="label">
                                        {{ $t('Customer Address') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p>{{ $t('Please select the customer address field from your form\'s address inputs. It\'s required for payments in India.') }} </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </template>
                                    <el-select class="w-100" v-model="settings.customer_address" clearable filterable :placeholder="$t('Select an address field')">
                                        <el-option
                                            v-for="(item, index) in addressFields"
                                            :key="index"
                                            :label="item.admin_label"
                                            :value="item.attributes.name">
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                            </el-col>
                        </el-row>

                        <div class="ff_card_block" v-if="payment_methods.stripe">
                            <div class="ff_card_block_head">
                                <h5>{{ $t('Stripe Settings') }}</h5>
                            </div>

                            <el-form-item class="ff-form-item" :label="$t('Stripe Meta Data')">
                                <el-checkbox true-label="yes" false-label="no" v-model="settings.push_meta_to_stripe">{{
                                        $t('Push Form Data to Stripe')
                                    }}
                                </el-checkbox>
                            </el-form-item>

                            <div v-if="settings.push_meta_to_stripe == 'yes'" class="mb-4">
                                <h6 class="mb-3">{{ $t('Please Map meta Data for Stripe') }}</h6>
                                <dropdown-label-repeater
                                    :settings="settings"
                                    :field="{ key: 'stripe_meta_data' }"
                                    :editorShortcodes="editorShortcodes"
                                />
                            </div>

                            <el-form-item class="ff-form-item" label="">
                                <template slot="label">
                                    {{ $t('Stripe Account') }}
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                        <div slot="content">
                                            <p>{{ $t('You can select which stripe account credential will be used for this form.Select "Custom Stripe Credential" for a different stripe account than global.')  }} </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                    </el-tooltip>
                                </template>
                                <el-radio-group v-model="settings.stripe_account_type">
                                    <el-radio label="global">{{ $t('As per global settings') }}</el-radio>
                                    <el-radio label="custom">{{ $t('Custom Stripe Credentials') }}</el-radio>
                                </el-radio-group>
                            </el-form-item>

                            <div class="ff_payment_mode_wrap mb-4" v-if="settings.stripe_account_type == 'custom'">
                                <el-form-item class="ff-form-item" label="">
                                    <template slot="label">
                                        {{ $t('Payment Mode') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p>{{ $t('Select the payment mode.for testing purposes you should select Test Mode otherwise select Live mode.') }} </p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </template>
                                    <el-radio-group v-model="settings.stripe_custom_config.payment_mode">
                                        <el-radio label="live">{{ $t('Live Mode') }}</el-radio>
                                        <el-radio label="test">{{ $t('Test Mode') }}</el-radio>
                                    </el-radio-group>
                                </el-form-item>

                                <h4>
                                    <span
                                        v-html="
                                            $t('Please provide your %s API Keys%s',
                                            `<span class='text-danger'>${ucFirst(settings.stripe_custom_config.payment_mode)}`,
                                            '</span>')
                                        "
                                    >
                                    </span>
                                </h4>

                                <el-form-item class="ff-form-item" :label="$t('Publishable key')">
                                    <template slot="label">
                                        {{ $t('%s Publishable key', ucFirst(settings.stripe_custom_config.payment_mode)) }}
                                    </template>
                                    <el-input
                                        type="text"
                                        v-model="settings.stripe_custom_config.publishable_key"
                                        :placeholder="$t('Publishable key')"/>
                                </el-form-item>

                                <el-form-item class="ff-form-item" label="">
                                    <template slot="label">
                                        {{ $t('%s Secret key', ucFirst(settings.stripe_custom_config.payment_mode)) }}
                                    </template>
                                    <el-input type="password" v-model="settings.stripe_custom_config.secret_key"
                                            :placeholder="$t('Secret key')"/>
                                </el-form-item>
                                <p
                                    v-html="
                                        $t(
                                            'You can find the API keys to %sStripe Dashboard%s',
                                            `<a target='_blank' rel='noopener' href='https://dashboard.stripe.com/apikeys'>`,
                                            '</a>'
                                        )
                                    "
                                >
                                </p>
                            </div>

                            <el-form-item class="ff-form-item" :label="$t('Stripe Payment Receipt')">
                                <el-checkbox true-label="yes" false-label="no" v-model="settings.disable_stripe_payment_receipt">
                                    {{ $t('Disable Payment Receipt Email by Stripe(not recommended)') }}
                                </el-checkbox>
                            </el-form-item>

                            <el-form-item class="ff-form-item">
                                <template slot="label">
                                    {{ $t('Statement Descriptor') }}
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                        <div slot="content">
                                            <p>{{ $t('Provide the statement descriptor. If you keep it empty then your form name will be set. (Contains between 5 and 22 characters)') }} </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                    </el-tooltip>
                                </template>
                                <el-input :placeholder="$t('Statement Description')" type="text" maxlength="22" v-model="settings.stripe_descriptor" />
                            </el-form-item>
                        </div>

                        <div class="ff_card_block mt-4" v-if="payment_methods.paypal">
                            <div class="ff_card_block_head">
                                <h5>{{ $t('PayPal Settings') }}</h5>
                            </div>
                            <el-form-item class="ff-form-item" label="">
                                <template slot="label">
                                    {{ $t('PayPal Account') }}
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                        <div slot="content">
                                            <p>{{ $t('You can select which PayPal account email will be used for this form.Select "Custom PayPal ID" for a different PayPal account than global.')}} </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                    </el-tooltip>
                                </template>
                                <el-radio-group v-model="settings.paypal_account_type">
                                    <el-radio label="global">{{ $t('As per global settings') }}</el-radio>
                                    <el-radio label="custom">{{ $t('Custom PayPal ID') }}</el-radio>
                                </el-radio-group>
                            </el-form-item>
                            <template v-if="settings.paypal_account_type == 'custom'">
                                <el-form-item class="ff-form-item" label="">
                                    <template slot="label">
                                        {{ $t('Payment Mode') }}
                                        <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                            <div slot="content">
                                                <p> {{ $t('Select the payment mode. For testing purposes you should select Test Mode otherwise select Live mode.') }}</p>
                                            </div>
                                            <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                        </el-tooltip>
                                    </template>
                                    <el-radio-group v-model="settings.custom_paypal_mode">
                                        <el-radio label="live">{{ $t('Live Mode') }}</el-radio>
                                        <el-radio label="test">{{ $t('Test Mode') }}</el-radio>
                                    </el-radio-group>
                                </el-form-item>
                                <el-form-item class="ff-form-item" label="PayPal Email">
                                    <el-input type="email" v-model="settings.custom_paypal_id" :placeholder="$t('Custom PayPal Email')" />
                                </el-form-item>
                            </template>
                        </div>

                        <div class="ff_card_block mt-4" v-if="payment_methods.paddle">
                            <div class="ff_card_block_head">
                                <h5>{{ $t('Paddle Settings') }}</h5>
                            </div>

                            <el-form-item class="ff-form-item" label="">
                                <template slot="label">
                                    {{ $t('Paddle Payment') }}
                                    <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                        <div slot="content">
                                            <p>
                                                {{ $t('You can select which type of payment process can be done through Paddle.') }}
                                            </p>
                                        </div>
                                        <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                    </el-tooltip>
                                </template>
                                <el-radio-group v-model="settings.paddle_transaction_type">
                                    <el-radio label="non_catalog">{{ $t('Non-catalog') }}</el-radio>
                                    <el-radio label="catalog">{{ $t('Catalog Item') }}</el-radio>
                                    <el-radio label="non_catalog_price">
                                        {{ $t('Non-catalog price for an existing product') }}
                                    </el-radio>
                                </el-radio-group>
                            </el-form-item>

                            <div v-if="settings.paddle_transaction_type == 'catalog'" class="mb-4">
                                <h6 class="mb-3">{{ $t('Map Catalog Price') }}</h6>
                                <el-row v-for="(item, index) in settings.paddle_catalog_data" :key="index" :gutter="20" class="mb-4">
                                    <el-col :span="10">
                                        <el-form-item class="ff-form-item">
                                            <template slot="label">
                                                {{ $t('Select Price') }}
                                                <el-tooltip class="item" placement="bottom-start"
                                                            popper-class="ff_tooltip_wrap">
                                                    <div slot="content">
                                                        <p> {{ $t('Please select the price') }} </p>
                                                    </div>
                                                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                                </el-tooltip>
                                            </template>
                                            <el-select class="w-100" v-model="item.price_id" clearable filterable
                                                       :placeholder="$t('Select a price field')">
                                                <el-option
                                                    v-for="(item, index) in paddlePrices"
                                                    :key="index"
                                                    :label="item"
                                                    :value="index">
                                                </el-option>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="10">
                                        <el-form-item class="ff-form-item">
                                            <template slot="label">
                                                {{ $t('Select Quantity Field') }}
                                                <el-tooltip class="item" placement="bottom-start"
                                                            popper-class="ff_tooltip_wrap">
                                                    <div slot="content">
                                                        <p>
                                                            {{ $t('Please select the quantity field') }}
                                                        </p>
                                                    </div>
                                                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                                </el-tooltip>
                                            </template>
                                            <el-select class="w-100" v-model="item.quantity" clearable filterable :placeholder="$t('Select quantity field')">
                                                <el-option
                                                    v-for="(item, index) in quantityFields"
                                                    :key="index"
                                                    :label="item.admin_label"
                                                    :value="item.attributes.name">
                                                </el-option>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col class="mt-6" :span="4">
                                        <action-btn>
                                            <action-btn-add
                                                @click="addItemAfter(index, 'paddle_catalog_data')"></action-btn-add>
                                            <action-btn-remove v-if="settings.paddle_catalog_data.length > 1" @click="removeItem(index, 'paddle_catalog_data')"></action-btn-remove>
                                        </action-btn>
                                    </el-col>
                                </el-row>
                            </div>

                            <div v-if="settings.paddle_transaction_type == 'non_catalog_price'" class="mb-4">
                                <h6 class="mb-3">{{ $t('Map Product') }}</h6>
                                <el-row v-for="(item, index) in settings.paddle_non_catalog_price_data" :key="index" :gutter="20" class="mb-4">
                                    <el-col :span="10">
                                        <el-form-item class="ff-form-item">
                                            <template slot="label">
                                                {{ $t('Select Product') }}
                                                <el-tooltip class="item" placement="bottom-start"
                                                            popper-class="ff_tooltip_wrap">
                                                    <div slot="content">
                                                        <p> {{ $t('Please select the product') }} </p>
                                                    </div>
                                                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                                </el-tooltip>
                                            </template>
                                            <el-select class="w-100" v-model="item.product_id" clearable filterable :placeholder="$t('Select a product')">
                                                <el-option
                                                    v-for="(item, index) in paddleProducts"
                                                    :key="index"
                                                    :label="item"
                                                    :value="index">
                                                </el-option>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col :span="10">
                                        <el-form-item class="ff-form-item">
                                            <template slot="label">
                                                {{ $t('Select payment item') }}
                                                <el-tooltip class="item" placement="bottom-start"
                                                            popper-class="ff_tooltip_wrap">
                                                    <div slot="content">
                                                        <p>
                                                            {{ $t('Please select the payment item') }}
                                                        </p>
                                                    </div>
                                                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                                </el-tooltip>
                                            </template>
                                            <el-select class="w-100" v-model="item.payment_item" clearable filterable :placeholder="$t('Select a payment item')" :valueKey="'name'">
                                                <el-option
                                                    v-for="(item, index) in paymentFields"
                                                    :key="index"
                                                    :label="item.admin_label"
                                                    :value="item.attributes.name">
                                                </el-option>
                                            </el-select>
                                        </el-form-item>
                                    </el-col>
                                    <el-col class="mt-6" :span="4">
                                        <action-btn>
                                            <action-btn-add @click="addItemAfter(index, 'paddle_non_catalog_price_data')"></action-btn-add>
                                            <action-btn-remove v-if="settings.paddle_non_catalog_price_data.length > 1" @click="removeItem(index, 'paddle_non_catalog_price_data')"></action-btn-remove>
                                        </action-btn>
                                    </el-col>
                                </el-row>
                            </div>
                        </div>
                        <div class="mt-4">
                            <el-button icon="el-icon-success" :loading="saving" @click="saveSettings()" type="primary">
                                {{ $t('%s Settings', saving ? 'Saving' : 'Save') }}
                            </el-button>
                        </div>
                    </el-form>
                </div>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
    import DropdownLabelRepeater from './GeneralIntegration/_DropdownLabelRepeater';
    import FieldGeneral from './GeneralIntegration/_FieldGeneral';
    import inputPopover from '../input-popover.vue';
    import Card from '@/admin/components/Card/Card.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import ActionBtnRemove from "@/admin/components/ActionBtn/ActionBtnRemove.vue";
    import ActionBtnAdd from "@/admin/components/ActionBtn/ActionBtnAdd.vue";
    import ActionBtn from "@/admin/components/ActionBtn/ActionBtn.vue";

    export default {
        name: 'payment-settings',
        props: ['form', 'editorShortcodes', 'inputs'],
        components: {
            DropdownLabelRepeater,
            FieldGeneral,
            inputPopover,
            Card,
            CardHead,
            CardBody,
            ActionBtn,
            ActionBtnAdd,
            ActionBtnRemove
        },
        data() {
            return {
                saving: false,
                settings: false,
                loading: false,
                currencies: [],
                payment_methods: [],
                addressFields: []
            }
        },
        computed: {
            emailFields() {
                return _ff.filter(this.inputs, (input) => {
                    return input.attributes.type === 'email';
                });
            },
            paymentFields() {
                return _ff.filter(this.inputs, (input) => {
                    return input.element === 'multi_payment_component' || input.element === 'custom_payment_component';
                });
            },
            quantityFields() {
                return _ff.filter(this.inputs, (input) => {
                    return input.element === 'item_quantity_component';
                });
            },
            paddlePrices() {
                return this.settings.paddle_prices;
            },
            paddleProducts() {
                return this.settings.paddle_products;
            }
        },
        methods: {
            getSettings() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    form_id: this.form.id,
                    route: 'get_form_settings'
                })
                    .then(response => {
                        this.settings = response.data.settings;
                        this.currencies = response.data.currencies;
                        this.payment_methods = response.data.payment_methods;
                        this.addressFields = response.data.addressFields;
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            saveSettings() {
                this.saving = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    form_id: this.form.id,
                    route: 'save_form_settings',
                    settings: this.settings
                })
                    .then(response => {
                        this.$success(response.data.message);
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.saving = false;
                    });
            },
            addItemAfter(index, key) {
                this.loading = true;
                if (key == 'paddle_catalog_data') {
                    this.settings[key].splice(index + 1, 0, {
                        price_id: '',
                        quantity: ''
                    });
                }
                if (key == 'paddle_non_catalog_price_data') {
                    this.settings[key].splice(index + 1, 0, {
                        product_id: '',
                        payment_item: ''
                    });
                }
                this.$nextTick(() => {
                    this.loading = false;
                });
            },
            removeItem(index, key) {
                this.loading = true;
                this.settings[key].splice(index, 1);
                this.$nextTick(() => {
                    this.loading = false;
                });
            }
        },
        mounted() {
            this.getSettings();
            jQuery('head title').text('Payment Settings - Fluent Forms');
        }
    }
</script>

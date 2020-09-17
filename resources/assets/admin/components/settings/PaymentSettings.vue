<template>
    <div class="ff-payment-settings">
        <!-- Confirmation Settings -->
        <el-row class="setting_header">
            <el-col :md="12">
                <h2>Payment Settings</h2>
            </el-col>
            <!--Save settings-->
            <el-col :md="12" class="action-buttons clearfix mb15">
                <el-button
                        :loading="saving"
                        class="pull-right"
                        size="medium"
                        type="success"
                        icon="el-icon-success"
                        @click="saveSettings">
                    {{saving ? 'Saving' : 'Save'}} Settings
                </el-button>
            </el-col>
        </el-row>
        <div v-loading="loading" class="ff-payment-settings-wrapper">
            <el-form v-if="settings" label-width="205px" label-position="left">
                <el-form-item label="Currency">
                    <el-select size="small" filterable v-model="settings.currency" placeholder="Select Currency">
                        <el-option
                                v-for="(currencyName, currenyKey) in currencies"
                                :key="currenyKey"
                                :label="currencyName"
                                :value="currenyKey">
                        </el-option>
                    </el-select>
                </el-form-item>

                <el-form-item label="Transaction Type">
                    <el-radio-group v-model="settings.transaction_type">
                        <el-radio label="product">Products / Services</el-radio>
                        <el-radio label="donation">Donations</el-radio>
                    </el-radio-group>
                </el-form-item>

                <el-form-item>
                    <template slot="label">
                        Customer Email
                        <el-tooltip class="item" placement="bottom-start" effect="light">
                            <div slot="content">
                                <h3>Customer Email</h3>
                                <p>
                                    Please select the customer email field from your form's email inputs. It's optional
                                    field but recommended.
                                </p>
                            </div>
                            <i class="el-icon-info el-text-info"></i>
                        </el-tooltip>
                    </template>
                    <el-select v-model="settings.receipt_email" clearable filterable placeholder="Select an email field">
                        <el-option
                                v-for="(item, index) in emailFields"
                                :key="index"
                                :label="item.admin_label"
                                :value="item.attributes.name">
                        </el-option>
                    </el-select>
                </el-form-item>


                <div class="ff_card_block" v-if="payment_methods.stripe">
                    <h3>Stripe Settings</h3>

                    <el-form-item label="Stripe Meta Data">
                        <el-checkbox true-label="yes" false-label="no" v-model="settings.push_meta_to_stripe">Push Form
                            Data to Stripe
                        </el-checkbox>
                    </el-form-item>

                    <div v-if="settings.push_meta_to_stripe == 'yes'">
                        <h3>Please Map meta Data for Stripe</h3>
                        <dropdown-label-repeater
                                :settings="settings"
                                :field="{ key: 'stripe_meta_data' }"
                                :editorShortcodes="editorShortcodes"
                        />
                    </div>

                    <el-form-item label="">
                        <template slot="label">
                            Accepted Methods
                            <el-tooltip class="item" placement="bottom-start" effect="light">
                                <div slot="content">
                                    <p>
                                        You can select which payment methods will be available in stripe checkout page. Please make sure you have those methods enabled and match with your selected currency.
                                    </p>
                                </div>
                                <i class="el-icon-info el-text-info"></i>
                            </el-tooltip>
                        </template>

                        <el-checkbox-group v-model="settings.stripe_checkout_methods">
                            <el-checkbox
                                    v-for="(methodName,methodKey) in stripeCheckoutMethods"
                                    :key="methodKey"
                                    :label="methodKey"
                            >{{methodName}}</el-checkbox>
                        </el-checkbox-group>

                        <p v-show="settings.stripe_checkout_methods.length > 1">Please make sure the selected methods are enabled in your stripe settings and match the selected currency</p>

                    </el-form-item>

                </div>

                <div style="margin-top: 30px" class="action_right">
                    <el-button :loading="saving" @click="saveSettings()" type="success" size="small">
                        {{saving ? 'Saving' : 'Save'}} Settings
                    </el-button>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script type="text/babel">
    import DropdownLabelRepeater from './GeneralIntegration/_DropdownLabelRepeater';
    import FieldGeneral from './GeneralIntegration/_FieldGeneral';

    export default {
        name: 'payment-settings',
        props: ['form', 'editorShortcodes', 'inputs'],
        components: {
            DropdownLabelRepeater,
            FieldGeneral
        },
        data() {
            return {
                saving: false,
                settings: false,
                loading: false,
                currencies: [],
                payment_methods: [],
                stripeCheckoutMethods: {
                    card: 'Debit/Credit Card',
                    ideal: 'iDeal',
                    fpx: 'FPX',
                    bacs_debit: 'BACS Direct Debit (UK)',
                    bancontact: 'Bancontact',
                    giropay: 'Giropay',
                    p24: 'Przelewy24 (P24)',
                    eps: 'EPS'
                }
            }
        },
        computed: {
            emailFields() {
                return _ff.filter(this.inputs, (input) => {
                    return input.attributes.type === 'email';
                });
            }
        },
        methods: {
            getSettings() {
                this.loading = true;
                jQuery.get(window.ajaxurl, {
                    action: 'handle_payment_ajax_endpoint',
                    form_id: this.form.id,
                    route: 'get_form_settings'
                })
                    .then(response => {
                        this.settings = response.data.settings;
                        this.currencies = response.data.currencies;
                        this.payment_methods = response.data.payment_methods;
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            saveSettings() {
                this.saving = true;
                jQuery.post(window.ajaxurl, {
                    action: 'handle_payment_ajax_endpoint',
                    form_id: this.form.id,
                    route: 'save_form_settings',
                    settings: this.settings
                })
                    .then(response => {
                        this.$notify.success(response.data.message);
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.saving = false;
                    });
            }
        },
        mounted() {
            this.getSettings();
            jQuery('head title').text('Payment Settings - Fluent Forms');
        }
    }
</script>

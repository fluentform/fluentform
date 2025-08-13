<template>
    <div style="min-height: 300px;" class="ff_method_settings">
        <el-skeleton :loading="loading" animated :rows="10">
            <el-form v-if="settings" label-position="top" rel="paypal_settings" :model="settings">
                <el-form-item class="ff-form-item" :label="$t('Status')">
                    <el-checkbox true-label="yes" false-label="no" v-model="settings.is_active">
                        {{ $t('Enable PayPal Payment Method') }}
                    </el-checkbox>
                </el-form-item>
                <template v-if="settings.is_active === 'yes'">
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Payment Mode') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Select the payment mode. For testing purposes you should select Sandbox Mode otherwise select Live Mode.') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>
                        <el-radio-group v-model="settings.payment_mode">
                            <el-radio label="test">{{ $t('Sandbox Mode') }}</el-radio>
                            <el-radio label="live">{{ $t('Live Mode') }}</el-radio>
                        </el-radio-group>

                        <error-view field="payment_mode" :errors="errors" />
                    </el-form-item>
                    <el-form-item class="ff-form-item" :label="$t('PayPal Email')">
                        <el-input
                            type="text"
                            v-model="settings.paypal_email"
                            :placeholder="$t('Paypal Email Address')"/>

                        <error-view field="paypal_email" :errors="errors" />
                    </el-form-item>

                    <div class="el-form-item-wrap mb-4">
                        <el-form-item class="ff-form-item ff-form-item-flex mb-2">
                            <span slot="label" style="width: 390px;">
                                {{$t('Disable PayPal IPN Verification')}}
                            </span>
                            <el-switch active-value="yes" inactive-value="no" v-model="settings.disable_ipn_verification"/>
                        </el-form-item>
                        <p>
                            {{ $t('If you are unable to use Payment Data Transfer and payments are not getting marked as complete, then check this box. This forces the site to use a slightly less secure method of verifying purchases.') }}
                        </p>
                    </div>

                    <div class="ff_payment_sub_section">
                        <h5 class="mb-2">
                            {{ $t('PayPal IPN Settings (Recommended for Subscription Payment)') }}
                        </h5>
                        <p>
                            {{ $t('In order to function completely for subscription/recurring payments, you must configure your PayPal IPN.') }}
                        </p>
                        <p><b>{{ $t('IPN URL') }}: </b><code>{{global_settings.paypal_webhook_url}}</code></p>
                        <p> <a target="_blank" rel="noopener" href="https://wpmanageninja.com/docs/fluent-form/payment-settings/how-to-setup-paypal-ipn-with-wp-fluent-forms/">{{ $t('Please read the documentation') }}</a> {{ $t('to learn how to setup') }} <b>{{ $t('PayPal IPN') }} </b>.</p>
                    <p></p>
                    </div>
                </template>
                <div class="mt-4">
                    <el-button @click="saveSettings()" type="primary" size="medium" icon="el-icon-success">
                        {{ $t('Save PayPal Settings') }}
                    </el-button>
                </div>
            </el-form>
            <div v-else-if="!loading" class="ff_tips_warning">
                <p>
                    {{ $t('Sorry! No settings found. Maybe your payment module is disabled!') }}
                </p>
            </div>
        </el-skeleton>
    </div>
</template>

<script type="text/babel">
    import ErrorView from "@fluentform/common/errorView.vue";

    export default {
        name: 'paypalSettings',
        props: ['global_settings'],
        components: {
            ErrorView,
        },
        data() {
            return {
                loading: false,
                settings: false,
                errors: new Errors(),
            }
        },
        methods: {
            getSettings() {
                this.loading = true;
                this.errors.clear();
                FluentFormsGlobal.$get({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'get_payment_method_settings',
                    method: 'paypal'
                })
                    .then(response => {
                        this.settings = response.data.settings;
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.loading = false;
                    })
            },
            saveSettings() {
                this.errors.clear();
                this.saving = true;
                FluentFormsGlobal.$post({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'save_payment_method_settings',
                    method: 'paypal',
                    settings: this.settings
                })
                    .then((response) => {
                        this.$success(response.data.message);
                    })
                    .fail((error) => {
                        this.$fail(error.responseJSON.data.message);
                        this.errors.record(error.responseJSON.data.errors);
                    })
                    .always(() => {
                        this.saving = false;
                    });
            }
        },
        mounted() {
            this.getSettings();
        }
    }
</script>

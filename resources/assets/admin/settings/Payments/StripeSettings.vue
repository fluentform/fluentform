<template>
    <div style="min-height: 300px;" class="ff_method_settings">
        <el-skeleton :loading="fetching_connect" animated :rows="10">
            <el-form v-if="settings" label-position="top" rel="offline_settings" :model="settings">
                <el-form-item class="ff-form-item" :label="$t('Status')">
                    <el-checkbox true-label="yes" false-label="no" v-model="settings.is_active">
                        {{ $t('Enable Stripe Payment Method') }}
                    </el-checkbox>
                </el-form-item>
                <template v-if="settings.is_active == 'yes'">
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Payment Mode') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Select the payment mode. for testing purposes you should select Test Mode otherwise select Live mode.') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>
                        <el-radio-group v-model="settings.payment_mode">
                            <el-radio label="test">{{ $t('Test Mode') }}</el-radio>
                            <el-radio label="live">{{ $t('Live Mode') }}</el-radio>
                        </el-radio-group>
                    </el-form-item>

                    <template v-if="settings.provider == 'connect'">
                        <template v-if="settings.payment_mode == 'test'">
                            <connect-account  @reload_settings="getConnectConfig()" :connect_config="connect_config" mode="test" :connect="test_account" />
                        </template>
                        <template v-else-if="settings.payment_mode == 'live'">
                            <connect-account @reload_settings="getConnectConfig()" :connect_config="connect_config" mode="live" :connect="live_account" />
                        </template>
                        <error-view field="connect" :errors="errors" />
                    </template>
                    <template v-else>
                        <div class="ff_payment_sub_section">
                            <h3>{{ $t('Stripe Test API Keys') }}</h3>
                            <el-form-item :label="$t('Test Publishable key')">
                                <el-input type="text" size="small" v-model="settings.test_publishable_key"
                                        :placeholder="$t('Test Publishable key')"/>
                                
                                <error-view field="test_publishable_key" :errors="errors" />
                            </el-form-item>
                            <el-form-item :label="$t('Test Secret key')">
                                <el-input type="password" size="small" v-model="settings.test_secret_key"
                                        :placeholder="$t('Test Secret key')"/>
                                <error-view field="test_secret_key" :errors="errors" />
                            </el-form-item>
                            <p
                                v-html="
                                    $t(
                                        'You can find the API keys to %sStripe Dashboard%s',
                                        `<a target='_blank' rel='noopener' href='https://dashboard.stripe.com/test/apikeys'>`,
                                        '</a>'
                                    )
                                "
                            >
                            </p>
                        </div>

                        <div class="ff_payment_sub_section">
                            <h3>{{ $t('Stripe Live API Keys') }}</h3>
                            <el-form-item :label="$t('Live Publishable key')">
                                <el-input type="text" size="small" v-model="settings.live_publishable_key"
                                        :placeholder="$t('Live Publishable key')"/>
                                <error-view field="live_publishable_key" :errors="errors" />
                            </el-form-item>
                            <el-form-item :label="$t('Live Secret key')">
                                <el-input type="password" size="small" v-model="settings.live_secret_key"
                                        :placeholder="$t('Live Secret key')"/>
                                <error-view field="live_secret_key" :errors="errors" />
                            </el-form-item>
                            <p
                                v-html="
                                    $t(
                                        'You can find the API keys to %sStripe Dashboard%s',
                                        `<a target='_blank' rel='noopener' href='https://dashboard.stripe.com/test/apikeys'>`,
                                        '</a>'
                                    )
                                "
                            >
                            </p>
                        </div>
                    </template>
                </template>

                <div v-if="settings.is_active == 'yes'" class="ff_payment_sub_section mt-3">
                    <h5 class="mb-2">
                        {{ $t('Stripe Webhook (Recommended for Recurring Payments)') }}
                    </h5>
                    <p
                        v-html="
                            $t(
                                'In order for Stripe to function completely for subscription/recurring payments, you must configure your Stripe webhooks. Visit your %saccount dashboard%s to configure them. Please add a webhook endpoint for the URL below.',
                                `<a href='https://dashboard.stripe.com/account/webhooks' target='_blank' rel='noopener'>`,
                                '</a>'
                            )
                        "
                    >
                    </p>
                    <p
                        v-html="
                            $t(
                                '%sWebhook URL:%s %s',
                                '<b>',
                                '</b>',
                                `<code>${global_settings.stripe_webhook_url}</code>`
                            )
                        "
                    ></p>
                    <p
                        v-html="
                            $t(
                                '%sPlease read the documentation%s to learn how to setup %sStripe IPN%s',
                                `<a target='_blank' rel='noopener' href='https://wpmanageninja.com/docs/fluent-form/payment-settings/how-to-setup-stripe-ipn-with-wp-fluent-forms/'>`,
                                '</a>'
                            )
                        "
                    ></p>

                    <div>
                        <p><b>{{ $t('Please enable the following Webhook events for this URL') }}:</b></p>
                        <ul>
                            <li><code>charge.succeeded</code></li>
                            <li><code>charge.captured</code></li>
                            <li><code>invoice.payment_succeeded</code></li>
                            <li><code>charge.refunded</code></li>
                            <li><code>customer.subscription.deleted</code></li>
                            <li><code>customer.subscription.updated</code></li>
                            <li><code>checkout.session.completed</code></li>
                        </ul>
                    </div>
                </div>

                <div class="mt-4">
                    <el-button @click="saveSettings()" type="primary" size="medium" icon="el-icon-success">
                        {{ $t('Save Stripe Settings') }}
                    </el-button>
                </div>
            </el-form>
            <div v-else-if="!fetching_connect">
                <div class="ff_tips_warning">
                    <p>
                        {{ $t('Sorry! No settings found. Maybe your payment module is disabled!') }}
                    </p>
                </div>
            </div>
        </el-skeleton>
    </div>
</template>

<script type="text/babel">
import ConnectAccount from './_ConnectAccount';
import ErrorView from "@/common/errorView.vue";

export default {
    name: 'stripeSettings',
    components: {
        ConnectAccount,
        ErrorView,
    },
    props: ['global_settings'],
    data() {
        return {
            settings: false,
            loading: false,
            errors: new Errors(),
            fetching_connect: false,
            connect_config: false,
            live_account: false,
            test_account: false,
        }
    },
    methods: {
        saveSettings() {
            this.errors.clear();
            this.saving = true;
            FluentFormsGlobal.$post({
                action: 'fluentform_handle_payment_ajax_endpoint',
                route: 'save_payment_method_settings',
                method: 'stripe',
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
        },
        getConnectConfig() {
            this.fetching_connect = true;
            FluentFormsGlobal.$get({
                action: 'fluentform_handle_payment_ajax_endpoint',
                route: 'get_stripe_connect_config'
            })
                .then(response => {
                    this.connect_config = response.data.connect_config;
                    this.settings = response.data.settings;
                    this.live_account = response.data.live_account;
                    this.test_account = response.data.test_account;
                })
                .fail(error => {

                })
                .always(() => {
                    this.fetching_connect = false;
                });
        }
    },
    mounted() {
        this.getConnectConfig();
    }
}
</script>

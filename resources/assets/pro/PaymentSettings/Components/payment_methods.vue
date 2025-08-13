<template>
    <div class="payment_method_wrapper">
        <div class="ff_method_settings">
            <el-tabs v-model="selectedMethod">
                <el-tab-pane name="stripe" :label="$t('Stripe')">
                    <stripe-settings :global_settings="settings" v-if="selectedMethod == 'stripe'" />
                </el-tab-pane>
                <el-tab-pane name="paypal" :label="$t('PayPal Standard')">
                    <pay-pal-settings :global_settings="settings" v-if="selectedMethod == 'paypal'" />
                </el-tab-pane>
                <el-tab-pane
                    v-for="(method, methodKey) in settings.available_payment_methods"
                    :key="methodKey"
                    :label="method.label"
                    :name="methodKey"
                >
                    <settings-builder
                        v-if="selectedMethod == methodKey"
                        :method_key="methodKey"
                        :method="settings.available_payment_methods[methodKey]"
                    />
                </el-tab-pane>
                <el-tab-pane name="test"  :label="$t('Test Payment')">
                    <test-settings v-if="selectedMethod == 'test'" />
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>

<script type="text/babel">
import SettingsBuilder from './SettingsBuilder';
import PayPalSettings from "./PayPalSettings";
import TestSettings from "./testSettings";
import StripeSettings from "./StripeSettings";
import Coupons from "./Coupons";

export default {
    name: 'PaymentMethods',
    props: ['settings'],
    components: {
        StripeSettings,
        PayPalSettings,
        TestSettings,
        Coupons,
        SettingsBuilder
    },
    data() {
        return {
            selectedMethod: 'stripe'
        }
    }
}
</script>

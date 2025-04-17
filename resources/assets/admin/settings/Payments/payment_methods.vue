<template>
	<div class="payment_method_wrapper">
		<div class="ff_method_settings">
			<el-tabs v-model="selectedMethod">
				<el-tab-pane name="stripe" :label="$t('Stripe')">
					<stripe-settings :global_settings="settings" v-if="selectedMethod === 'stripe'" />
				</el-tab-pane>

				<el-tab-pane v-if="customComponents['paypal']" name="paypal" :label="$t('PayPal Standard')">
					<component :global_settings="settings" v-if="selectedMethod === 'paypal'" :is="customComponents['paypal']"></component>
				</el-tab-pane>

				<el-tab-pane
					v-for="(method, methodKey) in settings.available_payment_methods"
					:key="methodKey"
					:label="method.label"
					:name="methodKey"
				>
					<settings-builder
						v-if="selectedMethod === methodKey"
						:method_key="methodKey"
						:method="settings.available_payment_methods[methodKey]"
					/>
				</el-tab-pane>

				<el-tab-pane v-if="customComponents['test']" name="test"  :label="$t('Test Payment')">
					<component :is="customComponents['test']" v-if="selectedMethod === 'test'"></component>
				</el-tab-pane>
			</el-tabs>
		</div>
	</div>
</template>

<script type="text/babel">
import SettingsBuilder from './SettingsBuilder';
import StripeSettings from "./StripeSettings";

export default {
	name: 'PaymentMethods',
	props: ['settings'],
	components: {
		StripeSettings,
		SettingsBuilder
	},
	data() {
		return {
			selectedMethod: 'stripe',
			customComponents: {}
		}
	},
	mounted() {
		this.customComponents = window.fluentformPaymentMethodsCustomComponents || {};
		// Dynamically register custom components
		Object.entries(this.customComponents).forEach(([key, component]) => {
			if (typeof component === 'object' && !this.$options.components[key]) {
				this.$options.components[key] = component;
			}
		});
	}
}
</script>
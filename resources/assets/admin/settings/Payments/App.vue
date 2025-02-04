<template>
    <div class="ff_payment_wrapper">
        <div class="ff_pre_settings_wrapper" v-if="!app.payment_vars.is_setup">
            <h2>
                {{ $t('Fluent Forms Payment Module') }}
            </h2>
            <p>
                {{ $t('Enable your users to pay online as part of the Forms submission process. With Fluent Forms Powerful payment integration, you can easily accept and process payments in your Fluent Forms. Just activate this module and setup your payment methods.') }}
            </p>
            <el-button @click="enablePaymentModule()" type="primary" icon="el-icon-success">
                {{ $t('Enable Payment Module') }}
            </el-button>
        </div>
        <div class="ff_payment_settings_wrapper" v-else>
            <card>
                <div class="ff_payment_settings">
	                <component
		                :is="currentComponent"
		                :settings="app.payment_vars"
	                ></component>
                </div>
            </card>
        </div>
	    <global-search/>
    </div>
</template>
<script type="text/babel">
    import Card from '@/admin/components/Card/Card.vue';
    import globalSearch from '@/admin/global_search'
    import GeneralSettings from './GeneralSettings.vue';
    import PaymentMethods from "./payment_methods.vue";

    export default {
        name: 'payment-settings',
	    props:['app', 'component_name'],
        components: {
	        GeneralSettings,
	        PaymentMethods,
	        globalSearch,
            Card
        },
        data() {
            return {
                loading: false,
            }
        },
        methods: {
            enablePaymentModule() {
                FluentFormsGlobal.$post({
                    action: 'fluentform_handle_payment_ajax_endpoint',
                    route: 'enable_payment'
                })
                .then(response => {
                    this.$success(response.data.message);
                    if (response.data.reload) {
                        location.reload();
                    }
                });
            },
        },
	    computed: {
		    currentComponent() {
			    const customComponent = window.fluentformPaymentCustomComponents && window.fluentformPaymentCustomComponents[this.component_name];
			    if (customComponent) {
				    // Register the custom component dynamically
				    const componentName = customComponent.name || `CustomComponent${Date.now()}`;
				    this.$options.components[componentName] = customComponent;
				    return componentName;
			    }
			    switch(this.component_name) {
				    case 'payments/payment_methods':
					    return PaymentMethods;
				    case 'payments/general_settings':
					    return GeneralSettings;
				    default:
					    return 'div';
			    }
		    }
	    },

	    created() {
		    window.fluentformPaymentCustomComponents = window.fluentformPaymentCustomComponents || {};
	    }
    }
</script>


<template>
    <div class="ff_payment_wrapper">
        <div class="ff_pre_settings_wrapper" v-if="!app_vars.is_setup">
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
                    <router-view :settings="app_vars"></router-view>
                </div><!-- ff_payment_settings -->
            </card>
        </div>
	    <global-search/>
    </div>
</template>
<script type="text/babel">
    import Card from '@fluentform/admin/components/Card/Card.vue';
    import globalSearch from '@fluentform/admin/global_search'

    export default {
        name: 'payment-settings',
        props: ['settings'],
        components: {
	        globalSearch,
            Card
        },
        data() {
            return {
                loading: false,
                selectedRoute: this.$route.name
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

    }
</script>


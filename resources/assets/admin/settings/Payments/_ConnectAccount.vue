<template>
    <div v-loading="saving" class="ff_connect_details">
        <p class="ff_connect_mode" v-html="$t('Stripe %s Mode', `<b>${ucFirst(mode)}</b>`)"></p>
        <div v-if="!connect || connect.error" class="ff_connect_require">
            <h6 class="mb-2">
                {{ $t('Connect Your Stripe Account to your website to accept Payments') }}
            </h6>
            <a :href="connect_config[mode+'_redirect']" :title="$t('Connect With Stripe')">
                <img :src="connect_config.image_url"/>
            </a>
        </div>
        <div v-else class="ff_connect_ok">
            <h6 class="mb-2">
                {{ $t('Your Stripe Account is connected') }}
            </h6>
            <h4 class="mb-2">{{ connect.display_name }}</h4>
            <p class="mb-3">{{ $t('%s - Administrator(Owner)', connect.email) }}</p>
            <el-popconfirm
                @confirm="disconnect"
                confirm-button-text='Confirm'
                cancel-button-text='No, Thanks'
                icon="el-icon-info"
                icon-color="red"
                :title="$t('Are you sure to disconnect this account?')"
            >
                <el-button size="small" slot="reference">{{$t('Disconnect')}}</el-button>
            </el-popconfirm>
        </div>

	    <div
		    v-if="connect_config.should_apply_application_fee"
		    class="mt-3"
		    :class="(!connect || connect.error) ? 'ff_connect_require': 'ff_connect_ok'"
	    >
		    <h6 class="mb-1">{{ $t('Pay-as-you-go Pricing') }}</h6>
		    <p>
			    {{ $t('1.9% platform fee per transaction + Stripe fees.') }}
			    <a target="_blank"
			       href="https://fluentforms.com/pricing/?utm_source=plugin&utm_medium=wp_install&utm_campaign=ff_upgrade&theme_style=twentytwentythree"
			    >
				    <strong>{{ $t('Upgrade to Pro') }}</strong>
			    </a>
			    {{ $t(' and activate license to remove additional fees and unlock powerful features.') }}
		    </p>
	    </div>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'ConnectAccount',
    props: ['connect', 'connect_config', 'mode'],
    data() {
        return {
            saving: false
        }
    },
    methods: {
        disconnect() {
            this.saving = true;
            FluentFormsGlobal.$post({
                action: 'fluentform_handle_payment_ajax_endpoint',
                route: 'disconnect_stripe_connection',
                mode: this.mode
            })
                .then((response) => {
                    this.$success(response.data.message);
                    this.$emit('reload_settings', true);
                })
                .fail((error) => {
                    this.$fail(error.responseJSON.data.message);
                })
                .always(() => {
                    this.saving = false;
                });
        }
    }
}
</script>
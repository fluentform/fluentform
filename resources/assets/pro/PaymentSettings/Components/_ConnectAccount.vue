<template>
    <div v-loading="saving" class="ff_connect_details">
        <p class="ff_connect_mode">{{ $t('Stripe') }} <b>{{mode}}</b> {{ $t('mode') }}</p>
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
            <h4>{{ connect.display_name }}</h4>
            <p class="mb-3">{{ connect.email }} - {{ $t('Administrator(Owner)') }}</p>
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
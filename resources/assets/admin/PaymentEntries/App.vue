<template>
    <div class="ff_payment_entries">
        <payments :settings_url="settings_url" />
    </div>
</template>
<script type="text/babel">
    import Payments from './Components/payments';

    export default {
        name: 'payment-settings',
        props: ['settings'],
        components: {
            Payments
        },
        data() {
            return {
                loading: false,
                settings_url: this.$attrs.settings_url
            }
        },
        methods: {

        },
        mounted() {

        }
    };
</script>

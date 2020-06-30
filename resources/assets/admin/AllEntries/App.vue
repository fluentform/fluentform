<template>
    <div class="ff_all_entries">
        <all-entries />
    </div>
</template>
<script type="text/babel">
    import AllEntries from './Components/AllEntries';

    export default {
        name: 'payment-settings',
        props: ['settings'],
        components: {
            AllEntries
        },
        data() {
            return {
                loading: false
            }
        },
        methods: {

        },
        mounted() {

        }
    };
</script>

<style lang="scss">
    .payments_wrapper {
        margin-top: 20px;
    }
    .payments_wrapper * {
        box-sizing: border-box;
    }
    .payment_header {
        .payment_title {
            display: inline-block;
            margin-right: 20px;
            font-size: 23px;
        }
    }

</style>

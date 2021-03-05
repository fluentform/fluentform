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



<template>
    <div class="ff_all_entries">
        <all-entries />
    </div>
</template>
<script>
    import AllEntries from './Components/AllEntries.vue';

    export default {
        name: 'AllEntriesApp',
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



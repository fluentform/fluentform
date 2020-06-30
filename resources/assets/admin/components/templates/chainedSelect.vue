<template>
    <div class="chained-Select-template">
        <withLabel :item="item">
            <select v-for="header in headers" class="header">
                <option>{{ header }}</option>
            </select>
        </withLabel>
    </div>
</template>

<script>
    import withLabel from './withLabel.vue';

    export default {
        name: 'chainedSelect',
        props: ['item', 'value'],
        components: { withLabel },
        data() {
            return {
                // ...
            };
        },
        computed: {
            headers() {
                return this.item.settings.data_source.headers;
            }
        }
    };
</script>

<style>
    .chained-Select-template .header {
        margin-right: 5px;
    }    
</style>

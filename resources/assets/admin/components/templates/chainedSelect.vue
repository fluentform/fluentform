<template>
    <div class="chained-Select-template">
        <withLabel :item="item">
            <select v-for="(header, i) in headers" class="header" :key="i">
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

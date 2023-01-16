<template>
    <div class="ff_chained_select_template">
        <withLabel :item="item">
            <el-select v-for="(header, i) in headers" :key="i">
                <option :value="header"></option>
            </el-select>
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

<template>
    <withLabel :item="item">
        <el-select v-model="item.attributes.value" :placeholder="item.attributes.placeholder" class="el-select-block">
            <el-option v-for="(label, value, i) in countries" :label="label" :value="value" :key="i"></el-option>
        </el-select>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'selectCountry',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        countries() {
            return window.FluentFormApp.countries;
        }
    },
}
</script>

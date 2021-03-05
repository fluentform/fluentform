<template>
    <withLabel :item="item">
        <select v-model="item.attributes.value"
                class="select el-input__inner">
            <option value="">{{ item.attributes.placeholder }}</option>
            <option v-for="label, value, i in countries" :value="value">{{ label }}</option>
        </select>
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

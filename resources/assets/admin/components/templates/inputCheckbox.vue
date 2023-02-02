<template>
    <withLabel :item="item">
        <div v-for="(label, value, i) in item.options" style="line-height: 25px;" :key="i">
            <input type="checkbox" :value="value" v-model="item.attributes.value"> {{ label }}
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputCheckbox',
    props: ['item'],
    components: {
        withLabel
    }
}
</script>
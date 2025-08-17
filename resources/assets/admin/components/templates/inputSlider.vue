<template>
    <withLabel :item="item">
        <el-slider
            :min="parseInt(item.attributes.min)"
            :value="parseInt(item.attributes.value)"
            :max="parseInt(item.attributes.max)"
        ></el-slider>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputSlider',
    props: ['item'],
    computed: {
        valueNumber() {
            if (parseInt(item.attributes.value)) {
                return item.attributes.value;
            }
            return 5;
        },
    },
    components: {
        withLabel,
    },
};
</script>

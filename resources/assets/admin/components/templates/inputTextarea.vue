<template>
    <withLabel :item="item">
        <el-input
            type="textarea"
            :rows="parseInt(item.attributes.rows)"
            :cols="parseInt(item.attributes.cols)"
            :value="item.attributes.value"
            :placeholder="item.attributes.placeholder"
        >
        </el-input>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputTextarea',
    props: ['item'],
    components: {
        withLabel,
    },
};
</script>

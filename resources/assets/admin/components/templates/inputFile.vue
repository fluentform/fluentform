<template>
    <withLabel :item="item">
        <el-button type="info">{{ item.settings.btn_text }}</el-button>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputFile',
    props: ['item'],
    components: {
        withLabel
    }
}
</script>
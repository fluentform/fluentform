<template>
    <withLabel :item="item">
        <el-input 
            :type="item.attributes.type"
            :value="item.attributes.value"
            :placeholder="item.attributes.placeholder">
        </el-input>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputText',
    props: ['item'],
    components: {
        withLabel
    }
}
</script>
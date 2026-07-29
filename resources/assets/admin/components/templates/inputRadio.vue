<template>
    <withLabel :item="item">
        <el-radio-group class="el-radio-horizontal" v-model="item.attributes.value">
            <el-radio v-for="(label, value, i) in item.options" :label="value" :key="i">
                {{ label }}
            </el-radio>
        </el-radio-group>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputRadio',
    props: ['item'],
    components: {
        withLabel
    }
}
</script>
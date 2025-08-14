<template>
    <el-form-item>
        <template #label>
            <el-label v-if="listItem.label" :label="listItem.label" :helpText="listItem.help_text"></el-label>
        </template>

        <el-checkbox-group class="el-fluid el-checkbox-horizontal" v-model="model">
            <el-checkbox v-for="(opt, i) in listItem.options" :value="opt.value" :key="i">{{ opt.label }}</el-checkbox>
        </el-checkbox-group>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'inputCheckbox',
    props: ['listItem', 'modelValue'],
    components: { elLabel },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
    },
    data() {
        return {
            model: this.modelValue,
        };
    },
};
</script>

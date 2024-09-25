<template>
    <el-form-item>
        <el-input v-model="model" :type="listItem.type"></el-input>
    </el-form-item>
</template>

<script>
export default {
    name: 'wpuf_inputText',
    props: ['listItem', 'modelValue'],
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

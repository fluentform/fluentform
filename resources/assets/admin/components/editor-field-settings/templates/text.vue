<template>
    <el-form-item>
        <el-input v-model="model" :type="listItem.type"></el-input>
    </el-form-item>
</template>

<script>
export default {
    name: 'wpuf_inputText',
    props: ['listItem', 'value'],
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    data() {
        return {
            model: this.value
        }
    }
}
</script>
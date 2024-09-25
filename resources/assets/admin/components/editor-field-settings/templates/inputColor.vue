<template>
    <el-form-item>
        <template #label>
            <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
        </template>

        <el-color-picker v-model="model" size="small"></el-color-picker>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'inputColor',
    props: ['listItem', 'modelValue'],
    components: {
        elLabel,
    },
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

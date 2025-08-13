<template>
    <el-form-item>
        <template #label>
            <ff-label :label="listItem.label" :helpText="listItem.help_text"></ff-label>
        </template>
        <el-input v-model="model" :type="listItem.type"></el-input>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'inputText',
    props: ['listItem', 'modelValue'],
    components: {
        'ff-label': elLabel,
    },
    data() {
        return {
            model: this.modelValue,
        };
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
    },
};
</script>

<template>
    <el-form-item>
        <template #label>
            <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
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
        elLabel,
    },
    data() {
        return {
            model: this.modelValue,
        };
    },
    watch: {
        model() {
            const sanitized = this.customSanitize(this.model);
            this.$emit('update:modelValue', sanitized);
        },
    },
    methods: {
        customSanitize(input) {
            // Remove potential event handlers
            return input.replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+)/gi, '');
        },
    }
};
</script>

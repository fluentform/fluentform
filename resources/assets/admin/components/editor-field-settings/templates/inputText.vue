<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text" :badge="listItem.badge" ></elLabel>
        <el-input v-model="model" :type="listItem.type"></el-input>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'inputText',
    props: ['listItem', 'value'],
    components: {
        elLabel
    },
    computed: {
        model: {
            get() {
                return this.value;
            },
            set(newValue) {
                const sanitized = this.customSanitize(newValue);
                this.$emit('input', sanitized);
            }
        }
    },
    methods: {
        customSanitize(input) {
            // Remove potential event handlers
            return input.replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+)/gi, '');
        },
    }
}
</script>

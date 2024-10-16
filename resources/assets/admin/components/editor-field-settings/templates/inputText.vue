<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        <el-input v-model="model" :type="listItem.type"></el-input>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'
import DOMPurify from "dompurify";

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
                const sanitized = newValue.replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+)/gi, '');
                this.$emit('input', DOMPurify.sanitize(sanitized));
            }
        }
    },
}
</script>
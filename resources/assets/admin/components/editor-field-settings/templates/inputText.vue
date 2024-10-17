<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
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
        allowedTags() {
            return window.FluentFormApp.allowed_tags || [];
        },
        allowedAttrs() {
            return window.FluentFormApp.allowed_attrs || [];
        },
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
            let sanitized = input.replace(/\s*on\w+\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+)/gi, '');

            // Process tags
            sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
                if (this.allowedTags.includes(tag.toLowerCase())) {
                    return this.filterAttributes(match);
                }
                return match.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            });

            return sanitized;
        },
        filterAttributes(tag) {
            return tag.replace(/(\s+\w+\s*=\s*("[^"]*"|'[^']*'|[^"'\s>]+))/gi, (attrMatch, attr) => {
                const attrName = attr.split('=')[0].trim().toLowerCase();
                return this.allowedAttrs.includes(attrName) ? attrMatch : '';
            });
        }
    }
}
</script>
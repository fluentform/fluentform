<template>
    <el-form-item>
        <template #label>
            {{ listItem.label }}
            <el-tooltip
                v-if="listItem.help_text"
                popper-class="ff_tooltip_wrap"
                :content="listItem.help_text"
                placement="top"
            >
                <i class="tooltip-icon el-icon-info"></i>
            </el-tooltip>
        </template>
        <el-input
            :disabled="listItem.disabled"
            :class="listItem.css_class"
            v-model="model"
            :rows="listItem.rows"
            :cols="listItem.cols"
            type="textarea"
            @input="afterSanitizeInput"
        ></el-input>
        <p v-if="listItem.inline_help_text" v-html="listItem.inline_help_text"></p>
    </el-form-item>
</template>

<script type="text/babel">
import DOMPurify from 'dompurify';

export default {
    name: 'inputTextarea',
    props: ['listItem', 'modelValue'],
    watch: {
        model() {
            this.$emit('update:modelValue', DOMPurify.sanitize(this.model));
        },
    },
    data() {
        return {
            model: this.modelValue,
        };
    },
    methods: {
        afterSanitizeInput(val) {
            DOMPurify.addHook('afterSanitizeAttributes', function (node) {
                if (/target=['"]_blank['"]/.test(val)) {
                    node.setAttribute('target', '_blank');
                    node.setAttribute('rel', 'noopener');
                } else {
                    node.removeAttribute('target');
                    node.removeAttribute('rel');
                }
            });
        },
    },
};
</script>

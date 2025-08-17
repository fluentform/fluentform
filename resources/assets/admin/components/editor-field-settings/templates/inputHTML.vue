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
        <wp-editor :height="180" v-model="model" />
        <template v-if="listItem.hide_extra !== 'yes'">
            <template v-if="has_payment">
                <p>{{ $t("You can use smart code for payment specific dynamic data:") }}</p>
                <ul style="list-style: disc;margin-left: 24px;margin-top: 0px;">
                    <li v-html="$t('%s: to show the cart summary', `<code>{dynamic.payment_summary}</code>`)"></li>
                    <li v-html="$t('%s: to display total payment amount', `<code>{payment_total}</code>`)"></li>
                </ul>
            </template>
            <div>
                <p>{{ $t("Dynamic SmartCodes") }}</p>
                <ul style="list-style: disc;margin-left: 24px;margin-top: 0px;">
                    <li v-html="$t('%s: to show data from any input', `<code>{dynamic.YOUR_INPUT_NAME}</code>`)"></li>
                </ul>
            </div>
        </template>
        <p v-if="listItem.inline_help_text" v-html="listItem.inline_help_text"></p>
    </el-form-item>
</template>

<script type="text/babel">
import WpEditor from "../../../../common/_wp_editor.vue";

export default {
    name: "inputTextarea",
    props: ["listItem", "modelValue"],
    components: {
        WpEditor
    },
    watch: {
        model() {
            this.$emit("update:modelValue", this.model);
        }
    },
    data() {
        return {
            model: this.modelValue,
            has_payment: window.FluentFormApp.form.has_payment === "1" || window.FluentFormApp.form.has_payment === 1
        };
    },
    computed: {
        isConversationalForm() {
            return !!window.FluentFormApp.is_conversion_form;
        }
    }
};
</script>

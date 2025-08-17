<template>
    <div class="ff-input-yes-no-checkbox-wrap">
        <el-checkbox false-value="no" true-value="yes" v-model="model">
            <span class="checkbox-label">{{ listItem.label }}</span>
            <el-tooltip v-if="listItem.help_text" placement="bottom" popper-class="ff_tooltip_wrap">
                <template #content>{{listItem.help_text}}</template>
                <i class="ff-icon ff-icon-info-filled"></i>
            </el-tooltip>
        </el-checkbox>
    </div>
</template>

<script>
export default {
    name: 'inputYesNoCheckBox',
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

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
        <el-radio-group v-model="model">
            <el-radio v-for="(opt, i) in listItem.options" :value="opt.value" :key="i">{{ opt.label }}</el-radio>
        </el-radio-group>
    </el-form-item>
</template>

<script>
export default {
    name: 'inputRadio',
    props: ['listItem', 'modelValue'],
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

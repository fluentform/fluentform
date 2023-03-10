<template>
    <el-form-item>
        <div slot="label">
            {{ listItem.label }}
            <el-tooltip v-if="listItem.help_text" class="ff_tooltip_wrap" :content="listItem.help_text" placement="top">
            <i class="tooltip-icon el-icon-info"></i>
        </el-tooltip>
        </div>
        <el-radio-group v-model="model">
            <el-radio v-for="(opt, i) in listItem.options" :label="opt.value" :key="i">{{ opt.label }}</el-radio>
        </el-radio-group>
    </el-form-item>
</template>

<script>
export default {
    name: 'inputRadio',
    props: ['listItem', 'value'],
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    data() {
        return {
            model: this.value
        }
    }
}
</script>
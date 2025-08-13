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
                <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
            </el-tooltip>
        </template>
        <el-radio-group v-model="model">
            <el-radio v-for="(opt, i) in listItem.options" :value="opt.value" :key="i">{{ opt.label }}</el-radio>
        </el-radio-group>
    </el-form-item>
</template>

<script>
import { InfoFilled } from '@element-plus/icons-vue';
import { ElIcon } from 'element-plus';

export default {
    name: 'inputRadio',
    components: {
        InfoFilled,
        ElIcon,
    },
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

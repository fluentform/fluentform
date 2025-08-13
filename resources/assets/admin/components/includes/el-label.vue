<template>
    <span>
        {{ $t(label) }}
        <el-tooltip v-if="helpText" popper-class="ff_tooltip_wrap" placement="top">
            <template #content>
                <div v-html="helpText"></div>
            </template>
            <el-icon class="tooltip-icon"><InfoFilled /></el-icon>
        </el-tooltip>
    </span>
</template>

<script>
import { InfoFilled } from '@element-plus/icons-vue';
import { ElIcon } from 'element-plus';

export default {
    name: 'ff-label',
    components: {
        InfoFilled,
        ElIcon,
    },
    props: ['label', 'helpText', 'icon'],
};
</script>

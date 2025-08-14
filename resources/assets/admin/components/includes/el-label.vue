<template>
    <span>
        {{ $t(label) }}
        <el-tooltip v-if="helpText" popper-class="ff_tooltip_wrap" placement="top">
            <template #content>
                <div v-html="helpText"></div>
            </template>
            <i class="tooltip-icon" :class="iconClass"></i>
        </el-tooltip>
    </span>
</template>

<script>
export default {
    name: 'el-label-slot',
    props: ['label', 'helpText', 'icon'],
    computed: {
        iconClass() {
            return `el-icon-${this.icon || 'info'}`;
        },
    },
};
</script>

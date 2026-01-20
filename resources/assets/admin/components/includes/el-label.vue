<template>
    <span>
        {{ $t(label) }}
        <span v-if="showBadge" class="ff_badge is-solid ff_badge_paid">{{ badge }}</span>
        <el-tooltip v-if="helpText" popper-class="ff_tooltip_wrap" placement="top">
            <div slot="content" v-html="helpText"></div>
            <i class="tooltip-icon" :class="iconClass"></i>
        </el-tooltip>
    </span>
</template>

<script>
export default {
    name: 'el-label-slot',
    props: ['label', 'helpText', 'icon', 'badge', 'badgeUntil'],
    computed: {
        iconClass() {
            return `el-icon-${this.icon || 'info'}`;
        },
        showBadge() {
            if (!this.badge) return false;
            return  true
        }
    },
    methods: {
        compareVersions(v1, v2) {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const p1 = parts1[i] || 0;
                const p2 = parts2[i] || 0;
                if (p1 < p2) return -1;
                if (p1 > p2) return 1;
            }
            return 0;
        }
    }
}
</script>

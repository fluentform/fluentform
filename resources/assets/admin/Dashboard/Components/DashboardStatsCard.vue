<template>
    <div class="dashboard-stats-card">
        <div class="stats-card-content">
            <div class="stats-icon" :style="{ backgroundColor: color + '20', color: color }">
                <i :class="icon"></i>
            </div>
            <div class="stats-info">
                <div class="stats-title">{{ title }}</div>
                <div class="stats-value" v-if="!loading">{{ value }}</div>
                <el-skeleton v-else animated>
                    <template slot="template">
                        <el-skeleton-item variant="text" style="width: 60px; height: 24px;" />
                    </template>
                </el-skeleton>
                <div class="stats-change" v-if="!loading && change !== 0">
                    <span :class="['change-indicator', changeType]">
                        <i :class="changeIcon"></i>
                        {{ Math.abs(change) }}%
                    </span>
                    <span class="change-text">{{ changeText }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'DashboardStatsCard',
    props: {
        title: {
            type: String,
            required: true
        },
        value: {
            type: [String, Number],
            required: true
        },
        change: {
            type: Number,
            default: 0
        },
        changeType: {
            type: String,
            default: 'neutral',
            validator: value => ['increase', 'decrease', 'neutral'].includes(value)
        },
        icon: {
            type: String,
            required: true
        },
        color: {
            type: String,
            default: '#409EFF'
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        changeIcon() {
            switch (this.changeType) {
                case 'increase':
                    return 'el-icon-arrow-up';
                case 'decrease':
                    return 'el-icon-arrow-down';
                default:
                    return 'el-icon-minus';
            }
        },
        changeText() {
            switch (this.changeType) {
                case 'increase':
                    return this.$t('vs last period');
                case 'decrease':
                    return this.$t('vs last period');
                default:
                    return this.$t('no change');
            }
        }
    }
};
</script>



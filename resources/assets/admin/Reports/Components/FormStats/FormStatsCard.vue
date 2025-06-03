<template>
    <div class="stats-card">
        <div class="stats-icon" :style="{ backgroundColor: color + '20', color: color }">
            <i :class="icon"></i>
        </div>
        <div class="stats-content">
            <div class="stats-title">{{ title }}</div>
            <div class="stats-value">{{ formattedValue }}</div>
            <div class="stats-change" :class="changeClass" v-if="change">
                <i :class="changeIcon"></i>
                {{ change }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'FormStatsCard',
    props: {
        title: {
            type: String,
            required: true
        },
        value: {
            required: true
        },
        change: {
            type: String,
            default: ''
        },
        changeType: {
            type: String,
            default: '',
            validator: value => ['up', 'down', ''].includes(value)
        },
        icon: {
            type: String,
            default: 'el-icon-data-line'
        },
        color: {
            type: String,
            default: '#409EFF'
        }
    },
    computed: {
        formattedValue() {
            if (typeof this.value === 'number') {
                return this.value.toLocaleString();
            }
            return this.value;
        },
        changeClass() {
            return {
                'stats-change--up': this.changeType === 'up',
                'stats-change--down': this.changeType === 'down',
                'stats-change--neutral': this.changeType === ''
            };
        },
        changeIcon() {
            if (this.changeType === 'up') return 'el-icon-arrow-up';
            if (this.changeType === 'down') return 'el-icon-arrow-down';
            return 'el-icon-minus';
        }
    }
};
</script>



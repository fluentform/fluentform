<template>
    <el-skeleton v-if="value === null || value === undefined || loading" animated>
        <template #template>
            <div class="stats-card" :class="[type, cardClass]">
                <div class="stats-icon" style="background-color: #f5f5f5;">
                    <el-skeleton-item variant="circle" :style="{ width: type === 'overview' ? '30px' : '20px', height: type === 'overview' ? '30px' : '20px' }" />
                </div>
                <div class="stats-content">
                    <div class="stats-title">
                        <el-skeleton-item variant="text" style="width: 65%; height: 14px;" />
                    </div>
                    <div class="stats-value" style="margin: 4px 0;">
                        <el-skeleton-item variant="text" style="width: 60px; height: 24px;" />
                    </div>
                </div>
            </div>
        </template>
    </el-skeleton>
  <div class="stats-card" :class="[type, cardClass]" v-else>
        <div class="stats-icon" :style="{ backgroundColor: bgColor }">
            <span v-if="icon" v-html="icon"></span>
        </div>
        <div class="stats-content">
            <div class="stats-title">
                {{ title }}
                <el-tooltip v-if="tooltip" :content="tooltip" placement="top">
                    <i class="el-icon-info"></i>
                </el-tooltip>
            </div>
            <div class="stats-value"><span v-html="formattedValue"></span></div>
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
            validator: value => ['up', 'down', '', 'neutral'].includes(value)
        },
        icon: {
            type: String,
        },
        bgColor: {
            type: String,
            default: '#F2F5F8'
        },
        cardClass: {
            type: String,
            default: ''
        },
        type: {
              type: String,
              default: ''
        },
        loading: {
            type: Boolean,
            default: false
        },
        tooltip: {
            type: String,
            default: ''
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
                'stats-change--neutral': this.changeType === '' || this.changeType === 'neutral'
            };
        },
        changeIcon() {
            if (this.changeType === 'up') return 'el-icon-top';
            if (this.changeType === 'down') return 'el-icon-bottom';
            return 'el-icon-minus';
        }
    }
};
</script>



<template>
    <el-skeleton v-if="value === null || value === undefined || loading" animated>
        <template #template>
            <div class="stats-card" :class="type">
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
    <div class="stats-card" :class="type" v-else>
        <div class="stats-icon" :style="{ backgroundColor: color + '20', color: color }">
            <!-- Handle both Element UI icon classes and HTML/SVG content -->
            <i v-if="icon && icon.startsWith('el-icon-')" :class="icon"></i>
            <span v-else-if="icon" v-html="icon"></span>
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
	            <svg v-if="changeType === 'up'" width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6668 1.66602L9.42108 6.91177C9.15707 7.17578 9.02506 7.30779 8.87284 7.35725C8.73895 7.40075 8.59471 7.40075 8.46082 7.35725C8.3086 7.30779 8.17659 7.17578 7.91258 6.91177L6.08774 5.08693C5.82373 4.82292 5.69173 4.69091 5.53951 4.64145C5.40561 4.59795 5.26138 4.59795 5.12748 4.64145C4.97527 4.69091 4.84326 4.82292 4.57925 5.08693L1.3335 8.33268M14.6668 1.66602H10.0002M14.6668 1.66602V6.33268" stroke="#23A682" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
	            <svg v-else-if="changeType === 'down'" width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.6666 8.33268L9.42083 3.08693C9.15682 2.82292 9.02482 2.69091 8.8726 2.64145C8.7387 2.59795 8.59447 2.59795 8.46057 2.64145C8.30836 2.69091 8.17635 2.82292 7.91234 3.08693L6.0875 4.91177C5.82349 5.17578 5.69148 5.30779 5.53926 5.35724C5.40537 5.40075 5.26114 5.40075 5.12724 5.35724C4.97502 5.30779 4.84302 5.17578 4.579 4.91177L1.33325 1.66602M14.6666 8.33268H9.99992M14.6666 8.33268V3.66602" stroke="#F04438" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <i v-else :class="changeIcon"></i>
                {{ change }}
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



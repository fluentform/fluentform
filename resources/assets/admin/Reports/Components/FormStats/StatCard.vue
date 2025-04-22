<template>
    <div class="stat-card">
        <card>
            <card-body class="stat-info">
                <div class="stat-icon">
                    <i :class="getIconClass()"></i>
                </div>
                <div class="stat-details">
                    <p class="stat-title">{{ title }}</p>
                    <div class="stat-value">
                        <span class="value">{{ value }}</span>
                        <span v-if="change" :class="getChangeClass()">
                            <i :class="getChangeIconClass()"></i> {{ change }}
                        </span>
                    </div>
                </div>
            </card-body>
        </card>
    </div>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
export default {
    name: 'StatCard',
    components: {
        Card,
        CardBody
    },
    props: {
        title: String,
        value: [String, Number],
        change: String,
        changeType: String,
        icon: {
            type: String,
            default: 'donut-chart'
        }
    },
    methods: {
        getIconClass() {
            return `ff-icon ff-icon-${this.icon}`;
        },
        getChangeClass() {
            if (!this.change) return '';

            if (this.change.startsWith('+') || this.change === '0%') {
                return 'change-value up';
            } else if (this.change.startsWith('-')) {
                return 'change-value down';
            }

            return `change-value ${this.changeType || 'up'}`;
        },
        getChangeIconClass() {
            if (!this.change) return '';

            if (this.change.startsWith('+') || this.change === '0%') {
                return 'el-icon-caret-top';
            } else if (this.change.startsWith('-')) {
                return 'el-icon-caret-bottom';
            }

            return this.changeType === 'down' ? 'el-icon-caret-bottom' : 'el-icon-caret-top';
        }
    }
};
</script>
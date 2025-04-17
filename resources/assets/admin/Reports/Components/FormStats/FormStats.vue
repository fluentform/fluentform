<template>
    <div class="form-stats">
        <card>
            <card-head class="d-flex justify-between">
                <h3>Form Stats</h3>
                <el-select class="form-stats-selectable" v-model="statsRange" @change="handleStatsRangeChange">
                    <el-option label="Today" value="today"></el-option>
                    <el-option label="Last Week" value="week"></el-option>
                    <el-option label="Last Month" value="month"></el-option>
                    <el-option label="Last Year" value="year"></el-option>
                </el-select>
            </card-head>
            <card-body>
                <stat-card
                    class="mb-3"
                    title="Total Submissions"
                    :value="stats?.total_submissions?.value || 0"
                    icon="user"
                    :change="stats?.total_submissions?.change"
                    :change-type="stats?.total_submissions?.change_type"
                />
                <stat-card
                    class="mb-3"
                    title="Spam Submissions"
                    :value="stats?.spam_submissions?.value || 0"
                    icon="spam"
                    :change="stats?.spam_submissions?.change"
                    :change-type="stats?.spam_submissions?.change_type"
                />
                <stat-card
                    class="mb-3"
                    title="Unread Submissions"
                    :value="stats?.unread_submissions?.value || 0"
                    icon="unread"
                />
                <stat-card
                    class="mb-3"
                    title="Read Submissions"
                    :value="stats?.read_submissions?.value || 0"
                    icon="read"
                />
                <stat-card
                    class="mb-3"
                    title="Active Integrations"
                    :value="stats?.active_integrations?.value || 0"
                    icon="integration"
                />
            </card-body>
        </card>
    </div>
</template>

<script>
import StatCard from './StatCard.vue';
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";
export default {
    name: 'FormStats',
    props: ['form_stats'],
    emits: ['stats-range-change'],
    components: {
        StatCard,
        Card,
        CardBody,
        CardHead,
    },
    data() {
        return {
            statsRange: "month",
            stats: {}
        };
    },
    methods: {
        handleStatsRangeChange() {
            this.$emit('stats-range-change', this.statsRange);
        }
    },
    watch: {
        form_stats: {
            handler(newStats) {
                if (newStats) {
                    this.stats = newStats;
                    if (newStats.period && newStats.period !== this.statsRange) {
                        this.statsRange = newStats.period;
                    }
                }
            },
            immediate: true,
            deep: true
        }
    }
};
</script>
<style scoped>
.form-stats-selectable {
    width: 120px;
}
</style>
<template>
    <div class="form-stats">
        <card>
            <card-head class="d-flex justify-between">
                <h3>Form Stats</h3>
                <el-select class="form-stats-selectable" v-model="selectedRange">
                    <el-option label="Today" value="today"></el-option>
                    <el-option label="This Week" value="week"></el-option>
                    <el-option label="This Month" value="month"></el-option>
                </el-select>
            </card-head>
            <card-body>
                <stat-card class="mb-3" title="Total Submissions" :value="450" icon="user" change="+25%" change-type="up" />
                <stat-card class="mb-3" title="Active Integrations" :value="6" icon="integration" change="-25%" change-type="down" />
                <stat-card class="mb-3" title="Unread Submissions" :value="138" icon="unread" />
                <stat-card class="mb-3" title="Read Submissions" :value="312" icon="read" />
                <stat-card class="mb-3" title="Total Spam Submissions" :value="12" icon="read" />
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
    components: {
        StatCard,
        Card,
        CardBody,
        CardHead,
    },
    data() {
        return {
            selectedRange: "week",
        };
    },
};
</script>
<style scoped>
.form-stats-selectable {
    width: 120px;
}
</style>
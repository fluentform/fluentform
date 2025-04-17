<template>
    <div class="stat-card">
        <card>
            <card-body class="stat-info">
                <div class="stat-icon">
                    <i class="ff-icon ff-icon-donut-chart"></i>
                </div>
                <div class="stat-details">
                    <p class="stat-title">{{ title }}</p>
                    <div class="stat-value">
                        <span class="value">{{ value }}</span>
                        <span v-if="change" :class="changeType">{{ change }}</span>
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
        changeType: String
    }
};
</script>
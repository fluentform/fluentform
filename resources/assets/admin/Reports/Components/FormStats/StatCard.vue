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

<style scoped>
.stat-card {
    border: 1px solid #E1E4EA;
    border-radius: 8px;
}

.stat-icon {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 50px;
    background: #f5f5f5;
    border-radius: 8px;
    margin-right: 16px;
}

.stat-info {
    display: flex;
}

.stat-title {
    font-size: 14px;
    color: #555;
    margin-bottom: 4px;
}

.stat-value {
    font-size: 18px;
    font-weight: bold;
    display: flex;
    align-items: center;
}

.value {
    margin-right: 8px;
}

.positive {
    color: green;
}

.negative {
    color: red;
}

.stat-card .ff_card {
    padding: 15px;
}

</style>

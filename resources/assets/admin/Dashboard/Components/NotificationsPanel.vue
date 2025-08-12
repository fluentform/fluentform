<template>
    <card>
        <card-head>
            <h4>{{ $t('Notifications') }}</h4>
        </card-head>

        <card-body>
            <div v-if="loading" class="loading-state">
                <el-skeleton animated>
                    <template slot="template">
                        <div v-for="i in 3" :key="i" class="notification-skeleton">
                            <el-skeleton-item variant="circle" style="width: 40px; height: 40px;" />
                            <div style="flex: 1; margin-left: 12px;">
                                <el-skeleton-item variant="text" style="width: 60%; margin-bottom: 8px;" />
                                <el-skeleton-item variant="text" style="width: 80%;" />
                            </div>
                        </div>
                    </template>
                </el-skeleton>
            </div>
            
            <div v-else-if="notifications && notifications.length > 0" class="notifications-list">
                <div
                    v-for="notification in notifications"
                    :key="notification.id"
                    class="notification-item"
                >
                    <div class="notification-status">
                        <div class="status-dot"></div>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">{{ notification.title }}</div>
                        <div class="notification-time">{{ notification.time }}</div>
                        <div class="notification-message">{{ notification.message }}</div>
                    </div>
                </div>
            </div>
            
            <div v-else class="empty-state">
                <i class="el-icon-bell empty-icon"></i>
                <p class="empty-text">{{ $t('No notifications') }}</p>
            </div>

        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'NotificationsPanel',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: {
        notifications: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        // Methods can be added here if needed in the future
    }
};
</script>

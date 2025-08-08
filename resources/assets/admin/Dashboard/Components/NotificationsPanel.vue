<template>
    <div class="notifications-panel">
        <div class="panel-header">
            <h3 class="panel-title">{{ $t('Notifications') }}</h3>
            <el-badge :value="unreadCount" :hidden="unreadCount === 0">
                <i class="el-icon-bell"></i>
            </el-badge>
        </div>
        
        <div class="panel-content">
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
                    :class="{ 'unread': !notification.read }"
                >
                    <div class="notification-icon">
                        <i :class="getNotificationIcon(notification.type)"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">{{ notification.title }}</div>
                        <div class="notification-message">{{ notification.message }}</div>
                        <div class="notification-time">{{ notification.time }}</div>
                    </div>
                    <div v-if="!notification.read" class="unread-indicator"></div>
                </div>
            </div>
            
            <div v-else class="empty-state">
                <i class="el-icon-bell empty-icon"></i>
                <p class="empty-text">{{ $t('No notifications') }}</p>
            </div>
            
            <div class="panel-footer" v-if="notifications && notifications.length > 0">
                <el-button 
                    type="primary" 
                    size="small" 
                    style="width: 100%;"
                    @click="sendFeedback"
                >
                    {{ $t('Send feedback') }}
                </el-button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'NotificationsPanel',
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
    computed: {
        unreadCount() {
            if (!this.notifications) return 0;
            return this.notifications.filter(n => !n.read).length;
        }
    },
    methods: {
        getNotificationIcon(type) {
            const iconMap = {
                'database_update': 'el-icon-refresh',
                'system_alert': 'el-icon-warning',
                'form_submission': 'el-icon-document',
                'integration_error': 'el-icon-connection',
                'payment_received': 'el-icon-money'
            };
            return iconMap[type] || 'el-icon-info';
        },
        
        sendFeedback() {
            // Open feedback form or modal
            this.$message.info(this.$t('Feedback feature coming soon!'));
        }
    }
};
</script>



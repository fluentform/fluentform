<template>
    <div class="api-logs-table">
        <div class="table-header">
            <h3 class="table-title">{{ $t('Api Logs') }}</h3>
            <el-button 
                type="text" 
                size="small"
                @click="viewAllLogs"
            >
                {{ $t('View all api logs') }}
            </el-button>
        </div>
        
        <div class="table-content">
            <el-table
                :data="logs"
                v-loading="loading"
                style="width: 100%"
                :show-header="true"
                size="medium"
            >
                <el-table-column
                    prop="id"
                    :label="$t('ID')"
                    width="60"
                >
                    <template slot-scope="scope">
                        <span class="log-id">{{ scope.row.id }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column
                    prop="submission_id"
                    :label="$t('Submission ID')"
                    width="100"
                >
                    <template slot-scope="scope">
                        <span class="submission-id">#{{ scope.row.submission_id }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column
                    prop="form_id"
                    :label="$t('Form')"
                    width="80"
                >
                    <template slot-scope="scope">
                        <span class="form-id">{{ scope.row.form_id }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column
                    prop="component"
                    :label="$t('Component')"
                    min-width="120"
                >
                    <template slot-scope="scope">
                        <span class="component-name">{{ scope.row.component }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column
                    prop="expire_date"
                    :label="$t('Expire Date')"
                    min-width="100"
                >
                    <template slot-scope="scope">
                        <span class="expire-date">{{ formatDate(scope.row.expire_date) }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column
                    prop="status"
                    :label="$t('Status')"
                    width="100"
                >
                    <template slot-scope="scope">
                        <el-tag 
                            :type="getStatusType(scope.row.status)"
                            size="small"
                        >
                            {{ getStatusLabel(scope.row.status) }}
                        </el-tag>
                    </template>
                </el-table-column>
            </el-table>
            
            <div v-if="!loading && (!logs || logs.length === 0)" class="empty-state">
                <i class="el-icon-connection empty-icon"></i>
                <p class="empty-text">{{ $t('No API logs found') }}</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'ApiLogsTable',
    props: {
        logs: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        },
        
        getStatusType(status) {
            const statusMap = {
                'success': 'success',
                'failed': 'danger',
                'pending': 'warning',
                'processing': 'info'
            };
            return statusMap[status] || 'info';
        },
        
        getStatusLabel(status) {
            const labelMap = {
                'success': this.$t('Success'),
                'failed': this.$t('Failed'),
                'pending': this.$t('Pending'),
                'processing': this.$t('Processing')
            };
            return labelMap[status] || status;
        },
        
        viewAllLogs() {
            // Navigate to logs page
            window.location.href = admin_url + 'admin.php?page=fluent_forms_logs';
        }
    }
};
</script>



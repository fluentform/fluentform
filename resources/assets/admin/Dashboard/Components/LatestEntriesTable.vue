<template>
    <div class="latest-entries-table">
        <div class="table-header">
            <h3 class="table-title">{{ $t('Latest Entries') }}</h3>
            <el-button 
                type="text" 
                size="small"
                @click="viewAllEntries"
            >
                {{ $t('View all entries') }}
            </el-button>
        </div>
        
        <div class="table-content">
            <el-table
                :data="entries"
                v-loading="loading"
                style="width: 100%"
                :show-header="true"
                size="medium"
            >
                <el-table-column
                    prop="form_title"
                    :label="$t('Form')"
                    min-width="150"
                >
                    <template slot-scope="scope">
                        <div class="form-info">
                            <span class="form-title">{{ scope.row.form_title }}</span>
                        </div>
                    </template>
                </el-table-column>
                
                <el-table-column
                    prop="name"
                    :label="$t('Name')"
                    min-width="120"
                >
                    <template slot-scope="scope">
                        <span class="entry-name">{{ scope.row.name || $t('Anonymous') }}</span>
                    </template>
                </el-table-column>
                
                <el-table-column
                    prop="submitted_at"
                    :label="$t('Submitted')"
                    min-width="100"
                >
                    <template slot-scope="scope">
                        <span class="submission-date">{{ formatDate(scope.row.submitted_at) }}</span>
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
            
            <div v-if="!loading && (!entries || entries.length === 0)" class="empty-state">
                <i class="el-icon-document-copy empty-icon"></i>
                <p class="empty-text">{{ $t('No entries found') }}</p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'LatestEntriesTable',
    props: {
        entries: {
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
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                return this.$t('1 day ago');
            } else if (diffDays < 7) {
                return this.$t('{days} days ago', { days: diffDays });
            } else {
                return date.toLocaleDateString();
            }
        },
        
        getStatusType(status) {
            const statusMap = {
                'read': 'success',
                'unread': 'info',
                'approved': 'success',
                'unapproved': 'warning',
                'declined': 'danger',
                'confirmed': 'success',
                'unconfirmed': 'warning'
            };
            return statusMap[status] || 'info';
        },
        
        getStatusLabel(status) {
            const labelMap = {
                'read': this.$t('Read'),
                'unread': this.$t('Unread'),
                'approved': this.$t('Approved'),
                'unapproved': this.$t('Pending'),
                'declined': this.$t('Declined'),
                'confirmed': this.$t('Confirmed'),
                'unconfirmed': this.$t('Unconfirmed')
            };
            return labelMap[status] || status;
        },
        
        viewAllEntries() {
            // Navigate to all entries page
            window.location.href = admin_url + 'admin.php?page=fluent_forms_all_entries';
        }
    }
};
</script>



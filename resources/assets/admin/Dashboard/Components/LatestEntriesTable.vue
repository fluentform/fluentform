<template>
    <card>
        <card-head>
            <h4>{{ $t('Latest Entries') }}</h4>
            <el-button
                type="text"
                size="small"
                @click="viewAllEntries"
            >
                {{ $t('View all entries') }}
            </el-button>
        </card-head>

        <card-body>
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
        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'LatestEntriesTable',
    components: {
        Card,
        CardBody,
        CardHead
    },
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

            // Handle case where dateString might still be an object
            let dateValue = dateString;
            if (typeof dateString === 'object' && dateString !== null) {
                if (dateString.date) {
                    dateValue = dateString.date;
                } else {
                    // Convert object to string as fallback
                    dateValue = dateString.toString();
                }
            }

            const date = new Date(dateValue);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
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



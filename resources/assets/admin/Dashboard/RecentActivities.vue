<template>
    <div class="dashboard-card dashboard-card-table">
        <div class="card_header">
            <h6 style="margin-top: 0;">{{ $t('Recent Activities') }}</h6>
        </div>
        <div class="ff_card_body " v-if="Object.entries(activities).length > 0">
            <el-table
                    :data="activities"
                    style="width: 100%"
                    border
                    class="dashboard-table entry_submission_log"
            >
                <el-table-column type="expand">
                    <template slot-scope="props">
                        <p v-html="props.row.description"></p>
                    </template>
                </el-table-column>
                <el-table-column
                        width="120px"
                        :label="$t('Source ID')">
                    <template slot-scope="props">
                        <a v-if="props.row.submission_url"
                           :href="props.row.submission_url">#{{ props.row.source_id }}</a>
                        <span v-else>n/a</span>
                    </template>
                </el-table-column>
                <el-table-column
                        :label="$t('Form/Source')">
                    <template slot-scope="props">
                        <span v-if="props.row.form_title">{{ props.row.form_title }}</span>
                        <span v-else>{{ $t('General Log') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                        prop="title"
                        :label="$t('Title')">
                </el-table-column>
                <el-table-column
                        prop="status"
                        :label="$t('Status')"
                        width="100">
                    <template slot-scope="props">
                        <span style="font-size: 12px;" class="ff_tag"
                              :class="'log_status_'+props.row.status">{{ props.row.status }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                        width="140"
                        :label="$t('Component')">
                    <template slot-scope="props">
                        <div style="text-transform: capitalize">{{ props.row.component }}</div>
                    </template>
                </el-table-column>
                <el-table-column
                        prop="human_date"
                        :label="$t('Time')"
                        width="120">
                </el-table-column>


            </el-table>

        </div>
        <div v-else>
            {{ $t('No Recent Activities') }}
        </div>
    </div>
</template>
<script>
    export default {
        name: 'RecentActivities',
        props: ['activities'],

    }
</script>

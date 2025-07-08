<template>
    <card>
        <card-head>
            <div class="submission-analysis-header">
                <div class="title-section">
                    <h3>Submission Analysis : {{ groupByOptions[selectedGroupBy] }}</h3>
                </div>
                <div class="controls-section">
                    <div class="date-range-display">
                        <span class="date-range-label">Viewing Period:</span>
                        <span class="date-range-dates">{{ formatCurrentDateRange() }}</span>
                    </div>

                    <el-select
                        v-model="selectedGroupBy"
                        placeholder="Group By"
                        size="small"
                        @change="handleGroupByChange"
                        style="width: 180px; margin-right: 12px;"
                    >
                        <el-option
                            v-for="(label, value) in groupByOptions"
                            :key="value"
                            :label="label"
                            :value="value"
                        />
                    </el-select>

                    <el-select
                        v-if="selectedGroupBy !== 'forms'"
                        v-model="selectedFormId"
                        placeholder="Select Form"
                        size="small"
                        clearable
                        filterable
                        @change="handleFormChange"
                        style="width: 200px;"
                    >
                        <el-option label="All Forms" :value="null" />
                        <el-option
                            v-for="form in formsList"
                            :key="form.id"
                            :label="`#${form.id} - ${form.title}`"
                            :value="form.id"
                        />
                    </el-select>
                </div>
            </div>
        </card-head>

        <card-body>
            <div v-if="loading" class="loading-state">
                <el-skeleton :rows="5" animated />
            </div>

            <div v-else-if="submissionData.length === 0" class="no-data-state">
                <div class="no-data-icon">📊</div>
                <h4>No Submission Data Available</h4>
                <p>No submission data found for the selected criteria and date range.</p>
            </div>

            <div v-else class="submission-table-container">
                <el-table
                    :data="submissionData"
                    style="width: 100%"
                    :default-sort="{ prop: 'total_submissions', order: 'descending' }"
                    stripe
                >
                    <!-- Dynamic columns based on group by selection -->
                    <el-table-column
                        v-if="selectedGroupBy === 'forms'"
                        prop="form_title"
                        label="Form"
                        min-width="200"
                        sortable
                    >
                        <template #default="{ row }">
                            <div class="form-info">
                                <span class="form-title">{{ row.form_title }}</span>
                                <span class="form-id">#{{ row.form_id }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column
                        v-if="selectedGroupBy === 'submission_source'"
                        prop="source_url"
                        label="Submission Source"
                        min-width="250"
                        sortable
                    >
                        <template #default="{ row }">
                            <div class="source-info">
                                <span class="source-url" :title="row.source_url">
                                    {{ formatSourceUrl(row.source_url) }}
                                </span>
                                <span class="source-count">{{ row.total_submissions }} submissions</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column
                        v-if="selectedGroupBy === 'email'"
                        prop="email"
                        label="Email"
                        min-width="200"
                        sortable
                    >
                        <template #default="{ row }">
                            <div class="email-info">
                                <span class="email-address">{{ row.email || 'No Email' }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column
                        v-if="selectedGroupBy === 'country'"
                        prop="country"
                        label="Country"
                        min-width="150"
                        sortable
                    >
                        <template #default="{ row }">
                            <div class="country-info">
                                <span class="country-name">{{ row.country || 'Unknown' }}</span>
                                <span class="country-flag" v-if="row.country">{{ getCountryFlag(row.country) }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column
                        v-if="selectedGroupBy === 'submission_date'"
                        prop="submission_date"
                        label="Date"
                        min-width="120"
                        sortable
                    >
                        <template #default="{ row }">
                            <div class="date-info">
                                <span class="date-value">{{ formatSubmissionDate(row.submission_date) }}</span>
                            </div>
                        </template>
                    </el-table-column>

                    <el-table-column
                        prop="total_submissions"
                        label="Total Submissions"
                        min-width="140"
                        sortable
                        align="right"
                    >
                        <template #default="{ row }">
                            <span class="count-value total">{{ formatNumber(row.total_submissions) }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column
                        prop="read_submissions"
                        label="Read"
                        min-width="100"
                        sortable
                        align="right"
                    >
                        <template #default="{ row }">
                            <span class="count-value read">{{ formatNumber(row.read_submissions) }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column
                        prop="unread_submissions"
                        label="Unread"
                        min-width="100"
                        sortable
                        align="right"
                    >
                        <template #default="{ row }">
                            <span class="count-value unread">{{ formatNumber(row.unread_submissions) }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column
                        prop="spam_submissions"
                        label="Spam"
                        min-width="100"
                        sortable
                        align="right"
                    >
                        <template #default="{ row }">
                            <span class="count-value spam">{{ formatNumber(row.spam_submissions) }}</span>
                        </template>
                    </el-table-column>

                    <el-table-column
                        prop="conversion_rate"
                        label="Read Rate"
                        min-width="120"
                        sortable
                        align="right"
                    >
                        <template #default="{ row }">
                            <span class="percentage-value" :class="getReadRateClass(row.conversion_rate)">
                                {{ formatPercentage(row.conversion_rate) }}
                            </span>
                        </template>
                    </el-table-column>
                </el-table>

                <!-- Summary Row -->
                <div class="summary-row">
                    <div class="summary-item">
                        <span class="label">Total Submissions:</span>
                        <span class="value total">{{ formatNumber(totals.total) }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Read</span>
                        <span class="value read">{{ formatNumber(totals.read) }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Unread</span>
                        <span class="value unread">{{ formatNumber(totals.unread) }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Spam</span>
                        <span class="value spam">{{ formatNumber(totals.spam) }}</span>
                    </div>
                    <div class="summary-item">
                        <span class="label">Overall Read Rate</span>
                        <span class="value percentage" :class="getReadRateClass(totals.readRate)">
                            {{ formatPercentage(totals.readRate) }}
                        </span>
                    </div>
                </div>
            </div>
        </card-body>
    </card>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";

export default {
    name: 'SubmissionAnalysis',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: {
        formsList: {
            type: Array,
            default: () => []
        },
        globalDateParams: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            loading: false,
            submissionData: [],
            selectedGroupBy: 'forms',
            selectedFormId: null,
            groupByOptions: {
                'forms': 'Forms',
                'submission_source': 'Submission Source',
                'email': 'Email',
                'country': 'Country',
                'submission_date': 'Submission Date'
            }
        };
    },
    computed: {
        totals() {
            if (!this.submissionData.length) {
                return { total: 0, read: 0, unread: 0, spam: 0, readRate: 0 };
            }

            const totals = this.submissionData.reduce((acc, row) => {
                acc.total += row.total_submissions || 0;
                acc.read += row.read_submissions || 0;
                acc.unread += row.unread_submissions || 0;
                acc.spam += row.spam_submissions || 0;
                return acc;
            }, { total: 0, read: 0, unread: 0, spam: 0 });

            totals.readRate = totals.total > 0 ? (totals.read / totals.total) * 100 : 0;

            return totals;
        }
    },
    watch: {
        globalDateParams: {
            handler() {
                this.fetchSubmissionData();
            },
            deep: true
        }
    },
    mounted() {
        this.fetchSubmissionData();
    },
    methods: {
        fetchSubmissionData() {
            this.loading = true;

            const data = {
                action: 'fluentform-get-submission-analysis-by-group',
                group_by: this.selectedGroupBy,
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                form_id: this.selectedFormId
            };

            FluentFormsGlobal.$get(data)
                .then(response => {
                    if (response.data && response.data.data) {
                        this.submissionData = response.data.data;
                    } else {
                        this.submissionData = [];
                    }
                })
                .fail(error => {
                    console.error('Error fetching submission analysis data:', error);
                    this.submissionData = [];
                    this.$message.error('Failed to load submission analysis data');
                })
                .always(() => {
                    this.loading = false;
                });
        },

        handleGroupByChange() {
            // Reset form selection when changing group by
            this.selectedFormId = null;
            this.fetchSubmissionData();
        },

        handleFormChange() {
            this.fetchSubmissionData();
        },

        formatNumber(value) {
            if (value === null || value === undefined) {
                return '0';
            }
            return value.toLocaleString();
        },

        formatPercentage(value) {
            if (value === null || value === undefined) {
                return '0%';
            }
            return value.toFixed(1) + '%';
        },

        formatSourceUrl(url) {
            if (!url) return 'Direct Access';
            try {
                const urlObj = new URL(url);
                return urlObj.hostname + urlObj.pathname;
            } catch (e) {
                return url.length > 50 ? url.substring(0, 50) + '...' : url;
            }
        },

        formatSubmissionDate(date) {
            if (!date) return 'Unknown';
            const dateObj = new Date(date);
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        getCountryFlag(country) {
            // Simple country to flag emoji mapping
            const countryFlags = {
                'United States': '🇺🇸',
                'Canada': '🇨🇦',
                'United Kingdom': '🇬🇧',
                'Germany': '🇩🇪',
                'France': '🇫🇷',
                'Australia': '🇦🇺',
                'Japan': '🇯🇵',
                'India': '🇮🇳',
                'Brazil': '🇧🇷',
                'China': '🇨🇳'
            };
            return countryFlags[country] || '🌍';
        },

        getReadRateClass(rate) {
            if (rate >= 80) return 'excellent';
            if (rate >= 60) return 'good';
            if (rate >= 40) return 'average';
            return 'poor';
        },

        formatCurrentDateRange() {
            if (!this.globalDateParams.startDate || !this.globalDateParams.endDate) {
                return 'No date range selected';
            }

            const startDate = new Date(this.globalDateParams.startDate);
            const endDate = new Date(this.globalDateParams.endDate);

            // Check if it's the same day
            if (this.isSameDay(startDate, endDate)) {
                return this.formatDate(startDate);
            }

            // Check if it's the same month
            if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
                return `${this.formatDateShort(startDate)} - ${this.formatDate(endDate)}`;
            }

            // Different months or years
            return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
        },

        isSameDay(date1, date2) {
            return date1.getDate() === date2.getDate() &&
                   date1.getMonth() === date2.getMonth() &&
                   date1.getFullYear() === date2.getFullYear();
        },

        formatDate(date) {
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            };
            return date.toLocaleDateString('en-US', options);
        },

        formatDateShort(date) {
            const options = {
                month: 'short',
                day: 'numeric'
            };
            return date.toLocaleDateString('en-US', options);
        }
    }
};
</script>

<style scoped>
.submission-analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    gap: 20px;
}

.title-section {
    flex: 1;
}

.title-section h3 {
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
    color: #374151;
}

.subtitle {
    margin: 0;
    font-size: 14px;
    color: #6b7280;
}

.controls-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
}

.date-range-display {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    line-height: 1.4;
    padding: 4px 0;
}

.date-range-label {
    font-weight: 500;
    color: #9ca3af;
    min-width: 90px;
    opacity: 0.9;
    font-size: 12px;
}

.date-range-dates {
    font-weight: 500;
    color: #4b5563;
    background: #f8fafc;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.loading-state {
    padding: 20px;
}

.no-data-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: #6b7280;
}

.no-data-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
}

.no-data-state h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #374151;
}

.no-data-state p {
    margin: 0;
    font-size: 14px;
    max-width: 300px;
    line-height: 1.5;
}

.submission-table-container {
    margin-top: 16px;
}

.form-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.form-title {
    font-weight: 500;
    color: #374151;
}

.form-id {
    font-size: 12px;
    color: #9ca3af;
}

.source-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.source-url {
    font-weight: 500;
    color: #374151;
    word-break: break-all;
}

.source-count {
    font-size: 12px;
    color: #9ca3af;
}

.email-info .email-address {
    font-weight: 500;
    color: #374151;
    word-break: break-all;
}

.country-info {
    display: flex;
    align-items: center;
    gap: 8px;
}

.country-name {
    font-weight: 500;
    color: #374151;
}

.country-flag {
    font-size: 16px;
}

.date-info .date-value {
    font-weight: 500;
    color: #374151;
}



.summary-row {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 20px;
    margin-top: 16px;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.summary-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.summary-item .label {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.summary-item .value {
    font-size: 18px;
    font-weight: 700;
}

.summary-item .value.total {
    color: #374151;
    font-size: 20px;
}

.summary-item .value.read {
    color: #059669;
}

.summary-item .value.unread {
    color: #d97706;
}

.summary-item .value.spam {
    color: #dc2626;
}

.summary-item .value.percentage {
    font-size: 16px;
    padding: 4px 8px;
    border-radius: 4px;
}


/* Responsive adjustments */
@media (max-width: 1024px) {
    .submission-analysis-header {
        flex-direction: column;
        gap: 16px;
    }

    .controls-section {
        align-self: flex-end;
        flex-wrap: wrap;
        justify-content: flex-end;
    }
}

@media (max-width: 768px) {
    .controls-section {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        width: 100%;
    }

    .date-range-display {
        justify-content: center;
    }

    .controls-section .el-select {
        width: 100% !important;
    }

    .summary-row {
        flex-direction: column;
        gap: 16px;
    }

    .summary-item {
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
    }

    .summary-item:last-child {
        border-bottom: none;
    }
}
</style>

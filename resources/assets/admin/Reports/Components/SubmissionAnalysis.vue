<template>
    <div>
        <card class="ff-pro-component">
            <card-head>
                <div class="submission-analysis-header">
                    <div class="title-section">
                        <h3>{{ getDynamicTitle() }}</h3>
                    </div>
                    <div class="controls-section">

                        <el-select
                            v-model="selectedGroupBy"
                            placeholder="Group By"
                            size="mini"
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
                    </div>
                </div>
            </card-head>

            <card-body>
                <div v-if="loading" class="loading-state">
                    <el-skeleton :rows="12" animated />
                </div>

                <div v-else-if="submissionData.length === 0" class="no-data-state">
                    <i class="el-icon-data-analysis no-data-icon"></i>
                    <p>{{ $t('No submission data found for the selected criteria and date range.') }}</p>
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
                            :label="$t('Form')"
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
                            :label="$t('Submission Source')"
                            min-width="250"
                            sortable
                        >
                            <template #default="{ row }">
                                <div class="source-info">
                                <span class="source-url" :title="row.source_url">
                                    {{ formatSourceUrl(row.source_url) }}
                                </span>
                                    <span class="source-count">{{ row.total_submissions }} {{ $t('submissions') }}</span>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column
                            v-if="selectedGroupBy === 'email'"
                            prop="email"
                            :label="$t('Email')"
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
                            :label="$t('Country')"
                            min-width="150"
                            sortable
                        >
                            <template #default="{ row }">
                                <div class="country-info">
                                    <span class="country-name">{{ row.country || $t('Unknown') }}</span>
                                    <span class="country-flag" v-if="row.country">{{ getCountryFlag(row.country) }}</span>
                                </div>
                            </template>
                        </el-table-column>

                        <el-table-column
                            v-if="selectedGroupBy === 'submission_date'"
                            prop="submission_date"
                            :label="$t('Date')"
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
                            :label="$t('Total Submissions')"
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
                            :label="$t('Read')"
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
                            :label="$t('Unread')"
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
                            :label="$t('Spam')"
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
                            :label="$t('Read Rate')"
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
                </div>
                <notice class="ff_alert_between update-info-notice" type="info-soft" v-if="!hasPro">
                    <div>
                        <h2 class="text">{{ $t('Please upgrade to pro to unlock this feature.') }}</h2>
                    </div>
                    <a target="_blank"
                       href="https://fluentforms.com/pricing/?utm_source=plugin&amp;utm_medium=wp_install&amp;utm_campaign=ff_upgrade&amp;theme_style=twentytwentythree"
                       class="el-button el-button--info el-button--small mt-2">
                        {{ $t('Upgrade to Pro') }}
                    </a>
                </notice>
            </card-body>
        </card>
        <div v-if="totalItems > pageSize" class="ff_pagination_wrap text-right pagination-container mt-4">
            <el-pagination
                class="ff_pagination"
                background
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :current-page="currentPage"
                :page-sizes="[5, 10, 20, 50, 100]"
                :page-size="parseInt(pageSize)"
                layout="total, sizes, prev, pager, next, jumper"
                :total="totalItems">
            </el-pagination>
        </div>
    </div>
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";
import Notice from "@/admin/components/Notice/Notice.vue";

export default {
    name: 'SubmissionAnalysis',
    components: {
        Card,
        CardBody,
        CardHead,
        Notice
    },
    props: {
        formsList: {
            type: Array,
            default: () => []
        },
        globalDateParams: {
            type: Object,
            default: () => ({})
        },
        selectedFormId: {
            type: [Number, String]
        }
    },
    data() {
        return {
            loading: false,
            submissionData: [],
            selectedGroupBy: 'forms',
            currentPage: 1,
            pageSize: localStorage.getItem('ffReportSubmissionAnalysisPerPage') || 5,
            totalItems: 0,
            totals: {
                total: 0,
                read: 0,
                unread: 0,
                spam: 0,
                readRate: 0
            }
        };
    },
    watch: {
        globalDateParams: {
            handler() {
                this.fetchSubmissionData();
            },
            deep: true
        },
        selectedFormId() {
            if (this.selectedFormId) {
                this.selectedGroupBy = 'submission_source';
            } else {
                this.selectedGroupBy = 'forms';
            }
            this.fetchSubmissionData();
        }
    },
    computed: {
        hasPro() {
            return !!window.FluentFormApp.has_pro;
        },

        groupByOptions() {
            let options = {
                'forms': this.$t('Forms'),
                'submission_source': this.$t('Submission Source'),
                'email': this.$t('Email'),
                'country': this.$t('Country'),
                'submission_date': this.$t('Submission Date')
            };
            if (this.selectedFormId) {
                delete options.forms;
            }
            return options;
        },
    },
    mounted() {
        this.fetchSubmissionData();
    },
    methods: {
        fetchSubmissionData() {
            this.loading = true;

            if (!this.hasPro) {
                // Show demo data for free users
                setTimeout(() => {
                    this.submissionData = [
                        {
                            form_id: "1",
                            form_title: "Contact Form",
                            total_submissions: 124,
                            read_submissions: 4,
                            unread_submissions: 120,
                            spam_submissions: 0,
                            conversion_rate: 3.23
                        },
                        {
                            form_id: "2",
                            form_title: "Registration Form",
                            total_submissions: 71,
                            read_submissions: 1,
                            unread_submissions: 70,
                            spam_submissions: 0,
                            conversion_rate: 1.41
                        },
                        {
                            form_id: "3",
                            form_title: "Feedback Form",
                            total_submissions: 10,
                            read_submissions: 1,
                            unread_submissions: 9,
                            spam_submissions: 0,
                            conversion_rate: 10
                        },
                        {
                            form_id: "6",
                            form_title: "Blank Form (#6)",
                            total_submissions: 2,
                            read_submissions: 0,
                            unread_submissions: 2,
                            spam_submissions: 0,
                            conversion_rate: 0
                        }
                    ];
                    this.totalItems = 6;
                    this.totals = {
                        total: 217,
                        read: 11,
                        unread: 206,
                        spam: 0,
                        readRate: 5.07
                    };
                    this.loading = false;
                }, 500);
                return;
            }

            const data = {
                group_by: this.selectedGroupBy,
                start_date: this.globalDateParams.startDate,
                end_date: this.globalDateParams.endDate,
                form_id: this.selectedFormId,
                per_page: this.pageSize,
                page: this.currentPage
            };
            const url = FluentFormsGlobal.$rest.route('submissionsAnalysisReport');

            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    if (response) {
                        this.submissionData = response.data || [];
                        this.totalItems = response.total || 0;
                        this.currentPage = parseInt(response.current_page || this.currentPage);
                        this.totals = response.totals || {
                            total: 0,
                            read: 0,
                            unread: 0,
                            spam: 0,
                            readRate: 0
                        };
                    } else {
                        this.submissionData = [];
                        this.totalItems = 0;
                        this.totals = {
                            total: 0,
                            read: 0,
                            unread: 0,
                            spam: 0,
                            readRate: 0
                        };
                    }
                })
                .catch(error => {
                    this.submissionData = [];
                    this.totalItems = 0;
                    this.totals = {
                        total: 0,
                        read: 0,
                        unread: 0,
                        spam: 0,
                        readRate: 0
                    };
                    this.$message.error('Failed to load submission analysis data');
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        handleGroupByChange() {
            // Reset form selection when changing group by
            this.currentPage = 1;
            this.fetchSubmissionData();
        },

        handleFormChange() {
            this.currentPage = 1;
            this.fetchSubmissionData();
        },

        handleSizeChange(newSize) {
            this.pageSize = newSize;
            localStorage.setItem('ffReportSubmissionAnalysisPerPage', newSize);
            this.currentPage = 1;
            this.fetchSubmissionData();
        },

        handleCurrentChange(newPage) {
            this.currentPage = newPage;
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
            if (!url) return this.$t('Direct Access');
            try {
                const urlObj = new URL(url);
                return urlObj.hostname + urlObj.pathname;
            } catch (e) {
                return url.length > 50 ? url.substring(0, 50) + '...' : url;
            }
        },

        formatSubmissionDate(date) {
            if (!date) return this.$t('Unknown');
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
        },
        getDynamicTitle() {
            const baseTitle = this.$t('Submission Analysis');
            if (this.selectedGroupBy && this.groupByOptions[this.selectedGroupBy]) {
                return `${baseTitle} ${this.$t('by')} ${this.groupByOptions[this.selectedGroupBy]}`;
            }
            return baseTitle;
        }
    }
};
</script>

<style scoped>
/* Add pagination styling */
.pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}

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
.controls-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
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

.summary-item .value {
    font-size: 18px;
    font-weight: 700;
}
</style>

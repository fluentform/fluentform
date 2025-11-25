<template>
    <div class="ff_ai_features_dashboard">
        <card class="ff_card">
            <card-head>
                <div class="ff_card_title">
                    <h3 class="ff_ai_section_title">
                        {{$t('AI-Powered Form Insights')}}
                    </h3>
                </div>
            </card-head>
            <card-body>
                <div v-loading="loading" class="ff_ai_features_content">
                    <div v-if="data" class="ff_ai_features_results">
                        <!-- AI Summary Section -->
                        <div class="ff_ai_section">
                            <!-- Key Insights -->
                            <div class="ff_ai_summary_section">
                                <h4>{{$t('Key Insights')}}</h4>
                                <div v-if="data.summary && data.summary.insights && data.summary.insights.length > 0" class="ff_ai_suggestions_list">
                                    <div v-for="(insight, index) in data.summary.insights" :key="index" class="ff_ai_suggestion_item">
                                        <div class="ff_ai_suggestion_content">
                                            <div class="ff_ai_suggestion_text">{{insight}}</div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="ff_ai_empty_state">
                                    <p>{{$t('No insights available at this time.')}}</p>
                                </div>
                            </div>

                            <!-- Trends Chart -->
                            <div class="ff_ai_summary_section">
                                <h4>{{$t('Trends')}}</h4>
                                <div v-if="data.summary && data.summary.trends && data.summary.trends.length > 0" class="ff_ai_trends_chart">
                                    <div v-for="(trend, index) in data.summary.trends" :key="index" class="ff_ai_trend_bar">
                                        <div class="ff_ai_trend_value">{{trend.count}}</div>
                                        <div class="ff_ai_trend_label">{{formatTrendDate(trend.date)}}</div>
                                    </div>
                                </div>
                                <div v-else class="ff_ai_empty_state">
                                    <p>{{$t('No trend data available.')}}</p>
                                </div>
                            </div>

                            <!-- Customer Complaints -->
                            <div class="ff_ai_summary_section">
                                <h4>{{$t('Customer Complaints')}}</h4>
                                <div v-if="data.summary && data.summary.complaints && data.summary.complaints.length > 0">
                                    <ul class="ff_ai_complaints_list">
                                        <li v-for="(complaint, index) in data.summary.complaints" :key="index">
                                            {{complaint}}
                                        </li>
                                    </ul>
                                </div>
                                <div v-else class="ff_ai_empty_state">
                                    <p>{{$t('No complaints found in the submissions.')}}</p>
                                </div>
                            </div>

                            <!-- Keywords -->
                            <div class="ff_ai_summary_section">
                                <h4>{{$t('Common Keywords')}}</h4>
                                <div v-if="data.summary && data.summary.keywords && data.summary.keywords.length > 0" class="ff_ai_keywords_cloud">
                                    <span 
                                        v-for="(keyword, index) in data.summary.keywords" 
                                        :key="index"
                                        class="ff_ai_keyword_tag"
                                    >
                                        {{keyword.word}} ({{keyword.count}})
                                    </span>
                                </div>
                                <div v-else class="ff_ai_empty_state">
                                    <p>{{$t('No keywords extracted from submissions.')}}</p>
                                </div>
                            </div>

                            <!-- Segmented Results -->
                            <div class="ff_ai_summary_section">
                                <h4>{{$t('Segmented Results')}}</h4>
                                <div v-if="data.summary && data.summary.segmented_results && (
                                    (data.summary.segmented_results.by_status && Object.keys(data.summary.segmented_results.by_status).length > 0) ||
                                    (data.summary.segmented_results.by_device && Object.keys(data.summary.segmented_results.by_device).length > 0)
                                )">
                                    <el-row :gutter="12">
                                        <el-col :span="12" v-if="data.summary.segmented_results.by_status && Object.keys(data.summary.segmented_results.by_status).length > 0">
                                            <div class="ff_ai_segment">
                                                <h5>{{$t('By Status')}}</h5>
                                                <div v-for="(count, status) in data.summary.segmented_results.by_status" :key="status" class="ff_ai_segment_item">
                                                    <span class="ff_ai_segment_label">{{status}}:</span>
                                                    <span class="ff_ai_segment_value">{{count}}</span>
                                                </div>
                                            </div>
                                        </el-col>
                                        <el-col :span="12" v-if="data.summary.segmented_results.by_device && Object.keys(data.summary.segmented_results.by_device).length > 0">
                                            <div class="ff_ai_segment">
                                                <h5>{{$t('By Device')}}</h5>
                                                <div v-for="(count, device) in data.summary.segmented_results.by_device" :key="device" class="ff_ai_segment_item">
                                                    <span class="ff_ai_segment_label">{{device}}:</span>
                                                    <span class="ff_ai_segment_value">{{count}}</span>
                                                </div>
                                            </div>
                                        </el-col>
                                    </el-row>
                                </div>
                                <div v-else class="ff_ai_empty_state">
                                    <p>{{$t('No segmented data available.')}}</p>
                                </div>
                            </div>
                        </div>

                        <!-- AI Analytics Section -->
                        <div class="ff_ai_section">
                            <!-- Drop-off Analysis -->
                            <div v-if="data.analytics && data.analytics.drop_off_analysis" class="ff_ai_analytics_section">
                                <h4>{{$t('Drop-off Analysis')}}</h4>
                                <div class="ff_ai_dropoff_stats">
                                    <div class="ff_ai_stat_card">
                                        <div class="ff_ai_stat_value">{{data.analytics.drop_off_analysis.completion_rate}}%</div>
                                        <div class="ff_ai_stat_label">{{$t('Completion Rate')}}</div>
                                    </div>
                                    <div class="ff_ai_stat_card">
                                        <div class="ff_ai_stat_value">{{data.analytics.drop_off_analysis.drop_off_rate}}%</div>
                                        <div class="ff_ai_stat_label">{{$t('Drop-off Rate')}}</div>
                                    </div>
                                    <div class="ff_ai_stat_card">
                                        <div class="ff_ai_stat_value">{{data.analytics.drop_off_analysis.completed_submissions}}</div>
                                        <div class="ff_ai_stat_label">{{$t('Completed')}}</div>
                                    </div>
                                    <div class="ff_ai_stat_card">
                                        <div class="ff_ai_stat_value">{{data.analytics.drop_off_analysis.total_submissions}}</div>
                                        <div class="ff_ai_stat_label">{{$t('Total Submissions')}}</div>
                                    </div>
                                </div>

                                <!-- Field Drop-offs -->
                                <div class="ff_ai_field_dropoffs">
                                    <h5>{{$t('Drop-offs by Field')}}</h5>
                                    <div v-if="data.analytics.drop_off_analysis.by_field && Object.keys(data.analytics.drop_off_analysis.by_field).length > 0">
                                        <div v-for="(count, fieldName) in data.analytics.drop_off_analysis.by_field" :key="fieldName" class="ff_ai_dropoff_item">
                                            <span class="ff_ai_field_name">{{fieldName}}</span>
                                            <span class="ff_ai_dropoff_count">{{count}} {{$t('drop-offs')}}</span>
                                        </div>
                                    </div>
                                    <div v-else class="ff_ai_empty_state">
                                        <p>{{$t('No field drop-offs detected. All required fields are being completed.')}}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Field Completion Rates -->
                            <div class="ff_ai_analytics_section">
                                <h4>{{$t('Field Completion Rates')}}</h4>
                                <div v-if="data.analytics && data.analytics.field_completion && Object.keys(data.analytics.field_completion).length > 0" class="ff_ai_field_completion_list">
                                    <div v-for="(field, fieldName) in data.analytics.field_completion" :key="fieldName" class="ff_ai_field_completion_item">
                                        <div class="ff_ai_field_info">
                                            <span class="ff_ai_field_label">{{field.field_label}}</span>
                                            <span v-if="field.required" class="ff_ai_required_badge">{{$t('Required')}}</span>
                                        </div>
                                        <div class="ff_ai_completion_bar_wrap">
                                            <div class="ff_ai_completion_bar" :style="{ width: field.completion_rate + '%' }"></div>
                                            <span class="ff_ai_completion_percent">{{field.completion_rate}}%</span>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="ff_ai_empty_state">
                                    <p>{{$t('Field completion data is not available for this form.')}}</p>
                                </div>
                            </div>

                            <!-- AI Improvement Suggestions (includes both suggestions and conversion lift) -->
                            <div class="ff_ai_analytics_section">
                                <h4>{{$t('AI Improvement Suggestions')}}</h4>
                                <div v-if="(data.analytics && data.analytics.suggestions && data.analytics.suggestions.length > 0) || (data.analytics && data.analytics.conversion_lift && data.analytics.conversion_lift.length > 0)" class="ff_ai_suggestions_list">
                                    <!-- Suggestions -->
                                    <div v-for="(suggestion, index) in (data.analytics && data.analytics.suggestions ? data.analytics.suggestions : [])" :key="'suggestion-' + index" class="ff_ai_suggestion_item">
                                        <div class="ff_ai_suggestion_content">
                                            <div class="ff_ai_suggestion_text">{{suggestion}}</div>
                                        </div>
                                    </div>
                                    
                                    <!-- Conversion Lift Predictions (merged with suggestions) -->
                                    <div v-for="(prediction, index) in (data.analytics && data.analytics.conversion_lift ? data.analytics.conversion_lift : [])" :key="'prediction-' + index" class="ff_ai_suggestion_item">
                                        <div class="ff_ai_suggestion_content">
                                            <div class="ff_ai_suggestion_text">{{prediction}}</div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="ff_ai_empty_state">
                                    <p>{{$t('No improvement suggestions available at this time.')}}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
import Card from '@/admin/components/Card/Card.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';

export default {
    name: 'AiFeaturesDashboard',
    components: {
        Card,
        CardHead,
        CardBody
    },
    props: {
        form_id: {
            type: Number,
            default: 0
        },
        formId: {
            type: Number,
            default: 0
        },
        filters: {
            type: Object,
            default: () => ({})
        }
    },
    data() {
        return {
            loading: false,
            data: null,
            fetchTimeout: null,
            isInitialMount: true
        }
    },
    methods: {
        fetchData() {
            if (!window.FluentFormsGlobal || !window.FluentFormsGlobal.$post) {
                this.$message.error(this.$t('AI Features are not available'));
                return;
            }

            this.loading = true;
            
            const requestData = {
                action: 'fluentform_ai_features',
                form_id: this.form_id || this.formId
            };
            
            if (this.filters) {
                Object.assign(requestData, {
                    entry_type: this.filters.entry_type,
                    search: this.filters.search,
                    sort_by: this.filters.sort_by,
                    date_range: this.filters.date_range,
                    payment_statuses: this.filters.payment_statuses,
                    advanced_filter: this.filters.advanced_filter,
                    page: this.filters.page,
                    per_page: this.filters.per_page
                });
            }
            
            FluentFormsGlobal.$post(requestData)
            .then(response => {
                if (response.success && response.data) {
                    this.data = response.data;
                } else {
                    this.$message.error(this.$t('Failed to generate AI insights'));
                }
            })
            .fail(error => {
                const errorMsg = (error && error.responseJSON && error.responseJSON.data && error.responseJSON.data.message) 
                    || (error && error.message) 
                    || this.$t('Failed to generate AI insights');
                this.$message.error(errorMsg);
            })
            .always(() => {
                this.loading = false;
            });
        },
        formatTrendDate(dateString) {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return dateString;
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            } catch (e) {
                return dateString;
            }
        }
    },
    watch: {
        filters: {
            handler() {
                if (this.isInitialMount) {
                    this.isInitialMount = false;
                    return;
                }
                
                if (this.form_id || this.formId) {
                    if (this.fetchTimeout) {
                        clearTimeout(this.fetchTimeout);
                    }
                    this.fetchTimeout = setTimeout(() => {
                        this.fetchData();
                    }, 300);
                }
            },
            deep: true,
            immediate: false
        }
    },
    mounted() {
        this.fetchData();
    },
    beforeDestroy() {
        if (this.fetchTimeout) {
            clearTimeout(this.fetchTimeout);
        }
    }
}
</script>

<template>
    <card class="ff-pro-component">
        <card-head>
            <h3>{{$t('Submission Timeline Patterns')}}</h3>
            <div class="heatmap-navigation">
                    <div class="week-item">
                        <span class="week-label">{{ $t('Viewing') }}</span>
                        <span class="week-dates">{{ formatCurrentRange() }}</span>
                    </div>
                    <div class="time-period-toggle">
                        <el-button-group size="mini">
                            <el-button
                                size="mini"
                                :type="currentPeriod === 'am' ? 'primary' : ''"
                                @click="switchTimePeriod('am')"
                            >
                                {{ $t('AM (12-11)') }}
                            </el-button>
                            <el-button
                                size="mini"
                                :type="currentPeriod === 'pm' ? 'primary' : ''"
                                @click="switchTimePeriod('pm')"
                            >
                                {{ $t('PM (12-11)') }}
                            </el-button>
                        </el-button-group>
                    </div>
            </div>
        </card-head>
        <card-body>
            <chart-loader v-if="loading" :rows="8" />

            <div v-else class="heatmap-container">
                <div class="heatmap-header">
                    <div class="date-column-header">
                        <span class="header-label">{{ $t('Day') }}</span>
                    </div>
                    <div
                        v-for="(timeSlot, index) in visibleTimeSlots"
                        :key="'header-' + index"
                        class="time-header"
                    >
                        {{ timeSlot }}
                    </div>
                </div>

                <!-- Heatmap grid -->
                <div class="heatmap-grid">
                    <div
                        v-for="(dayName, rowIndex) in getDayNames()"
                        :key="'row-' + rowIndex"
                        class="heatmap-row"
                    >
                        <!-- Day name cell -->
                        <div class="date-cell">
                            <div class="date-day-short">{{ getDayLabel(dayName) }}</div>
                        </div>

                        <!-- Data cells with Element UI tooltips -->
                        <el-tooltip
                            v-for="(timeSlot, colIndex) in visibleTimeSlots"
                            :key="`cell-${rowIndex}-${colIndex}`"
                            :content="getTooltipContent(colIndex, dayName)"
                            placement="top"
                            :open-delay="200"
                            effect="dark"
                            :disabled="getValueForCell(colIndex, dayName) === 0"
                        >
                            <div
                                class="data-cell"
                                :class="getCellClass(getValueForCell(colIndex, dayName))"
                            >
                            </div>
                        </el-tooltip>
                    </div>
                </div>



                <div class="heatmap-color-scale">
                    <span>{{ $t('Low') }}</span>
                    <span class="heatmap-color-scale-item level-0"></span>
                    <span class="heatmap-color-scale-item level-1"></span>
                    <span class="heatmap-color-scale-item level-2"></span>
                    <span class="heatmap-color-scale-item level-3"></span>
                    <span class="heatmap-color-scale-item level-4"></span>
                    <span class="heatmap-color-scale-item level-5"></span>
                    <span>{{ $t('High') }}</span>
                </div>
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
</template>

<script>
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from "@/admin/components/Card/CardHead.vue";
import Notice from "@/admin/components/Notice/Notice.vue";
import { COLORS, formatNumber, ChartLoader, NoData } from './shared/simple-utils.js';

export default {
    name: 'SubmissionHeatmap',
    components: {
        Card,
        CardBody,
        CardHead,
        Notice,
        ChartLoader,
        NoData
    },
    props: ['heatmap_data', 'global_date_params'],
    data() {
        return {
            loading: true,
            currentPeriod: 'am', // 'am' or 'pm'
            heatmapDataStore: {},
            dateRange: null
        };
    },
    computed: {

        formatCurrentRange() {
            return () => {
                if (this.dateRange) {
                    const startDate = new Date(this.dateRange.start_date);
                    const endDate = new Date(this.dateRange.end_date);

                    const formatDate = (date) => {
                        const month = date.toLocaleString('default', { month: 'short' });
                        const day = date.getDate();
                        const year = date.getFullYear();
                        return `${month} ${day}, ${year}`;
                    };

                    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
                }
                return this.$t('Cumulative Data by Day of Week');
            };

         },

        hasPro() {
            return !!window.FluentFormApp.has_pro;
        },

        visibleTimeSlots() {
            if (!this.heatmap_data?.time_slots) return [];
            return this.heatmap_data.time_slots[this.currentPeriod] || [];
        },

        hasData() {
            if (!this.heatmapDataStore || Object.keys(this.heatmapDataStore).length === 0) {
                return false;
            }

            // Check if any day has non-zero values
            for (const dayName of this.getDayNames()) {
                if (this.heatmapDataStore[dayName]) {
                    for (let i = 0; i < 24; i++) {
                        if (this.heatmapDataStore[dayName][i] > 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },

        infoMessage() {
            if (!this.hasPro) {
                return this.$t('This is a demo preview. Upgrade to FluentForms Pro to see real submission heatmap data.');
            }
            return this.$t('No submission data available for the selected date range');
        }
    },
    watch: {
        heatmap_data: {
            handler(newData) {
                if (!this.hasPro) {
                    this.generateDemoData();
                    setTimeout(() => {
                        this.loading = false;
                    }, 300);
                    return;
                }

                if (newData && newData.heatmap_data) {
                    this.processHeatmapData(newData.heatmap_data);
                    this.dateRange = {
                        start_date: newData.start_date,
                        end_date: newData.end_date
                    };
                    setTimeout(() => {
                        this.loading = false;
                    }, 300);
                } else {
                    this.initializeEmptyData();
                }
            },
            deep: true,
            immediate: true
        },
        global_date_params: {
            handler(newParams) {
                if (!this.hasPro) { return ;}
                if (newParams && newParams.startDate && newParams.endDate) {
                    const globalStartDate = new Date(newParams.startDate.split(' ')[0]); // Remove time part
                    const globalEndDate = new Date(newParams.endDate.split(' ')[0]); // Remove time part

                    // Calculate the number of days in the selected range
                    const timeDiff = globalEndDate.getTime() - globalStartDate.getTime();
                    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

                    // Store the actual selected range for data filtering
                    this.selectedRangeStart = globalStartDate;
                    this.selectedRangeEnd = globalEndDate;
                    this.selectedRangeDays = daysDiff;

                    // Always show exactly 7 days, use the end date as reference
                    const endDate = new Date(globalEndDate);

                    const startDate = new Date(endDate);
                    startDate.setDate(endDate.getDate() - 6); // 7 days total

                    this.daysToShow = 7;
                    this.currentStartDate = startDate;

                    if (this.heatmap_data && this.heatmap_data.heatmap_data) {
                        this.processHeatmapData(this.heatmap_data.heatmap_data);
                    } else {
                        this.initializeEmptyData();
                    }
                }
            },
            deep: true,
            immediate: true
        }
    },
    mounted() {
        if (!this.hasPro) {
            // Always show demo data for non-pro users
            this.generateDemoData();
        } else if (!this.heatmap_data || !this.heatmap_data.heatmap_data) {
            this.generateSampleData();
        }
    },
    methods: {
        processHeatmapData(data) {
            this.heatmapDataStore = data || {};
        },

        initializeEmptyData() {
            this.heatmapDataStore = {};
            // Initialize with empty data for all days
            this.getDayNames().forEach(dayName => {
                this.heatmapDataStore[dayName] = Array(24).fill(0);
            });
        },

        getDayNames() {
            return this.heatmap_data?.day_labels ?
                Object.keys(this.heatmap_data.day_labels) :
                ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        },

        getDayLabel(dayName) {
            return this.heatmap_data?.day_labels?.[dayName] || dayName.substring(0, 3).toUpperCase();
        },

        generateSampleData() {
            if (!this.hasPro) {
                // Generate realistic demo data for non-pro users
                this.generateDemoData();
            } else {
                this.initializeEmptyData();
            }
        },

        generateDemoData() {
            // Generate simple demo data for non-pro users
            this.heatmapDataStore = {};
            this.getDayNames().forEach(dayName => {
                this.heatmapDataStore[dayName] = Array(24).fill(0).map(() => Math.floor(Math.random() * 10));
            });
        },

        switchTimePeriod(period) {
            this.currentPeriod = period;
        },

        getValueForCell(visibleIndex, dayName) {
            const actualIndex = this.currentPeriod === 'am' ? visibleIndex : visibleIndex + 12;
            if (this.heatmapDataStore[dayName] && this.heatmapDataStore[dayName][actualIndex] !== undefined) {
                return this.heatmapDataStore[dayName][actualIndex];
            }
            return 0;
        },

        getTooltipContent(visibleIndex, dayName) {
            const value = this.getValueForCell(visibleIndex, dayName);
            const timeSlot = this.visibleTimeSlots[visibleIndex];
            return `${this.$t(dayName)} (${timeSlot}): ${value} ${value !== 1 ? this.$t('Submissions') : this.$t('Submission')}`;
        },
        getCellClass(value) {
            if (value === 0) return 'level-0';
            if (value <= 2) return 'level-1';
            if (value <= 5) return 'level-2';
            if (value <= 15) return 'level-3';
            if (value <= 30) return 'level-4';
            return 'level-5';
        },


    }
};
</script>


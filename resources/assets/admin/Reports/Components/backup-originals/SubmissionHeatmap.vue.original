<template>
    <card class="ff-pro-component">
        <card-head>
            <h3>{{$t('Submission Timeline')}}</h3>
            <div class="heatmap-navigation">
                    <div class="week-item">
                        <span class="week-label">{{ $t('Viewing:') }}</span>
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
            <div class="heatmap-container" v-loading="loading">
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
                        v-for="(dayName, rowIndex) in dayNames"
                        :key="'row-' + rowIndex"
                        class="heatmap-row"
                    >
                        <!-- Day name cell -->
                        <div class="date-cell">
                            <div class="date-day-short">{{ formatDayShort(dayName) }}</div>
                        </div>

                        <!-- Data cells with Element UI tooltips -->
                        <el-tooltip
                            v-for="(timeSlot, colIndex) in visibleTimeSlots"
                            :key="`cell-${rowIndex}-${colIndex}`"
                            :content="getTooltipContent(getActualTimeIndex(colIndex), dayName)"
                            placement="top"
                            :open-delay="200"
                            effect="dark"
                            :disabled="getValueForCell(getActualTimeIndex(colIndex), dayName) === 0"
                        >
                            <div
                                class="data-cell"
                                :class="getCellClass(getValueForCell(getActualTimeIndex(colIndex), dayName))"
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

export default {
    name: 'SubmissionHeatmap',
    components: {
        Card,
        CardBody,
        CardHead,
        Notice
    },
    props: ['heatmap_data', 'global_date_params'],
    data() {
        return {
            loading: false,
            allTimeSlots: [
                "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM",
                "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM",
                "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
            ],
            amTimeSlots: [
                "12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM",
                "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM"
            ],
            pmTimeSlots: [
                "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM",
                "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"
            ],
            currentPeriod: 'am', // 'am' or 'pm'
            dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            heatmapDataStore: {},
            aggregationType: 'day_of_week',
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
            return this.currentPeriod === 'am' ? this.amTimeSlots : this.pmTimeSlots;
        }
    },
    watch: {
        heatmap_data: {
            handler(newData) {
                if (newData && newData.heatmap_data) {
                    this.processHeatmapData(newData.heatmap_data);
                    this.aggregationType = newData.aggregation_type || 'day_of_week';
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
        if (!this.heatmap_data || !this.heatmap_data.heatmap_data) {
            this.generateSampleData();
        }
    },
    methods: {
        processHeatmapData(data) {
            this.heatmapDataStore = {};

            // Process data for each day of the week
            this.dayNames.forEach(dayName => {
                // Initialize with zeros for all time slots
                this.heatmapDataStore[dayName] = {};
                for (let i = 0; i < 24; i++) {
                    this.heatmapDataStore[dayName][i] = 0;
                }

                // If real data exists for this day, use it
                if (data && data[dayName]) {
                    for (let i = 0; i < 24; i++) {
                        this.heatmapDataStore[dayName][i] = data[dayName][i] || 0;
                    }
                }
            });
        },

        initializeEmptyData() {
            this.heatmapDataStore = {};

            // Initialize data for all days of the week with all zeros
            this.dayNames.forEach(dayName => {
                this.heatmapDataStore[dayName] = {};

                // Initialize all time slots with 0
                for (let i = 0; i < 24; i++) {
                    this.heatmapDataStore[dayName][i] = 0;
                }
            });
        },

        generateSampleData() {
            this.initializeEmptyData();
        },

        switchTimePeriod(period) {
            this.currentPeriod = period;
        },

        getActualTimeIndex(visibleIndex) {
            // Convert visible index (0-11) to actual hour index (0-23)
            return this.currentPeriod === 'am' ? visibleIndex : visibleIndex + 12;
        },

        formatDayShort(dayName) {
            const shortNames = {
                'Sunday': 'SUN',
                'Monday': 'MON',
                'Tuesday': 'TUE',
                'Wednesday': 'WED',
                'Thursday': 'THU',
                'Friday': 'FRI',
                'Saturday': 'SAT'
            };
            return shortNames[dayName] || dayName.substring(0, 3).toUpperCase();
        },

        getValueForCell(timeSlotIndex, dayName) {
            if (this.heatmapDataStore[dayName] && this.heatmapDataStore[dayName][timeSlotIndex] !== undefined) {
                return this.heatmapDataStore[dayName][timeSlotIndex];
            }
            return 0;
        },

        getTooltipContent(timeSlotIndex, dayName) {
            const value = this.getValueForCell(timeSlotIndex, dayName);
            const timeSlot = this.allTimeSlots[timeSlotIndex];
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


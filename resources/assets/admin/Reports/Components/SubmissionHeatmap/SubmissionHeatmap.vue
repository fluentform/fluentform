<template>
    <card>
        <card-head>
            <h3>Entries grouped by</h3>
            <div class="heatmap-navigation">
                <el-button
                    size="mini"
                    icon="el-icon-arrow-left"
                    @click="navigateDates('prev')"
                    :disabled="isPrevDisabled"
                ></el-button>
                <el-button
                    size="mini"
                    icon="el-icon-arrow-right"
                    @click="navigateDates('next')"
                    :disabled="isNextDisabled"
                ></el-button>
            </div>
        </card-head>
        <card-body>
            <div class="heatmap-container" v-loading="loading">
                <div class="heatmap-header">
                    <div class="date-column-header"></div>
                    <div
                        v-for="(timeSlot, index) in timeSlots"
                        :key="'header-' + index"
                        class="time-header"
                    >
                        {{ timeSlot }}
                    </div>
                </div>

                <!-- Heatmap grid -->
                <div class="heatmap-grid">
                    <div
                        v-for="(day, rowIndex) in visibleDays"
                        :key="'row-' + rowIndex"
                        class="heatmap-row"
                    >
                        <!-- Date cell -->
                        <div class="date-cell">
                            <div class="date-number">{{ formatDayNumber(day) }}</div>
                            <div class="date-day">{{ formatDayName(day) }}</div>
                        </div>

                        <!-- Data cells -->
                        <div
                            v-for="(timeSlot, colIndex) in timeSlots"
                            :key="`cell-${rowIndex}-${colIndex}`"
                            class="data-cell"
                            :class="getCellClass(getValueForCell(colIndex, day))"
                            @mouseenter="highlightCell($event, colIndex, day)"
                            @mouseleave="removeHighlight()"
                        >
                            <span class="cell-value">{{ getValueForCell(colIndex, day) }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="tooltip.visible" :class="['tooltip', tooltip.class]"  :style="tooltip.style">
                    {{ tooltip.text }}
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
    name: 'SubmissionHeatmap',
    components: {
        Card,
        CardBody,
        CardHead
    },
    props: ['heatmap_data', 'global_date_params'],
    data() {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);

        return {
            loading: false,
            currentStartDate: sevenDaysAgo,
            daysToShow: 7,
            skipNextAnimation: false,
            isSlideRight: false,
            isSlideLeft: false,
            timeSlots: [
                "12:00 AM-3:00 AM",
                "3:00 AM-6:00 AM",
                "6:00 AM-9:00 AM",
                "9:00 AM-12:00 PM",
                "12:00 PM-3:00 PM",
                "3:00 PM-6:00 PM",
                "6:00 PM-9:00 PM",
                "9:00 PM-12:00 AM"
            ],
            heatmapDataStore: {},
            isNavigating: false,
            tableKey: 0,
            tooltip: {
                visible: false,
                text: '',
                class: '',
                style: {
                    top: '0px',
                    left: '0px'
                }
            },
            maxHistoryDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)),
            selectedRangeStart: null,
            selectedRangeEnd: null,
            selectedRangeDays: 0
        };
    },
    computed: {
        visibleDays() {
            const days = [];
            const date = new Date(this.currentStartDate);

            for (let i = 0; i < this.daysToShow; i++) {
                days.push(new Date(date));
                date.setDate(date.getDate() + 1);
            }

            return days.reverse();
        },
        isNextDisabled() {
            // If no selected range, use default logic (don't go beyond today)
            if (!this.selectedRangeStart || !this.selectedRangeEnd) {
                const currentEndDate = new Date(this.currentStartDate);
                currentEndDate.setDate(currentEndDate.getDate() + 6); // 7 days total
                const today = new Date();

                return (
                    currentEndDate.getFullYear() === today.getFullYear() &&
                    currentEndDate.getMonth() === today.getMonth() &&
                    currentEndDate.getDate() === today.getDate()
                );
            }

            // Calculate the current end date of the visible window
            const currentEndDate = new Date(this.currentStartDate);
            currentEndDate.setDate(currentEndDate.getDate() + 6); // 7 days total

            // Disable if we're already showing the end of the selected range
            return currentEndDate >= this.selectedRangeEnd;
        },

        // Check if prev button should be disabled
        isPrevDisabled() {
            // If no selected range, use default logic (don't go beyond history limit)
            if (!this.selectedRangeStart || !this.selectedRangeEnd) {
                const currentStartDate = new Date(this.currentStartDate);
                currentStartDate.setHours(0, 0, 0, 0);
                const maxHistoryDate = new Date(this.maxHistoryDate);
                maxHistoryDate.setHours(0, 0, 0, 0);

                return currentStartDate.getTime() <= maxHistoryDate.getTime();
            }

            const newStartDate = new Date(this.currentStartDate);
            newStartDate.setDate(newStartDate.getDate() - 7); // Move 7 days backward

            return newStartDate < this.selectedRangeStart;
        }
    },
    watch: {
        heatmap_data: {
            handler(newData) {
                if (newData && newData.heatmap_data) {
                    this.processHeatmapData(newData.heatmap_data);
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
        disableFutureDates(date) {
            return date > new Date();
        },
        processHeatmapData(data) {
            this.heatmapDataStore = {};

            // Process data for the visible 7 days
            this.visibleDays.forEach(day => {
                const dateKey = this.formatDateKey(day);

                // Initialize with zeros for all time slots
                this.heatmapDataStore[dateKey] = {};
                for (let i = 0; i < 8; i++) {
                    this.heatmapDataStore[dateKey][i] = 0;
                }

                // If real data exists for this date, use it
                if (data && data[dateKey]) {
                    if (Array.isArray(data[dateKey])) {
                        for (let i = 0; i < 8; i++) {
                            this.heatmapDataStore[dateKey][i] = data[dateKey][i] || 0;
                        }
                    } else {
                        for (let i = 0; i < 8; i++) {
                            this.heatmapDataStore[dateKey][i] = data[dateKey][i] || 0;
                        }
                    }
                }
            });
        },

        initializeEmptyData() {
            this.heatmapDataStore = {};

            // Initialize data for the visible 7 days with all zeros
            this.visibleDays.forEach(day => {
                const dateKey = this.formatDateKey(day);
                this.heatmapDataStore[dateKey] = {};

                // Initialize all time slots with 0
                for (let i = 0; i < 8; i++) {
                    this.heatmapDataStore[dateKey][i] = 0;
                }
            });
        },

        generateSampleData() {
            this.initializeEmptyData();
        },

        formatDateForApi(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day} 00:00:00`;
        },
        formatDateKey(date) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },
        formatDayNumber(date) {
            return String(date.getDate()).padStart(2, '0');
        },
        formatDayName(date) {
            const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            return days[date.getDay()];
        },
        formatDayHeader(date) {
            const day = String(date.getDate()).padStart(2, '0');
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const month = months[date.getMonth()];
            return `${month} ${day}`;
        },
        getValueForCell(timeSlotIndex, date) {
            const dateKey = this.formatDateKey(date);
            if (this.heatmapDataStore[dateKey] && this.heatmapDataStore[dateKey][timeSlotIndex] !== undefined) {
                return this.heatmapDataStore[dateKey][timeSlotIndex];
            }
            return 0;
        },
        getCellClass(value) {
            if (value === 0) return 'level-0';
            if (value <= 2) return 'level-1';
            if (value <= 5) return 'level-2';
            if (value <= 15) return 'level-3';
            if (value <= 30) return 'level-4';
            return 'level-5';
        },
        navigateDates(direction) {
            if (this.isNavigating || this.loading) return;

            // Check boundary conditions
            if (direction === 'next' && this.isNextDisabled) return;
            if (direction === 'prev' && this.isPrevDisabled) return;

            this.isNavigating = true;
            const newDate = new Date(this.currentStartDate);

            if (direction === 'next') {
                newDate.setDate(newDate.getDate() + 7);

                if (this.selectedRangeEnd) {
                    const newEndDate = new Date(newDate);
                    newEndDate.setDate(newEndDate.getDate() + 6); // 7 days total

                    if (newEndDate > this.selectedRangeEnd) {
                        this.isNavigating = false;
                        return;
                    }
                }
            } else {
                newDate.setDate(newDate.getDate() - 7); // Always move by exactly 7 days

                if (this.selectedRangeStart) {
                    if (newDate < this.selectedRangeStart) {
                        this.isNavigating = false;
                        return;
                    }
                }
            }

            // Wait for animation to complete before updating data
            setTimeout(() => {
                // Reset animation classes
                this.isSlideLeft = false;
                this.isSlideRight = false;

                this.currentStartDate = newDate;

                // Process existing heatmap data for the new visible range
                if (this.heatmap_data && this.heatmap_data.heatmap_data) {
                    this.processHeatmapData(this.heatmap_data.heatmap_data);
                } else {
                    this.initializeEmptyData();
                }

                this.isNavigating = false;
            }, 300);
        },
        formatDateForRange(date) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        },

        highlightCell(event, timeSlotIndex, date) {
            const value = this.getValueForCell(timeSlotIndex, date);
            const dateStr = this.formatDateForDisplay(date);
            const timeSlot = this.timeSlots[timeSlotIndex];

            // Get the position of the hovered cell
            const rect = event.target.getBoundingClientRect();
            const cellCenterX = rect.left + (rect.width / 2);
            const cellTop = rect.top;
            const cellBottom = rect.bottom;

            // Estimated tooltip dimensions
            const tooltipHeight = 30;
            const tooltipWidth = 100;

            // Check if there's enough space above the cell
            const spaceOnTop = cellTop > tooltipHeight + 40;

            // Check if tooltip would extend beyond right edge
            const viewportWidth = window.innerWidth;
            const wouldOverflowRight = (cellCenterX + (tooltipWidth / 2)) > (viewportWidth - 20);

            // Set tooltip text
            this.tooltip.text = `${dateStr} | ${timeSlot}: ${value} Submission${value !== 1 ? 's' : ''}`;

            let leftPosition = cellCenterX;
            let tooltipClass = '';

            // Handle right edge overflow
            if (wouldOverflowRight) {
                leftPosition = viewportWidth - tooltipWidth - 20;
                tooltipClass = 'tooltip-right-adjusted';
            }

            if (spaceOnTop) {
                this.tooltip.class = tooltipClass;
                this.tooltip.style = {
                    left: `${leftPosition}px`,
                    top: `${cellTop - tooltipHeight - 10}px`
                };
            } else {
                this.tooltip.class = tooltipClass + ' tooltip-bottom';
                this.tooltip.style = {
                    left: `${leftPosition}px`,
                    top: `${cellBottom + 10}px`
                };
            }

            this.tooltip.visible = true;
        },
        removeHighlight() {
            this.tooltip.visible = false;
        },
        formatDateForDisplay(date) {
            const options = {year: 'numeric', month: 'short', day: 'numeric'};
            return date.toLocaleDateString(undefined, options);
        }
    }
};
</script>


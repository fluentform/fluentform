<template>
    <div class="submission-heatmap">
        <card>
            <card-head class="submission-heatmap-header">
                <h3>Submission Heatmap</h3>
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="-"
                    start-placeholder="Start date"
                    end-placeholder="End date"
                    value-format="MMM d, yyyy"
                    format="MMM d, yyyy"
                    :disabledDate="disableFutureDates"
                    @change="handleDateRangeChange"
                />
            </card-head>
            <card-body class="submission-heatmap-body">
                <div class="table-container" v-loading="loading">
                    <div class="heatmap-wrapper" ref="gridWrapper">
                        <transition name="slide-fade" mode="out-in">
                            <div class="heatmap-grid" :key="tableKey" :class="{'slide-right': isSlideRight, 'slide-left': isSlideLeft}">
                                <!-- Header row with navigation and time slots -->
                                <div class="header-row">
                                    <div class="navigation-cell">
                                        <div class="nav-controls">
                                            <button
                                                class="nav-btn"
                                                @click="navigateDates('prev')"
                                                :disabled="isNavigating || loading || isPrevDisabled"
                                            >
                                                <i class="el-icon-arrow-left"></i>
                                            </button>
                                            <button
                                                class="nav-btn"
                                                @click="navigateDates('next')"
                                                :disabled="isNavigating || loading || isNextDisabled"
                                            >
                                                <i class="el-icon-arrow-right"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <!-- Time slot headers -->
                                    <div
                                        v-for="(timeSlot, index) in timeSlots"
                                        :key="'header-' + index"
                                        class="time-header"
                                    >
                                        {{ timeSlot }}
                                    </div>
                                </div>

                                <!-- Data rows -->
                                <div
                                    v-for="(day, rowIndex) in visibleDays"
                                    :key="'row-' + rowIndex"
                                    class="data-row"
                                >
                                    <!-- Date cell -->
                                    <div class="date-cell">
                                        {{ formatDayHeader(day) }}
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
                                        {{ getValueForCell(colIndex, day) }}
                                    </div>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <div v-if="tooltip.visible" class="tooltip" :style="tooltip.style">
                        {{ tooltip.text }}
                    </div>
                </div>
            </card-body>
        </card>
    </div>
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
    props: ['heatmap_data'],
    emits: ['heatmap-date-change'],
    data() {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 6);

        return {
            loading: false,
            dateRange: [
                this.formatDateForRange(sevenDaysAgo),
                this.formatDateForRange(now)
            ],
            currentStartDate: sevenDaysAgo,
            daysToShow: 7,
            skipNextAnimation: false,
            isSlideRight: false,
            isSlideLeft: false,
            timeSlots: [
                "12:00 AM-03:00 AM",
                "03:00 AM-06:00 AM",
                "06:00 AM-09:00 AM",
                "09:00 AM-12:00 PM",
                "12:00 PM-03:00 PM",
                "03:00 PM-06:00 PM",
                "06:00 PM-09:00 PM",
                "09:00 PM-12:00 AM"
            ],
            heatmapDataStore: {},
            isNavigating: false,
            tableKey: 0,
            tooltip: {
                visible: false,
                text: '',
                style: {
                    top: '0px',
                    left: '0px'
                }
            },
            // Date boundaries for navigation
            maxHistoryDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) // 1 year ago
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
        // Check if next button should be disabled (if end date would be in the future)
        isNextDisabled() {
            // Calculate the end date of the current view
            const currentEndDate = new Date(this.currentStartDate);
            currentEndDate.setDate(currentEndDate.getDate() + (this.daysToShow - 1));

            // Get today's date
            const today = new Date();

            // Compare only the date parts (year, month, day), ignoring time
            return (
                currentEndDate.getFullYear() === today.getFullYear() &&
                currentEndDate.getMonth() === today.getMonth() &&
                currentEndDate.getDate() === today.getDate()
            );
        },
        // Check if prev button should be disabled (if start date is beyond the history limit)
        isPrevDisabled() {
            // Get the current start date and reset time to midnight
            const currentStartDate = new Date(this.currentStartDate);
            currentStartDate.setHours(0, 0, 0, 0);

            // Get the maximum history date and reset time to midnight
            const maxHistoryDate = new Date(this.maxHistoryDate);
            maxHistoryDate.setHours(0, 0, 0, 0);

            // Compare dates (now effectively comparing just the date portions)
            return currentStartDate.getTime() <= maxHistoryDate.getTime();
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
                }
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        // Disable future dates in the date picker
        disableFutureDates(date) {
            return date > new Date();
        },
        processHeatmapData(data) {
            this.heatmapDataStore = {...data};
        },
        emitDateChange() {
            const startDate = this.formatDateForApi(this.currentStartDate);

            // Calculate the end date as start date + 6 days (for 7 days total, inclusive)
            const endDate = new Date(this.currentStartDate);
            endDate.setDate(endDate.getDate() + (this.daysToShow - 1));

            // Ensure end date is not in the future
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            const finalEndDate = endDate > today ? today : endDate;

            // Also update the dateRange picker to show what we're actually requesting
            this.dateRange = [
                this.formatDateForRange(this.currentStartDate),
                this.formatDateForRange(finalEndDate)
            ];

            this.$emit('heatmap-date-change', {
                startDate: startDate,
                endDate: this.formatDateForApi(finalEndDate)
            });

            this.loading = true;
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
        formatDayHeader(date) {
            const day = String(date.getDate()).padStart(2, '0');
            const months = ['Januaryuary', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'Nov', 'December'];
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
            if (value === 0) return 'empty';
            if (value <= 2) return 'level-1';
            if (value <= 5) return 'level-2';
            if (value <= 20) return 'level-3';
            if (value <= 40) return 'level-4';
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
                newDate.setDate(newDate.getDate() + this.daysToShow);

                // Don't allow navigation to future dates
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const endDate = new Date(newDate);
                endDate.setDate(endDate.getDate() + (this.daysToShow - 1));

                // If the end date would be in the future, adjust to show today at the end
                if (endDate > today) {
                    // Calculate a new start date that would make today the end date
                    newDate.setTime(today.getTime());
                    newDate.setDate(newDate.getDate() - (this.daysToShow - 1));
                }
            } else {
                newDate.setDate(newDate.getDate() - this.daysToShow);
            }

            // Wait for animation to complete before updating data
            setTimeout(() => {
                // Reset animation classes
                this.isSlideLeft = false;
                this.isSlideRight = false;

                this.currentStartDate = newDate;

                // Update the dateRange to reflect the new visible dates
                const endDate = new Date(newDate);
                endDate.setDate(endDate.getDate() + (this.daysToShow - 1));

                // Ensure end date is not in the future
                const today = new Date();
                const finalEndDate = endDate > today ? today : endDate;

                this.dateRange = [
                    this.formatDateForRange(newDate),
                    this.formatDateForRange(finalEndDate)
                ];

                this.isNavigating = false;
                this.emitDateChange();
            }, 300);
        },
        formatDateForRange(date) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        },
        handleDateRangeChange(range) {
            if (!range || !range[0] || !range[1]) return;

            // Parse the date strings and set the currentStartDate
            const startParts = range[0].split(" ");
            const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'Nov', 'December'].indexOf(startParts[0]);
            const day = parseInt(startParts[1].replace(',', ''));
            const year = parseInt(startParts[2]);

            // Create new start date
            const newStartDate = new Date(year, month, day);

            // Ensure we're not showing future dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Calculate what the end date would be
            const newEndDate = new Date(newStartDate);
            newEndDate.setDate(newEndDate.getDate() + (this.daysToShow - 1));

            // If the end date would be future, adjust to show today at the end
            if (newEndDate > today) {
                // Move start date back so today is the end date
                newStartDate.setTime(today.getTime());
                newStartDate.setDate(newStartDate.getDate() - (this.daysToShow - 1));
            }

            this.currentStartDate = newStartDate;
            this.tableKey++; // Force re-render
            this.emitDateChange();
        },
        highlightCell(event, timeSlotIndex, date) {
            const value = this.getValueForCell(timeSlotIndex, date);
            const dateStr = this.formatDateForDisplay(date);
            const timeSlot = this.timeSlots[timeSlotIndex];

            this.tooltip.text = `${dateStr} | ${timeSlot}: ${value} Submission`;
            this.tooltip.visible = true;

            // Position the tooltip near the cell
            const rect = event.target.getBoundingClientRect();
            const gridRect = this.$refs.gridWrapper.getBoundingClientRect();

            // Estimate tooltip dimensions
            const tooltipHeight = 30;
            const tooltipWidth = 180; // Estimate based on text length

            // Check if we're near the bottom of the container
            const distanceToBottom = gridRect.bottom - rect.bottom;
            const isNearBottom = distanceToBottom < tooltipHeight + 20; // Add padding

            // Check if we're near the right edge of the container
            const distanceToRight = gridRect.right - rect.right;
            const isNearRight = distanceToRight < tooltipWidth/2 + 20; // Add padding

            // Determine vertical position
            let topPosition;
            if (isNearBottom) {
                topPosition = `${rect.top - gridRect.top - tooltipHeight - 10}px`;
            } else {
                topPosition = `${rect.top - gridRect.top + rect.height + 10}px`;
            }

            // Determine horizontal position
            let leftPosition;
            if (isNearRight) {
                leftPosition = `${rect.left - gridRect.left - tooltipWidth}px`;
            } else {
                leftPosition = `${rect.left - gridRect.left + (rect.width / 2) - 75}px`;
            }

            this.tooltip.style = {
                top: topPosition,
                left: leftPosition,
                zIndex: '999'
            };
        },
        removeHighlight() {
            this.tooltip.visible = false;
        },
        formatDateForDisplay(date) {
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString(undefined, options);
        }
    }
};
</script>
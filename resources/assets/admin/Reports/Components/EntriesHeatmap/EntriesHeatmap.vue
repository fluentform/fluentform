<template>
    <div class="heatmap-container">
        <card>
            <card-head class="d-flex justify-between">
                <h3>Entries Heatmap</h3>
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
            <card-body>
                <div class="table-container">
                    <div v-if="loading" class="loading-overlay">
                        <div class="loading-spinner">
                            <i class="el-icon-loading"></i>
                            <span>Loading data...</span>
                        </div>
                    </div>
                    <div class="heatmap-wrapper" ref="gridWrapper">
                        <transition name="slide-fade" mode="out-in">
                            <div class="heatmap-grid" :key="tableKey">
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
                                        {{ formatTimeHeader(timeSlot) }}
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
    name: 'EntriesHeatmap',
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
        sevenDaysAgo.setDate(now.getDate() - 7);

        return {
            loading: false,
            dateRange: [
                this.formatDateForRange(sevenDaysAgo),
                this.formatDateForRange(now)
            ],
            currentStartDate: sevenDaysAgo,
            daysToShow: 7, // Changed to 7 days
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

            // Reverse the array to show most recent dates at the top
            return days.reverse();
        },
        // Check if next button should be disabled (if end date would be in the future)
        isNextDisabled() {
            // Get today with time set to 23:59:59
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            // Calculate end date after potential next navigation
            const potentialStartDate = new Date(this.currentStartDate);
            potentialStartDate.setDate(potentialStartDate.getDate() + this.daysToShow);

            // Disable if the new start date would be after today
            return potentialStartDate > today;
        },
        // Check if prev button should be disabled (if start date is beyond the history limit)
        isPrevDisabled() {
            return this.currentStartDate <= this.maxHistoryDate;
        }
    },
    watch: {
        heatmap_data: {
            handler(newData) {
                if (newData && newData.heatmap_data) {
                    this.processHeatmapData(newData.heatmap_data);

                    // Important: Update component date range based on what the server provided
                    if (newData.start_date && newData.end_date) {
                        // Use server-provided date range
                        const serverStartDate = new Date(newData.start_date);
                        const serverEndDate = new Date(newData.end_date);

                        // Update component's current start date
                        // Calculate the proper start date for a 7-day window ending at the server's end date
                        const idealStartDate = new Date(serverEndDate);
                        idealStartDate.setDate(idealStartDate.getDate() - 6); // 7 days inclusive

                        // Use the later of the server's start date or our ideal start date
                        // This ensures we don't try to show data before what the server provided
                        if (idealStartDate >= serverStartDate) {
                            this.currentStartDate = idealStartDate;
                        } else {
                            this.currentStartDate = serverStartDate;
                        }

                        // Update the dateRange picker display to match
                        const endDate = new Date(this.currentStartDate);
                        endDate.setDate(endDate.getDate() + 6); // 7 days inclusive

                        // Cap the end date at the server's end date
                        const finalEndDate = endDate > serverEndDate ? serverEndDate : endDate;

                        this.dateRange = [
                            this.formatDateForRange(this.currentStartDate),
                            this.formatDateForRange(finalEndDate)
                        ];

                        // Force re-render
                        this.tableKey++;
                    }

                    this.loading = false;
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
        formatTimeHeader(timeSlot) {
            // Return a shorter version of the time slot (e.g., "12-3AM")
            const parts = timeSlot.split('-');
            const start = parts[0].trim();
            const end = parts[1].trim();

            // Get just the hours and AM/PM
            const startTime = start.split(':')[0];
            const startAmPm = start.includes('AM') ? 'AM' : 'PM';

            const endTime = end.split(':')[0];
            const endAmPm = end.includes('AM') ? 'AM' : 'PM';

            return `${startTime} ${startAmPm} - ${endTime} ${endAmPm}`;
        },
        processHeatmapData(data) {
            this.heatmapDataStore = {...data};
        },
        emitDateChange() {
            const startDate = this.formatDateForApi(this.currentStartDate);

            // Calculate the end date as start date + 6 days (for 7 days total, inclusive)
            const endDate = new Date(this.currentStartDate);
            endDate.setDate(endDate.getDate() + 6);

            // Ensure end date is not in the future
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            const finalEndDate = endDate > today ? today : endDate;

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
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

                if (newDate > today) {
                    newDate.setTime(today.getTime());
                }
            } else {
                newDate.setDate(newDate.getDate() - this.daysToShow);
            }

            // Apply a slide animation by incrementing the key
            this.tableKey++;

            // Update dates after a short delay to allow the animation to complete
            setTimeout(() => {
                this.currentStartDate = newDate;

                // Update the dateRange to reflect the new visible dates
                const endDate = new Date(newDate);
                endDate.setDate(endDate.getDate() + (this.daysToShow - 1)); // Use days - 1 for exact 7 days

                // Ensure end date is not in the future
                const today = new Date();
                const finalEndDate = endDate > today ? today : endDate;

                // Modify the displayed date range to match the actual data range
                // For the display end date, subtract one day to show the correct inclusive range
                this.dateRange = [
                    this.formatDateForRange(newDate),
                    this.formatDateForRange(finalEndDate)
                ];

                this.isNavigating = false;
                this.emitDateChange();
            }, 300);
        },
        formatDateForRange(date) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        },
        handleDateRangeChange(range) {
            if (!range || !range[0] || !range[1]) return;

            // Parse the date strings and set the currentStartDate
            const startParts = range[0].split(" ");
            const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(startParts[0]);
            const day = parseInt(startParts[1].replace(',', ''));
            const year = parseInt(startParts[2]);

            // Parse end date
            const endParts = range[1].split(" ");
            const endMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(endParts[0]);
            const endDay = parseInt(endParts[1].replace(',', ''));
            const endYear = parseInt(endParts[2]);

            // Create dates
            const newStartDate = new Date(year, month, day);
            const newEndDate = new Date(endYear, endMonth, endDay);

            // Calculate days between (inclusive)
            const diffTime = Math.abs(newEndDate - newStartDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            // If they selected more than 7 days, adjust the end date
            if (diffDays > 7) {
                const adjustedEndDate = new Date(newStartDate);
                adjustedEndDate.setDate(adjustedEndDate.getDate() + 6); // 7 days inclusive

                // Update the displayed range
                this.dateRange = [
                    this.formatDateForRange(newStartDate),
                    this.formatDateForRange(adjustedEndDate)
                ];
            }

            // Check for future dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (newStartDate > today) {
                newStartDate.setTime(today.getTime());
            }

            this.currentStartDate = newStartDate;
            this.tableKey++; // Force re-render
            this.emitDateChange();
        },
        highlightCell(event, timeSlotIndex, date) {
            const value = this.getValueForCell(timeSlotIndex, date);
            const dateStr = this.formatDateForDisplay(date);
            const timeSlot = this.timeSlots[timeSlotIndex];

            this.tooltip.text = `${dateStr} | ${timeSlot}: ${value} entries`;
            this.tooltip.visible = true;

            // Position the tooltip near the cell
            const rect = event.target.getBoundingClientRect();
            const gridRect = this.$refs.gridWrapper.getBoundingClientRect();

            this.tooltip.style = {
                top: `${rect.top - gridRect.top + rect.height + 10}px`,
                left: `${rect.left - gridRect.left + (rect.width / 2) - 75}px`
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

<style scoped>
.heatmap-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    padding: 20px;
    width: 100%;
    position: relative;
}

.table-container {
    overflow-x: auto;
    width: 100%;
    position: relative;
}

.heatmap-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
    padding: 12px 0;
}

/* Grid Layout */
.heatmap-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px; /* Gap between rows */
}

.header-row, .data-row {
    display: grid;
    grid-template-columns: 120px repeat(8, 1fr); /* First column for date/navigation, then 8 columns for time slots */
    gap: 10px; /* Gap between cells */
    align-items: center;
}

.navigation-cell {
    grid-column: 1;
    padding: 8px 0;
}

.nav-controls {
    display: flex;
    gap: 8px;
}

.nav-btn {
    width: 32px;
    height: 32px;
    border: 1px solid #dcdfe6;
    background-color: white;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
    background-color: #f5f7fa;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.time-header {
    text-align: center;
    color: #606266;
    font-size: 13px;
    font-weight: normal;
}

.date-cell {
    padding: 8px 12px;
    color: #606266;
    font-size: 14px;
    text-align: left;
    white-space: nowrap;
    font-weight: 500;
}

.data-cell {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    color: #333;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.data-cell:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    z-index: 2;
}

/* Cell colors */
.empty {
    background-color: #f8f9fa;
    color: #888;
    border: 1px solid #e9ecef;
}

.level-1 {
    background-color: #dcf0f9;
    color: #333;
}

.level-2 {
    background-color: #72cff5;
    color: #333;
}

.level-3 {
    background-color: #28a7f0;
    color: white;
}

.level-4 {
    background-color: #1c93d5;
    color: white;
}

.level-5 {
    background-color: #0f77ad;
    color: white;
}

/* Tooltip */
.tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    z-index: 10;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Slide transition animations */
.slide-fade-enter-active, .slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.slide-fade-leave-to {
    opacity: 0;
    transform: translateX(-30px);
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.loading-spinner i {
    font-size: 32px;
    color: #7B5CFA;
}

@media (max-width: 768px) {
    .header-row, .data-row {
        grid-template-columns: 100px repeat(8, minmax(60px, 1fr));
        gap: 6px;
    }
}
</style>
<template>
    <div class="heatmap-container">
        <div class="heatmap-header">
            <h3>Entries grouped by</h3>
            <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="-"
                value-format="MMM d, yyyy"
                format="MMM d, yyyy"
                @change="handleDateRangeChange"
            />
        </div>

        <div class="table-container">
            <div class="heatmap-table-wrapper" ref="tableWrapper">
                <transition name="slide-fade" mode="out-in">
                    <table class="heatmap-table" :key="tableKey">
                        <thead>
                        <tr>
                            <th>
                                <div class="nav-controls">
                                    <button
                                        class="nav-btn"
                                        @click="navigateDates('prev')"
                                        :disabled="isNavigating"
                                    >
                                        <i class="el-icon-arrow-left"></i>
                                    </button>
                                    <button
                                        class="nav-btn"
                                        @click="navigateDates('next')"
                                        :disabled="isNavigating"
                                    >
                                        <i class="el-icon-arrow-right"></i>
                                    </button>
                                </div>
                            </th>
                            <th v-for="(day, index) in visibleDays" :key="index" class="day-header">
                                {{ formatDayHeader(day) }}
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(timeSlot, rowIndex) in timeSlots" :key="rowIndex">
                            <td class="time-cell">{{ timeSlot }}</td>
                            <td
                                v-for="(day, colIndex) in visibleDays"
                                :key="`${rowIndex}-${colIndex}`"
                                class="data-cell"
                                :class="getCellClass(getValueForCell(rowIndex, day))"
                                @mouseenter="highlightCell($event, rowIndex, day)"
                                @mouseleave="removeHighlight()"
                            >
                                {{ getValueForCell(rowIndex, day) }}
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </transition>
            </div>

            <div v-if="tooltip.visible" class="tooltip" :style="tooltip.style">
                {{ tooltip.text }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            dateRange: ['Mar 1, 2023', 'Mar 30, 2023'],
            currentStartDate: new Date(2023, 2, 1), // March 1, 2023
            daysToShow: 14,
            timeSlots: [
                "12:00 AM-02:00 AM",
                "02:00 AM-04:00 AM",
                "04:00 AM-06:00 AM",
                "06:00 AM-08:00 AM",
                "08:00 AM-10:00 AM",
                "10:00 AM-12:00 PM",
                "12:00 PM-02:00 PM",
                "02:00 PM-04:00 PM",
                "04:00 PM-06:00 PM",
                "06:00 PM-08:00 PM",
                "08:00 PM-10:00 PM",
                "10:00 PM-12:00 AM"
            ],
            // This will store our complete heatmap data, indexed by date and time slot
            heatmapDataStore: {},
            isNavigating: false,
            tableKey: 0, // Used to force table re-render during transitions
            tooltip: {
                visible: false,
                text: '',
                style: {
                    top: '0px',
                    left: '0px'
                }
            }
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

            return days;
        }
    },
    created() {
        this.generateSampleData();
    },
    methods: {
        // Generate random data for demonstration
        generateSampleData() {
            const startDate = new Date(2023, 0, 1); // January 1, 2023
            const endDate = new Date(2023, 11, 31); // December 31, 2023

            const currentDate = new Date(startDate);

            while (currentDate <= endDate) {
                const dateKey = this.formatDateKey(currentDate);
                this.heatmapDataStore[dateKey] = {};

                this.timeSlots.forEach((slot, index) => {
                    // Generate random values following distribution similar to the example
                    let value;
                    const rand = Math.random();

                    if (rand < 0.15) {
                        value = 0;
                    } else if (rand < 0.3) {
                        value = Math.floor(Math.random() * 2) + 1; // 1-2
                    } else if (rand < 0.7) {
                        value = Math.floor(Math.random() * 3) + 3; // 3-5
                    } else if (rand < 0.85) {
                        value = Math.floor(Math.random() * 15) + 6; // 6-20
                    } else if (rand < 0.95) {
                        value = Math.floor(Math.random() * 20) + 21; // 21-40
                    } else {
                        value = Math.floor(Math.random() * 200) + 41; // 41-240
                    }

                    this.heatmapDataStore[dateKey][index] = value;
                });

                currentDate.setDate(currentDate.getDate() + 1);
            }
        },
        formatDateKey(date) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        },
        formatDayHeader(date) {
            const day = String(date.getDate()).padStart(2, '0');
            const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
            const weekday = weekdays[date.getDay()];
            return `${day} ${weekday}`;
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
            if (this.isNavigating) return;

            this.isNavigating = true;
            const newDate = new Date(this.currentStartDate);

            if (direction === 'next') {
                newDate.setDate(newDate.getDate() + this.daysToShow);
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
                endDate.setDate(endDate.getDate() + this.daysToShow - 1);

                this.dateRange = [
                    this.formatDateForRange(newDate),
                    this.formatDateForRange(endDate)
                ];

                this.isNavigating = false;
            }, 300); // Match this with the CSS transition duration
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

            this.currentStartDate = new Date(year, month, day);
            this.tableKey++; // Force re-render
        },
        highlightCell(event, timeSlotIndex, date) {
            const value = this.getValueForCell(timeSlotIndex, date);
            const dateStr = this.formatDateForDisplay(date);
            const timeSlot = this.timeSlots[timeSlotIndex];

            this.tooltip.text = `${dateStr} | ${timeSlot}: ${value} entries`;
            this.tooltip.visible = true;

            // Position the tooltip near the cell
            const rect = event.target.getBoundingClientRect();
            const tableRect = this.$refs.tableWrapper.getBoundingClientRect();

            this.tooltip.style = {
                top: `${rect.top - tableRect.top + rect.height + 10}px`,
                left: `${rect.left - tableRect.left + (rect.width / 2) - 75}px`
            };
        },
        removeHighlight() {
            this.tooltip.visible = false;
        },
        formatDateForDisplay(date) {
            const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
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

.heatmap-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.heatmap-header h3 {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.table-container {
    overflow-x: auto;
    width: 100%;
    position: relative;
}

.heatmap-table-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
}

.nav-controls {
    margin-bottom: 12px;
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

.heatmap-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 6px;
}

.heatmap-table th {
    font-weight: normal;
    color: #606266;
    padding: 8px 0;
    white-space: nowrap;
    text-align: center;
    font-size: 14px;
}

.day-header {
    padding: 8px 0;
    font-weight: normal;
}

.time-cell {
    padding: 0 12px;
    color: #606266;
    font-size: 14px;
    text-align: left;
    white-space: nowrap;
}

.data-cell {
    width: 80px;
    height: 40px;
    text-align: center;
    border-radius: 4px;
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

@media (max-width: 768px) {
    .heatmap-header {
        flex-direction: column;
        align-items: flex-start;
    }

    .heatmap-header h3 {
        margin-bottom: 12px;
    }

    .data-cell {
        min-width: 60px;
        height: 35px;
    }
}
</style>
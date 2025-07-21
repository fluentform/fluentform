<template>
    <div class="reports-date-range-controls">
        <!-- Quick select for date ranges -->
        <div class="report-date-quick-select-wrapper">
            <el-select
                popper-class="report-date-quick-select-popper"
                v-model="modalSelectedRange"
                placeholder="Select date range"
                @visible-change="(state) => isDateQuickSelectOpen = state"
                size="medium"
                style="margin-right: 10px; width: 130px;"
            >
                <el-option label="Today" value="today"></el-option>
                <el-option label="Yesterday" value="yesterday"></el-option>
                <el-option label="Last 7 days" value="week"></el-option>
                <el-option label="Last month" value="month"></el-option>
                <el-option label="Last 3 months" value="3_months"></el-option>
                <el-option label="Last 6 months" value="6_months"></el-option>
                <el-option label="Last Year" value="year"></el-option>
            </el-select>
            <!-- Overlay the custom arrow on top of the default one -->
            <div class="report-date-quick-select-arrow" :class="{ 'is-reverse': isDateQuickSelectOpen }">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 12.25L5.5 7.75H14.5L10 12.25Z" fill="#525866"/>
                </svg>
            </div>
        </div>

        <!-- Date picker for manual selection -->
        <el-date-picker
            popper-class="report-date-picker-popper"
            v-model="modalDateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="Start date"
            end-placeholder="End date"
            :default-time="['00:00:00', '23:59:59']"
            value-format="MMM d, yyyy"
            format="MMM d, yyyy"
            :disabled-date="disableFutureDates"
            size="medium"
        />
    </div>
</template>

<script>
export default {
    name: 'DateRangeControls',
    props: {
        selectedRange: {
            type: String,
            default: 'month'
        },
        dateRange: {
            type: Array,
            default: () => []
        }
    },
    emits: ['range-select', 'date-range-change'],
    data() {
        return {
            isDateQuickSelectOpen: false
        };
    },
    methods: {
        disableFutureDates(date) {
            return date > new Date();
        }
    },
    computed: {
        modalSelectedRange : {
            get() {
                return this.selectedRange;
            },
            set(value) {
                this.$emit('range-select', value);
            }
        },
        modalDateRange : {
            get() {
                return this.dateRange;
            },
            set(value) {
                this.$emit('date-range-change', value);
            }
        }
    }
};
</script>
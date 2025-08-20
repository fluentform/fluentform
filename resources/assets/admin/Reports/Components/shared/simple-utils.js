/**
 * Simple Shared Utilities - Only What's Actually Used!
 */

// Chart colors - only the ones actually being used
export const COLORS = {
    submissions: '#8b5cf6',
    views: '#017EF3',
    paid: '#10b981',
    pending: '#f59e0b',
    refunded: '#ef4444',
    spam: '#ef4444',
    unread: '#f59e0b',
    read: '#10b981',
    trashed: '#A0AEC0',
    revenue: '#7D52F4',
    cancelled: '#FB3748',
    failed: '#FB3748',
    // Colors ordered from lightest to strongest (bottom to top bars)
    topPerformingBars: ['#DCD5FF','#CAC0FF', '#A897FF', '#8C71F6', '#7D52F4']
};

// Simple chart loader component
export const ChartLoader = {
    template: `
        <div class="chart-loader">
            <el-skeleton :rows="rows" animated />
        </div>
    `,
    props: {
        rows: { type: Number, default: 8 }
    }
};

// Simple no-data component
export const NoData = {
    template: `
        <div class="no-data-info">
            <i class="el-icon-data-analysis" style="font-size: 48px; color: #ddd; margin-bottom: 16px;"></i>
            <p>{{ message }}</p>
        </div>
    `,
    props: {
        message: { type: String, default: 'No data available' }
    }
};

// Number formatting function
export function formatNumber(value) {
    if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(0).toString();
}

// Currency formatting function
export function formatCurrency(value, currencySymbol = '$') {
    const formatted = formatNumber(value);
    return `${currencySymbol}${formatted}`;
}

// Get currency symbol from HTML entities
export function getCurrencySymbol(htmlEntity = '$') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = htmlEntity;
    return textarea.value;
}

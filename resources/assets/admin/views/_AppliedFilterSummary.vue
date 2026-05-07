<template>
    <div v-if="hasFilters" class="ff_applied_filters_summary">
        <span class="ff_applied_filters_label">
            <i class="el-icon-search"></i>
            {{ $t('Active Filters:') }}
        </span>
        <template v-for="(group, gi) in summary">
            <span
                v-if="gi > 0"
                :key="'or_' + gi"
                class="ff_filter_or_separator">
                {{ $t('OR') }}
            </span>
            <el-tag
                :key="'group_' + gi"
                closable
                type="info"
                size="small"
                class="ff_filter_chip"
                @close="$emit('clear-group', gi)">
                <template v-for="(item, ii) in group">
                    <span
                        v-if="ii > 0"
                        :key="'and_' + ii"
                        class="ff_filter_and_separator">
                        {{ $t('AND') }}
                    </span>
                    <span :key="'item_' + ii" class="ff_filter_item_text">
                        <strong>{{ item.fieldLabel }}</strong>
                        {{ item.operatorLabel }}
                        <em>{{ item.displayValue }}</em>
                    </span>
                </template>
            </el-tag>
        </template>
        <el-button
            size="mini"
            plain
            type="danger"
            icon="el-icon-close"
            class="ff_clear_all_filters"
            @click="$emit('clear-all')">
            {{ $t('Clear All') }}
        </el-button>
    </div>
</template>

<script>
/**
 * Renders the active advanced filters above the entries table as a row of
 * removable chips. Receives the raw filter array and looks up
 * human-readable labels (field names, operator labels) from the global
 * fluent_form_entries_vars provided by the backend.
 *
 * Emits:
 *  - clear-group(index): user closed a chip; parent should drop that group
 *  - clear-all: user clicked "Clear All"; parent should reset filters
 */
export default {
    name: 'AppliedFilterSummary',
    props: {
        filters: {
            type: Array,
            default: () => []
        }
    },
    computed: {
        hasFilters() {
            if (!Array.isArray(this.filters)) return false;
            return this.filters.some(group => Array.isArray(group) && group.length > 0);
        },
        filterOptions() {
            return (window.fluent_form_entries_vars
                && window.fluent_form_entries_vars.advanced_filters) || [];
        },
        operators() {
            return (window.fluent_form_entries_vars
                && window.fluent_form_entries_vars.advanced_filters_operators) || {};
        },
        summary() {
            if (!this.hasFilters) return [];
            return this.filters
                .filter(group => Array.isArray(group) && group.length > 0)
                .map(group => group.map(item => ({
                    fieldLabel: this.lookupFieldLabel(item.source),
                    operatorLabel: this.operators[item.operator] || item.operator,
                    displayValue: this.formatValue(item.value)
                })));
        }
    },
    methods: {
        lookupFieldLabel(source) {
            if (!Array.isArray(source) || source.length < 2) return '';
            const [provider, fieldName] = source;
            const providerGroup = this.filterOptions.find(opt => opt.value === provider);
            if (!providerGroup || !providerGroup.children) return fieldName;
            const field = providerGroup.children.find(child => child.value === fieldName);
            return field ? `${providerGroup.label} / ${field.label}` : fieldName;
        },
        formatValue(value) {
            if (value === null || value === undefined || value === '') {
                return this.$t('(empty)');
            }
            if (Array.isArray(value)) return value.join(', ');
            return String(value);
        }
    }
};
</script>

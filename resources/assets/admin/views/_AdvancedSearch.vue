<template>
    <div class="ff_as_container" v-show="advanced_filter" @keyup.enter="handleEnterKey">
        <div class="ff_filter_help_bar">
            <i class="el-icon-info"></i>
            <span>
                {{ $t('Conditions inside a group are joined with') }}
                <strong>{{ $t('AND') }}</strong>.
                {{ $t('Multiple groups are joined with') }}
                <strong>{{ $t('OR') }}</strong>.
            </span>
        </div>
        <div v-for="(rich_filter, filterIndex) in advanced_filters" :key="filterIndex" class="ff_filter_group_wrap">
            <div class="fc_rich_filter">
                <rich-filter
                    :filterOptions="editorShortcodes"
                    :add_label="filterLabel"
                    :items="rich_filter"
                    :can-remove="advanced_filters.length > 1"
                    @maybeRemove="maybeRemoveGroup(filterIndex)" />

                <div v-if="rich_filter.length > 0" class="ff_filter_group_actions">
                    <el-button
                        @click="duplicateGroup(filterIndex)"
                        size="mini"
                        plain
                        icon="el-icon-document-copy"
                        :title="$t('Duplicate this group with all conditions')">
                        {{ $t('Duplicate Group') }}
                    </el-button>
                    <el-button
                        v-if="advanced_filters.length > 1"
                        @click="maybeRemoveGroup(filterIndex)"
                        size="mini"
                        plain
                        type="danger"
                        icon="el-icon-delete"
                        :title="$t('Remove this filter group')">
                    </el-button>
                </div>
            </div>


            <div
                v-if="rich_filter.length > 0 && filterIndex === advanced_filters.length - 1"
                class="ff_cond_or_wrap">
                <button
                    type="button"
                    class="ff_add_or_group_btn"
                    @click="addConditionGroup()"
                    :title="$t('Add another filter group combined with OR')">
                    <i class="el-icon-plus"></i>
                    <span>{{ $t('Add OR Group') }}</span>
                </button>
            </div>
            <div
                v-else-if="filterIndex < advanced_filters.length - 1"
                class="ff_or_separator"
                :title="$t('Entries matching either group are returned')">
                <span>{{ $t('OR') }}</span>
            </div>


        </div>
        <el-row :gutter="20">
            <el-col :md="12" :xs="24">
                <el-button
                    type="primary"
                    size="small"
                    @click="runSearch"
                    :class="{'ff_filter_btn_modified': hasUnappliedChanges}"
                    :title="hasUnappliedChanges ? $t('You have unapplied filter changes') : ''">
                    {{ $t('Filter') }}<span v-if="hasUnappliedChanges" class="ff_filter_modified_dot">●</span>
                </el-button>
            </el-col>
            <el-col :md="12" :xs="24">
                <div class="text-right">
                    <el-button type="default" size="small" @click="advanced_filters = [[]]; runSearch()">
                        {{ $t('Clear Filters') }}
                    </el-button>

                </div>
            </el-col>
        </el-row>
    </div>
</template>
<script>
    import RichFilter from './EntryFilters/Filters';
    export default {
        name: 'AdvancedSearch',
        props: {
            advanced_filter: {},

        },
        components: {
            RichFilter,
        },
        data() {
            return {
                app_ready: false,
                subscribers: [],
                loading: true,
                pagination: {
                    current_page: 1,
                    per_page: 10,
                    total: 0
                },
                editorShortcodes: [],
                advanced_filters: [[]],
                lastAppliedFilters: '[[]]',
                filterLabel: this.$t('Add your filters here'),}
        },
        computed: {
            /**
             * True when the current filter state differs from the last applied
             * filter snapshot. Used to show a subtle "unsaved changes" hint
             * on the Filter button.
             */
            hasUnappliedChanges() {
                return JSON.stringify(this.advanced_filters) !== this.lastAppliedFilters;
            }
        },
        methods: {
            fetchAllEditorShortcodes() {
                this.editorShortcodes = window.fluent_form_entries_vars.advanced_filters || []
            },
            maybeRemoveGroup(index) {
                if (this.advanced_filters.length > 1) {
                    this.advanced_filters.splice(index, 1);
                }
            },
            /**
             * Duplicate a filter group with all its conditions.
             * Inserts the clone immediately after the source group so the
             * user can quickly tweak the duplicate's values.
             */
            duplicateGroup(index) {
                const sourceGroup = this.advanced_filters[index];
                if (!sourceGroup || !sourceGroup.length) {
                    return;
                }
                const clonedGroup = JSON.parse(JSON.stringify(sourceGroup));
                this.advanced_filters.splice(index + 1, 0, clonedGroup);
            },
            runSearch(){
                this.lastAppliedFilters = JSON.stringify(this.advanced_filters);
                this.$emit("runSearch", this.advanced_filters);
            },
            /**
             * Trigger the filter when the user presses Enter from any input
             * inside the panel. We blur the active element so the user gets
             * an obvious "I just submitted" feedback (collapsed cursor) and
             * any open Element UI popovers (cascader, select) aren't
             * inadvertently submitted by their internal Enter handlers.
             */
            handleEnterKey(event) {
                // Skip when an Element UI dropdown/cascader is open: its
                // own Enter handler should win (selecting an option).
                const target = event && event.target;
                if (target && target.closest && target.closest('.el-select-dropdown, .el-cascader-panel, .el-popover')) {
                    return;
                }
                if (target && typeof target.blur === 'function') {
                    target.blur();
                }
                this.runSearch();
            },
            addConditionGroup() {
                this.advanced_filters.push([]);
            },
        },
        mounted() {
            this.fetchAllEditorShortcodes();
            this.lastAppliedFilters = JSON.stringify(this.advanced_filters);
        }
    }
</script>


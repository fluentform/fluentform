<template>
    <div class="ff_as_container" v-show="advanced_filter">
        <div v-for="(rich_filter, filterIndex) in advanced_filters" :key="filterIndex" class="ff_filter_group_wrap">
            <div class="fc_rich_filter">
                <rich-filter :filterOptions="editorShortcodes" :add_label="filterLabel" @maybeRemove="maybeRemoveGroup(filterIndex)" :items="rich_filter"/>

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


            <div class="ff_cond_or">
                <em @click="addConditionGroup()"
                    style="cursor: pointer; color: rgb(0, 119, 204); font-weight: bold;"><i
                        class="el-icon-plus"></i> {{ $t('OR') }}</em>
            </div>


        </div>
        <el-row :gutter="20">
            <el-col :md="12" :xs="24">
                <el-button type="primary" size="small" @click="runSearch">{{ $t('Filter') }}</el-button>
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
                filterLabel: this.$t('Filters Info'),}
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
                this.$emit("runSearch", this.advanced_filters);
            },
            addConditionGroup() {
                this.advanced_filters.push([]);
            },
        },
        mounted() {
            this.fetchAllEditorShortcodes();
        }
    }
</script>

<style>
.ff_as_container .ff_filter_group_wrap {
    position: relative;
}
.ff_as_container .fc_rich_filter {
    position: relative;
}
.ff_as_container .ff_filter_group_actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 8px 12px 4px;
    border-top: 1px dashed #e4e7ed;
    margin-top: 4px;
}
.ff_as_container .ff_filter_group_actions .el-button {
    font-size: 12px;
}
</style>

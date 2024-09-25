<template>
    <!--Advance Filters -->
    <el-form-item>
        <template #label>
            <el-label
                :label="$t('Filters')"
                :help-text="
                    $t(
                        'Refine search results by specifying database query filters. Utilize logical operators like AND/OR to group multiple filters, ensuring more precise filtering.'
                    )
                "
            ></el-label>
        </template>
        <div v-if="model.length" class="ff-dynamic-filter-wrap">
            <div v-for="(groups, groupsIndex) in model" :key="'groups_' + groupsIndex">
                <div v-if="groupsIndex !== 0" class="ff-dynamic-filter-condition condition-or">
                    <span class="condition-border"></span>
                    <span class="condition-item">OR</span>
                    <span class="condition-border"></span>
                </div>
                <div class="ff-dynamic-filter-groups">
                    <!-- Filters Group-->
                    <dynamic-filter-group
                        v-for="(group, groupIndex) in groups"
                        :key="'group_' + groupsIndex + groupIndex"
                        :group="group"
                        :groups="groups"
                        :groupsIndex="groupsIndex"
                        :add-and-text="groupIndex !== 0"
                        :list-item="listItem"
                        :filter-columns="filterColumns"
                        :filter_value_options="filter_value_options"
                        @add-group="addFilter(groupsIndex, groupIndex)"
                        @remove-group="removeFilter(groupsIndex, groupIndex)"
                        @update-filter-value-options="updateFilterValueOptions"
                    ></dynamic-filter-group>
                </div>
            </div>
        </div>
        <div>
            <el-button @click="addFilterGroup" type="primary" size="small" icon="el-icon-plus"
                >{{ $t('Add Filter Group') }}
            </el-button>
        </div>
    </el-form-item>
</template>

<script type="text/babel">
import elLabel from '@/admin/components/includes/el-label.vue';
import dynamicFilterGroup from './DynamicFilterGroup.vue';

export default {
    name: 'DynamicAdvanceFilter',
    props: ['listItem', 'filterColumns', 'filter_value_options', 'value'],
    components: {
        elLabel,
        dynamicFilterGroup,
    },
    data() {
        return {};
    },
    methods: {
        addFilterGroup() {
            this.model = [
                ...this.model,
                [
                    {
                        column: '',
                        custom: false,
                        operator: '',
                        value: '',
                    },
                ],
            ];
        },

        removeFilter(groupsIndex, index) {
            this.model[groupsIndex].splice(index, 1);
            if (this.model[groupsIndex].length === 0) {
                this.model.splice(groupsIndex, 1);
            }
        },

        addFilter(groupsIndex, index) {
            this.model[groupsIndex].splice(index + 1, 0, {
                column: '',
                custom: false,
                operator: '',
                value: '',
            });
        },

        updateFilterValueOptions(key, options) {
            this.$emit('update-filter-value-options', key, options);
        },
    },
    computed: {
        model: {
            get() {
                return this.value;
            },
            set(value) {
                this.$emit('input', value);
            },
        },
    },
};
</script>

<template>
    <div class="ff_rich_filters">
        <table v-if="items.length && !working" style="width: 100%;" class="ff_table">
            <tbody>
            <filter-item
                v-for="(item, itemKey) in items"
                :view_only="view_only"
                @removeItem="removeItem(itemKey)"
                :key="itemKey"
                :filterLabels="filterLabels" :item="item"
            />
            </tbody>
        </table>

        <div v-if="items.length === 0" class="ff_filter_intro ff_pad_around_5 mt-2">
            <el-popover
                :placement="isRTL ? 'left' : 'right'"
                width="450"
                class="ff_contact_filter_pop"
                v-model="addVisible"
                trigger="click">
                <el-cascader-panel
                    @change="maybeSelected"
                    style="width: 100%"
                    :options="filterOptions"
                    v-model="new_item"
                />
                <template #reference>
                    <el-button @click="addVisible = !addVisible" size="small">
                        {{ $t('Add') }}
                        <template #icon>
                            <i class="el-icon-plus"></i>
                        </template>
                    </el-button>
                </template>
            </el-popover>
            {{ $t(add_label) }}
            <el-button
                style="float: right;"
                @click="$emit('maybeRemove')"
                size="small"
                type="danger"
            >
                <template #icon>
                    <i class="el-icon-delete"></i>
                </template>
            </el-button>
        </div>

        <div v-else-if="!view_only" class="ff_filter_intro ff_pad_around_5 mt-2">
            <el-popover
                :placement="isRTL ? 'left' : 'right'"
                width="450"
                v-model="addVisible"
                trigger="click">
                <el-cascader-panel
                    @change="maybeSelected"
                    style="width: 100%"
                    :options="filterOptions"
                    v-model="new_item"
                />
                <template #reference>
                    <el-button @click="addVisible = !addVisible" size="small">
                        <template #icon>
                            <i class="el-icon-plus"></i>
                        </template>
                        {{ $t('Add') }}
                    </el-button>
                </template>
            </el-popover>
            {{ $t(add_label) }}
        </div>
    </div>
</template>
<script>
import FilterItem from './_FilterItem.vue';
import popover from '../../../common/input-popover-dropdown.vue';
import each from 'lodash/each.js';

export default {
    name: 'RichContactFilter',
    components: {
        FilterItem, popover
    },
    props: {
        items: {
            type: Array,
            default: () => []
        },
        add_label: {
            type: String,
            default() {
                return this.$t('Filters.instruction');
            }
        },
        filterOptions: {
            type: Array,
            default() {
                return [];
            }
        },
        view_only: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    data() {
        return {
            addVisible: false,
            new_item: [],
            working: false,
            isRTL: false
        }
    },
    computed: {
        filterLabels() {
            const options = {};


            each(this.filterOptions, (option) => {
                each(option.children, (item) => {
                    options[option.value + '-' + item.value] = {
                        provider: option.value,
                        ...item
                    }
                });
            });
            return options;
        }
    },
    methods: {
        handleCommand(command) {
            console.log(command)
        },
        maybeSelected() {
            if (this.new_item.length == 2) {
                let operator = '';

                if (this.new_item[0] == 'subscriber' && this.new_item[1] != 'country') {
                    operator = 'contains';
                }

                this.items.push({
                    source: [...this.new_item],
                    operator: operator,
                    value: ''
                });
                this.addVisible = false;
                this.new_item = [];
            }
        },
        removeItem(index) {
            this.working = true;
            this.$nextTick(() => {
                this.items.splice(index, 1);
                if (!this.items.length) {
                    this.$emit('maybeRemove');
                }
                this.working = false;
            });
        }
    }
}
</script>

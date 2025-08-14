<template>
    <div :class="{ ff_backdrop: show }">
        <el-dialog :v-model="show" width="50%">
            <template #header>
                <h4 class="mb-2">{{ label }}</h4>
                <p>{{ description }}</p>
            </template>

            <div class="mt-2" v-if="options.length">
                <el-table :data="options" stripe style="width: 100%" max-height="500">
                    <template v-if="dynamic && dynamicColumns.length">
                        <el-table-column
                            v-for="(column, i) in dynamicColumns"
                            :prop="column.prop"
                            :label="$t(column.label)"
                            :key="column.prop"
                            :min-width="i === 0 ? '80' : '150'"
                            :fixed="i === 0"
                        ></el-table-column>
                    </template>

                    <template v-else>
                        <template>
                            <el-table-column v-if="isCheckable">
                                <template #header>
                                    <span>
                                        {{ $t('Value') }}
                                        <el-tooltip
                                            :content="$t('Check if you want to be used value as the default value.')"
                                            placement="top"
                                        >
                                            <i class="ff-icon el-icon-info"></i>
                                        </el-tooltip>
                                    </span>
                                </template>
                                <template #default="scope">
                                    <el-checkbox v-model="selectedValues">{{ scope.row.value }}</el-checkbox>
                                </template>
                            </el-table-column>
                            <el-table-column v-else>
                                <template #header>
                                    <span>
                                        {{ $t('Value') }}
                                        <el-tooltip
                                            :content="
                                                $t('Select option if you want to be used value as the default value.')
                                            "
                                            placement="top"
                                        >
                                            <i class="ff-icon el-icon-info"></i>
                                        </el-tooltip>
                                    </span>
                                </template>
                                <template #scope>
                                    <el-radio
                                        v-model="defaultValue"
                                        :value="scope.row.value"
                                        @change="$emit('close-modal')"
                                    ></el-radio>
                                </template>
                            </el-table-column>

                            <el-table-column prop="label" :label="$t('Label')"></el-table-column>
                        </template>
                    </template>
                </el-table>
            </div>
            <div v-else>
                <p>{{ $t('Empty Options') }}</p>
            </div>
        </el-dialog>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'DynamicFilterOptionsDialog',
    props: ['visible', 'options', 'dynamic', 'type', 'value'],
    data() {
        return {
            selectedValues: Array.isArray(this.value) ? this.value : [],
        };
    },
    watch: {
        selectedValues() {
            this.$emit('input', this.selectedValues);
        },
    },
    computed: {
        defaultValue: {
            get() {
                return this.value;
            },
            set(value) {
                this.$emit('input', value);
            },
        },
        show: {
            get() {
                return this.visible;
            },
            set() {
                this.$emit('close-modal');
            },
        },
        dynamicColumns() {
            const keys = Object.keys(this.options[0] || {});
            return keys.map(key => ({
                prop: key,
                label: _ff.startCase(key),
            }));
        },
        label() {
            let label = this.$t('Options');
            if ('result' === this.type) {
                label = this.$t('Results');
            }
            return label;
        },
        isCheckable() {
            return ['multi_select', 'checkbox'].includes(this.type);
        },
        description() {
            let description = this.$t('Valid options make by template mapping');
            if ('result' === this.type) {
                description = this.$t('Result found by filters');
            }
            return description;
        },
    },
};
</script>

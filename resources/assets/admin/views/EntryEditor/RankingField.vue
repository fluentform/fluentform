<template>
    <div class="ff-entry-ranking-editor">
        <div
            v-for="(item, index) in orderedItems"
            :key="`${item.value}-${index}`"
            class="ff-entry-ranking-editor__item"
        >
            <span class="ff-entry-ranking-editor__index">{{ index + 1 }}</span>
            <span class="ff-entry-ranking-editor__label">{{ item.label }}</span>
            <div class="ff-entry-ranking-editor__actions">
                <el-button
                    icon="el-icon-arrow-up"
                    size="mini"
                    circle
                    :aria-label="$t('Move up')"
                    :title="$t('Move up')"
                    @click="move(index, -1)"
                    :disabled="index === 0"
                ></el-button>
                <el-button
                    icon="el-icon-arrow-down"
                    size="mini"
                    circle
                    :aria-label="$t('Move down')"
                    :title="$t('Move down')"
                    @click="move(index, 1)"
                    :disabled="index === orderedItems.length - 1"
                ></el-button>
            </div>
        </div>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'ranking-field',
    props: ['value', 'type', 'field'],
    data() {
        return {
            orderedItems: []
        };
    },
    watch: {
        value: {
            handler() {
                this.buildItems();
            },
            deep: true
        },
        'field.raw.settings.advanced_options': {
            handler() {
                this.buildItems();
            },
            deep: true
        }
    },
    methods: {
        parseCurrentValue() {
            if (Array.isArray(this.value)) {
                return {
                    values: this.value.map(String),
                    shouldSync: true
                };
            }

            if (typeof this.value === 'string' && this.value) {
                try {
                    const parsedValue = JSON.parse(this.value);
                    if (Array.isArray(parsedValue)) {
                        return {
                            values: parsedValue.map(String),
                            shouldSync: true
                        };
                    }
                } catch (e) {
                    // Ignore invalid string payloads and avoid rewriting them on open.
                }
            }

            return {
                values: [],
                shouldSync: false
            };
        },
        flattenOptions(options) {
            const flattened = [];

            (options || []).forEach(option => {
                if (option && option.type === 'group' && Array.isArray(option.options)) {
                    option.options.forEach(groupOption => {
                        if (groupOption && groupOption.value !== undefined) {
                            flattened.push(groupOption);
                        }
                    });
                    return;
                }

                if (option && option.value !== undefined) {
                    flattened.push(option);
                }
            });

            return flattened;
        },
        buildItems() {
            const optionItems = this.flattenOptions(
                (((this.field || {}).raw || {}).settings || {}).advanced_options || []
            );
            const options = optionItems.reduce((formatted, option) => {
                formatted[String(option.value)] = option.label || option.value;
                return formatted;
            }, {});
            const optionValues = Object.keys(options);
            const optionValueSet = new Set(optionValues);
            const currentValueState = this.parseCurrentValue();
            const currentValue = currentValueState.values;
            const normalizedValues = [];
            const usedValues = new Set();

            currentValue.forEach(value => {
                if (!optionValueSet.has(value) || usedValues.has(value)) {
                    return;
                }

                usedValues.add(value);
                normalizedValues.push(value);
            });

            const displayValues = normalizedValues.slice();

            optionValues.forEach(value => {
                if (usedValues.has(value)) {
                    return;
                }

                usedValues.add(value);
                displayValues.push(value);
            });

            this.orderedItems = displayValues.map(value => ({
                value,
                label: options[value] || value
            }));

            const hasChanged = normalizedValues.length !== currentValue.length ||
                normalizedValues.some((value, index) => currentValue[index] !== value);

            if (currentValueState.shouldSync && currentValue.length && hasChanged) {
                this.$emit('input', normalizedValues);
            }
        },
        move(index, delta) {
            const targetIndex = index + delta;
            if (targetIndex < 0 || targetIndex >= this.orderedItems.length) {
                return;
            }

            const orderedItems = this.orderedItems.slice();
            const item = orderedItems[index];
            orderedItems.splice(index, 1);
            orderedItems.splice(targetIndex, 0, item);
            this.orderedItems = orderedItems;
            this.$emit('input', this.orderedItems.map(item => item.value));
        }
    },
    mounted() {
        this.buildItems();
    }
}
</script>

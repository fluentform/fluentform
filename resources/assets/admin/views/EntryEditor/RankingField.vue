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
                <el-button icon="el-icon-arrow-up" size="mini" circle @click="move(index, -1)" :disabled="index === 0"></el-button>
                <el-button icon="el-icon-arrow-down" size="mini" circle @click="move(index, 1)" :disabled="index === orderedItems.length - 1"></el-button>
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
    methods: {
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
                formatted[option.value] = option.label || option.value;
                return formatted;
            }, {});
            const currentValue = Array.isArray(this.value) ? this.value.slice() : [];
            const items = [];

            currentValue.forEach(value => {
                items.push({
                    value,
                    label: options[value] || value
                });
            });

            Object.keys(options).forEach(value => {
                if (!currentValue.includes(value)) {
                    items.push({
                        value,
                        label: options[value] || value
                    });
                }
            });

            this.orderedItems = items;
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

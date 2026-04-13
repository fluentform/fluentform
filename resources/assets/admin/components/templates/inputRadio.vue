<template>
    <withLabel :item="item">
        <el-radio-group class="el-radio-horizontal" :value="selectedOptionIndex">
            <el-radio v-for="(option, i) in renderOptions" :label="i" :key="option._ff_option_id || i">
                {{ option.label }}
            </el-radio>
        </el-radio-group>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputRadio',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        renderOptions() {
            if (this.item.settings && Array.isArray(this.item.settings.advanced_options) && this.item.settings.advanced_options.length) {
                return this.item.settings.advanced_options;
            }

            return Object.keys(this.item.options || {}).map(value => ({
                value,
                label: this.item.options[value]
            }));
        },
        selectedOptionIndex() {
            const storedIds = this.getStoredSelectedOptionIds();

            if (storedIds.length) {
                return this.renderOptions.findIndex(option => storedIds.includes(String(option._ff_option_id)));
            }

            const storedIndexes = this.getStoredSelectedOptionIndexes();

            if (storedIndexes.length) {
                return storedIndexes[0];
            }

            const optionValues = this.renderOptions.map(option => String(option.value));
            const selectedValue = String(this.item.attributes.value || '');

            return optionValues.findIndex(value => String(value) === selectedValue);
        }
    },
    methods: {
        getStoredSelectedOptionIds() {
            if (!this.item.settings || !Array.isArray(this.item.settings.default_value_option_ids)) {
                return [];
            }

            return this.item.settings.default_value_option_ids.map(String);
        },
        getStoredSelectedOptionIndexes() {
            if (!this.item.settings || !Array.isArray(this.item.settings.default_value_option_indexes)) {
                return [];
            }

            return this.item.settings.default_value_option_indexes
                .map(index => parseInt(index, 10))
                .filter(index => !isNaN(index) && index >= 0);
        }
    }
}
</script>

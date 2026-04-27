<template>
    <withLabel :item="item">
        <div v-for="(option, i) in renderOptions" style="line-height: 25px;" :key="option._ff_option_id || i">
            <input type="checkbox" :value="option.value" :checked="isOptionSelected(option, i)"> {{ option.label }}
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputCheckbox',
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
        selectionState() {
            const storedIds = this.getStoredSelectedOptionIds();

            if (storedIds !== null) {
                return {
                    storedIds: new Set(storedIds),
                    storedIndexes: null,
                    occurrenceSelections: null
                };
            }

            const storedIndexes = this.getStoredSelectedOptionIndexes();

            if (storedIndexes !== null) {
                return {
                    storedIds: null,
                    storedIndexes: new Set(storedIndexes),
                    occurrenceSelections: null
                };
            }

            const counts = this.getDefaultValueCounts();
            const occurrences = {};
            const occurrenceSelections = new Set();

            this.renderOptions.forEach((option, index) => {
                const optionValue = String(option.value);

                if (!counts[optionValue]) {
                    return;
                }

                occurrences[optionValue] = (occurrences[optionValue] || 0) + 1;

                if (occurrences[optionValue] <= counts[optionValue]) {
                    occurrenceSelections.add(index);
                }
            });

            return {
                storedIds: null,
                storedIndexes: null,
                occurrenceSelections
            };
        }
    },
    methods: {
        getStoredSelectedOptionIds() {
            if (!this.item.settings || !Array.isArray(this.item.settings.default_value_option_ids)) {
                return null;
            }

            const validIds = this.item.settings.default_value_option_ids
                .map(String)
                .filter(optionId => this.renderOptions.some(option => String(option._ff_option_id) === optionId));

            return validIds.length ? validIds : null;
        },
        getStoredSelectedOptionIndexes() {
            if (!this.item.settings || !Array.isArray(this.item.settings.default_value_option_indexes)) {
                return null;
            }

            return this.item.settings.default_value_option_indexes
                .map(index => parseInt(index, 10))
                .filter(index => !isNaN(index) && index >= 0);
        },
        getDefaultValueCounts() {
            return [].concat(this.item.attributes.value || []).reduce((counts, value) => {
                value = String(value);
                counts[value] = (counts[value] || 0) + 1;

                return counts;
            }, {});
        },
        isOptionSelected(option, optionIndex) {
            const { storedIds, storedIndexes, occurrenceSelections } = this.selectionState;

            if (storedIds) {
                return storedIds.has(String(option._ff_option_id));
            }

            if (storedIndexes) {
                return storedIndexes.has(optionIndex);
            }

            return occurrenceSelections ? occurrenceSelections.has(optionIndex) : false;
        }
    }
}
</script>

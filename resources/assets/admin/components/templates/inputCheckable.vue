<template>
    <withLabel :item="item">
        <div :class="wrapperClass" v-if="!item.settings.enable_image_input">
            <template v-if="inputType == 'radio'">
                <div v-for="(option,index) in item.settings.advanced_options" :key="index" style="line-height: 25px;">
                    <input
                        :name="radioPreviewName"
                        type="radio"
                        :value="option.value"
                        :checked="isOptionSelected(option, index)"
                    > {{ option.label }}
                </div>
                <!-- Other option for radio -->
                <div v-if="item.settings.enable_other_option === 'yes'" class="ff-el-form-check ff-other-option" style="line-height: 25px;">
                    <input
                        :name="radioPreviewName"
                        type="radio"
                        :value="'other_' + item.attributes.name"
                        :checked="isOtherOptionSelected()"
                    >
                    {{ item.settings.other_option_label || 'Other' }}
                </div>
            </template>
            <template v-else>
                <div v-for="(option,index) in item.settings.advanced_options" :key="index" style="line-height: 25px;">
                    <input
                        type="checkbox"
                        :value="option.value"
                        :checked="isOptionSelected(option, index)"
                    > {{ option.label }}
                </div>
                <!-- Other option for checkbox -->
                <div v-if="item.settings.enable_other_option === 'yes'" class="ff-el-form-check ff-other-option" style="line-height: 25px;">
                    <input
                        type="checkbox"
                        :value="'other_' + item.attributes.name"
                        :checked="isOtherOptionSelected()"
                    >
                    {{ item.settings.other_option_label || 'Other' }}
                </div>
            </template>
        </div>
        <div :class="wrapperClass" class="ff_checkable_images" v-else>
            <div v-for="(option, i) in item.settings.advanced_options" class="ff_check_photo_item" :key="i">
                <div class="ff_photo_holder" :style="{ backgroundImage: 'url('+option.image+')' }"></div>
                <label>
                    <input
                        :name="item.attributes.name"
                        :value="option.value"
                        :checked="isOptionSelected(option, i)"
                        :type="inputType"
                    >
                    <span v-html="option.label"></span>
                </label>
            </div>
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputCheckable',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        inputType() {
            return this.item.attributes.type;
        },
        radioPreviewName() {
            return (this.item.attributes && this.item.attributes.name ? this.item.attributes.name : 'radio') + '_preview';
        },
        wrapperClass() {
            return this.item.settings.layout_class+' item_type_'+this.item.attributes.type;
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

            this.item.settings.advanced_options.forEach((option, index) => {
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
                .filter(optionId => this.item.settings.advanced_options.some(option => String(option._ff_option_id) === optionId));

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
        },
        isOtherOptionSelected() {
            const otherValue = 'other_' + this.item.attributes.name;

            return [].concat(this.item.attributes.value || []).map(String).includes(otherValue);
        }
    }
}
</script>

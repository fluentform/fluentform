<template>
    <withLabel :item="item">
        <div class="ff_with_arrow">
            <select class="select el-input__inner">
                <option>{{defaultVal || item.settings.placeholder}}</option>
            </select>
        </div>
    </withLabel>
</template>

<script type="text/babel">
import withLabel from './withLabel.vue';
import find from 'lodash/find';

export default {
    name: 'customSelect',
    props: ['item'],
    computed :{
        defaultVal() {
            let option = null;
            const storedIds = this.getStoredSelectedOptionIds();

            if (storedIds.length) {
                option = this.item.settings.advanced_options.find(option => {
                    return storedIds.includes(String(option._ff_option_id));
                });
            }

            const storedIndexes = this.getStoredSelectedOptionIndexes();

            if (!option && storedIndexes.length) {
                option = this.item.settings.advanced_options[storedIndexes[0]];
            }

            if (!option) {
                option = find(this.item.settings.advanced_options, { value: this.item.attributes.value });
            }

            return option ? option.label : null;
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
    },
    components: {
        withLabel
    }
}
</script>

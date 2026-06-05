<template>
    <withLabel :item="item">
        <div class="ff_with_arrow">
            <select class="select el-input__inner">
                <option>{{ defaultVal || placeholder }}</option>
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
    computed: {
        defaultVal() {
            let option = find(this.flattenedOptions, { value: this.item.attributes.value });

            return option ? option.label : null;
        },
        flattenedOptions() {
            return this.flattenOptions(this.item.settings.advanced_options || []);
        },
        placeholder() {
            return this.item.settings.placeholder;
        }
    },
    methods: {
        flattenOptions(options) {
            return options.reduce((formatted, option) => {
                if (option && option.type === 'group' && Array.isArray(option.options)) {
                    return formatted.concat(this.flattenOptions(option.options));
                }

                formatted.push(option);
                return formatted;
            }, []);
        }
    },
    components: {
        withLabel
    }
}
</script>

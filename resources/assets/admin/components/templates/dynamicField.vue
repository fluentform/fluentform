<template>
    <div v-if="isCheckable || isSelectable" class="ff-dynamic-editor-wrap">
        <input-checkable v-if="isCheckable" :item="item"></input-checkable>
        <custom-select v-else-if="isSelectable" :item="item"></custom-select>
    </div>
</template>

<script type="text/babel">
import customSelect from './select.vue';
import inputCheckable from './inputCheckable.vue';
import inputHidden from './inputHidden.vue';
import inputText from './inputText.vue';

export default {
    name: 'dynamic-field',
    props: ['item'],
    components: {
        customSelect,
        inputCheckable,
        inputHidden,
        inputText,
    },
    watch: {
        'item.settings.field_type'(type) {
            let value = this.item.attributes.value;
            if (value) {
                if (['checkbox', 'multi_select'].includes(type)) {
                    if (!Array.isArray(value)) {
                        value = [];
                    }
                } else if (Array.isArray(value)) {
                    value = value[0] || '';
                }
                this.item.attributes.value = value;
            }
            if ('multi_select' === type) {
                type = 'select';
                this.item.attributes.multiple = true;
            } else if ('select' === type) {
                this.item.attributes.multiple = false;
            }
            this.item.attributes.type = type;
        },
    },
    computed: {
        isCheckable() {
            return ['radio', 'checkbox'].includes(this.item.settings.field_type);
        },
        isSelectable() {
            return ['select', 'multi_select'].includes(this.item.settings.field_type);
        },
    },
};
</script>

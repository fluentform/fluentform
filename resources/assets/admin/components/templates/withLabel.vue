<template>
    <el-form-item
        :class="{
            'is-required': required,
            ['ff-el-form-' + item.settings.label_placement]: item.settings.label_placement,
        }"
    >
        <template #label>
            <ff-label :label="item.settings.label"></ff-label>
        </template>
        <slot></slot>
    </el-form-item>
</template>

<script>
import elLabel from '../includes/el-label.vue';

export default {
    name: 'withLabel',
    props: ['item'],
    components: {
        'ff-label': elLabel,
    },
    computed: {
        required() {
            return (
                this.item.settings.validation_rules &&
                this.item.settings.validation_rules.required &&
                this.item.settings.validation_rules.required.value
            );
        },
    },
};
</script>

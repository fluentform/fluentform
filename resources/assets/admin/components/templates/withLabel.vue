<template>
    <el-form-item :class="{ 'is-required' : required, ['ff-form-label-' + item.settings.label_placement]: item.settings.label_placement }">
        <elLabel slot="label" :label="item.settings.label"></elLabel>
        <slot></slot>
    </el-form-item>
</template>

<script>
import elLabel from '../includes/el-label.vue';

export default {
    name: 'withLabel',
    props: ['item'],
    components: {
        elLabel
    },
    computed: {
        required() {
            return this.item.settings.validation_rules && this.item.settings.validation_rules.required && this.item.settings.validation_rules.required.value;
        }
    },
}
</script>

<template>
    <el-form-item :class="wrapperClasses">
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
        },
        hasValue() {
            const value = this.item.attributes && this.item.attributes.value;

            if (Array.isArray(value)) {
                return !!value.length;
            }

            return value === 0 || value === '0' || !!value;
        },
        isFloatingLabelEnabled() {
            return this.item.settings
                && this.item.settings.enable_floating_label === 'yes'
                && this.item.settings.label;
        },
        hasPlaceholder() {
            if (!this.isFloatingLabelEnabled) {
                return false;
            }

            const attributePlaceholder = this.item.attributes && this.item.attributes.placeholder;
            const settingPlaceholder = this.item.settings && this.item.settings.placeholder;

            return !!(attributePlaceholder || settingPlaceholder);
        },
        wrapperClasses() {
            const classes = {
                'is-required': this.required,
                'ff-el-has-placeholder': this.hasPlaceholder,
                'ff-el-has-value': this.isFloatingLabelEnabled && this.hasValue
            };

            if (this.item.settings.label_placement && !this.isFloatingLabelEnabled) {
                classes['ff-el-form-' + this.item.settings.label_placement] = true;
            }

            if (this.isFloatingLabelEnabled) {
                classes['ff-el-form-floating'] = true;
                classes['ff-el-form-floating-' + (this.item.settings.floating_label_style || 'inline')] = true;
            }

            return classes;
        }
    },
}
</script>

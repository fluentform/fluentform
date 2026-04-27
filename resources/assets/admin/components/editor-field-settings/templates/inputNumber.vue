<template>
    <el-form-item v-if="shouldShowNumberField">
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        <el-input v-model="model" type="number"></el-input>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'inputText',
    props: ['listItem', 'editItem', 'value', 'prop'],
    components: {
        elLabel
    },
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    data() {
        return {
            model: this.value
        }
    },
    computed: {
        // @todo after adding multiple dependency support remove this method
        // checking if the field is a single_inventory_stock field to show inventory quantity for single payment item
        isSingleInventoryStockField() {
            const isInventoryInput = this.editItem?.settings?.inventory_type === false;
            const isSinglePaymentField = this.editItem?.element === 'multi_payment_component' && this.editItem?.attributes?.type === 'single';

            return !(isInventoryInput && isSinglePaymentField);
        },
        // @todo remove this special handling after adding proper chained dependency support to editor settings
        shouldShowNumberField() {
            if (!this.isSingleInventoryStockField) {
                return false;
            }

            if (this.prop !== 'crop_width' && this.prop !== 'crop_height') {
                return true;
            }

            return this.editItem?.settings?.enable_crop === 'yes' && this.editItem?.settings?.crop_mode === 'dimensions';
        }
    }
}
</script>

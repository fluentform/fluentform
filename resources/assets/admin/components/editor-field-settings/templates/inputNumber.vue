<template>
    <el-form-item v-if="isSingleInventoryStockField">
        <template #label>
            <ff-label :label="listItem.label" :helpText="listItem.help_text"></ff-label>
        </template>
        <el-input v-model="model" type="number"></el-input>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'inputText',
    props: ['listItem', 'editItem', 'modelValue'],
    components: {
        'ff-label': elLabel,
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
    },
    data() {
        return {
            model: this.value,
        };
    },
    computed: {
        // @todo after adding multiple dependency support remove this method
        // checking if the field is a single_inventory_stock field to show inventory quantity for single payment item
        isSingleInventoryStockField() {
            const isInventoryInput = this.editItem?.settings?.inventory_type === false;
            const isSinglePaymentField =
                this.editItem?.element === 'multi_payment_component' && this.editItem?.attributes?.type === 'single';

            return !(isInventoryInput && isSinglePaymentField);
        },
    },
};
</script>

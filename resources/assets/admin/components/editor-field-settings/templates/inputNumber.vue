<template>
    <el-form-item v-if="isSingleInventoryStockField">
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        <el-input v-model="model" type="number"></el-input>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'inputText',
    props: ['listItem', 'value'],
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
        // checking if the field is a single_inventory_stock field
        isSingleInventoryStockField() {
            const isInventoryInput = this.$attrs?.editItem?.settings?.inventory_type === false;
            const dependencyOperator = this.listItem?.dependency?.operator === '==';

            return !(isInventoryInput && dependencyOperator);
        }
    }
}
</script>
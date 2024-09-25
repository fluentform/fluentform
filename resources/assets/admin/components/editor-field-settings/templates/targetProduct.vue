<template>
    <el-form-item>
        <template #label>
            <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
        </template>
        <el-select v-model="model" size="small">
            <el-option
                v-for="(product, productKey) in available_products"
                :key="productKey"
                :value="productKey"
                :label="product"
            >
            </el-option>
        </el-select>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'targetProduct',
    props: ['listItem', 'modelValue', 'form_items'],
    components: {
        elLabel,
    },
    computed: {
        available_products() {
            let products = {};
            let productInputElements = [
                'custom_payment_component',
                'multi_payment_component',
                'subscription_payment_component',
            ];
            this.mapElements(this.form_items, formItem => {
                if (productInputElements.indexOf(formItem.element) !== -1) {
                    products[formItem.attributes.name] =
                        formItem.settings.label === '' ? formItem.attributes.name : formItem.settings.label;
                }
            });
            return products;
        },
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
    },
    data() {
        return {
            model: this.modelValue,
        };
    },
    mounted() {
        if (!this.model || !this.available_products[this.model]) {
            if (Object.keys(this.available_products).length) {
                let firstItem = Object.keys(this.available_products)[0];
                this.$set(this, 'model', firstItem);
            }
        }
    },
};
</script>

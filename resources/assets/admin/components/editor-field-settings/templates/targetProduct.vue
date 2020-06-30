<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        <el-select v-model="model" size="mini">
            <el-option v-for="(product, productKey) in available_products" :key="productKey" :value="productKey" :label="product">
            </el-option>
        </el-select>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'targetProduct',
    props: ['listItem', 'value', 'form_items'],
    components: {
        elLabel
    },
    computed: {
        available_products() {
            let products = {};
            let productInputElements = ['custom_payment_component', 'multi_payment_component'];
            this.mapElements(this.form_items, (formItem) => {
                if(productInputElements.indexOf(formItem.element) !== -1) {
                    products[formItem.attributes.name] = formItem.settings.label;
                }
            });
            return products;
        }
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
    mounted() {
        if(!this.model || !this.available_products[this.model]) {
            if(Object.keys(this.available_products).length) {
                let firstItem = Object.keys(this.available_products)[0];
                this.$set(this, 'model', firstItem)
            }
        }
    }
}
</script>
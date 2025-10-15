<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        
        <el-select 
            v-model="model" 
            multiple 
            filterable 
            remote
            reserve-keyword
            :remote-method="searchProducts"
            :loading="loading"
            :placeholder="$t('Search and select products...')"
            class="el-fluid"
            @visible-change="handleVisibleChange"
        >
            <el-option
                v-for="product in products"
                :key="product.id"
                :label="product.label"
                :value="product.id">
            </el-option>
        </el-select>
        
        <div v-if="model && model.length" class="selected-products-info" style="margin-top: 10px; font-size: 12px; color: #606266;">
            {{ model.length }} {{ model.length === 1 ? 'product' : 'products' }} selected
        </div>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'selectProductIds',
    props: ['listItem', 'value'],
    components: {
        elLabel
    },
    data() {
        return {
            model: this.value || [],
            products: [],
            loading: false,
            searchTimeout: null
        }
    },
    watch: {
        model() {
            this.$emit('input', this.model);
        },
        value(newVal) {
            if (JSON.stringify(newVal) !== JSON.stringify(this.model)) {
                this.model = newVal || [];
            }
        }
    },
    methods: {
        searchProducts(query) {
            // Clear previous timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            // Debounce search
            this.searchTimeout = setTimeout(() => {
                this.fetchProducts(query);
            }, 300);
        },
        
        fetchProducts(search = '') {
            this.loading = true;
            
            FluentFormsGlobal.$get({
                action: 'fluentform_get_fluentcart_products',
                search: search,
                page: 1
            })
            .then(response => {
                if (response.data && response.data.products) {
                    this.products = response.data.products;
                    
                    // If we have selected products, make sure they're in the list
                    if (this.model && this.model.length) {
                        this.ensureSelectedProductsLoaded();
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                this.$message.error(this.$t('Failed to load products'));
            })
            .always(() => {
                this.loading = false;
            });
        },
        
        ensureSelectedProductsLoaded() {
            // Load selected products if they're not in the current list
            const selectedIds = this.model || [];
            const loadedIds = this.products.map(p => p.id);
            const missingIds = selectedIds.filter(id => !loadedIds.includes(id));
            
            if (missingIds.length > 0) {
                // Fetch missing products by IDs
                this.fetchProductsByIds(missingIds);
            }
        },
        
        fetchProductsByIds(ids) {
            // This would require an additional endpoint, for now we'll just load all
            // In a production scenario, you'd want to fetch specific products by ID
            this.fetchProducts('');
        },
        
        handleVisibleChange(visible) {
            if (visible && this.products.length === 0) {
                this.fetchProducts('');
            }
        }
    },
    mounted() {
        // Load initial products
        this.fetchProducts('');
    }
}
</script>

<style scoped>
.selected-products-info {
    padding: 5px 10px;
    background: #f5f7fa;
    border-radius: 4px;
}
</style>


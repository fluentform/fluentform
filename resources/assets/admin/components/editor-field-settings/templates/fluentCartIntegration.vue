<template>
    <el-form-item>
        <elLabel
            slot="label"
            :label="listItem.label"
            :helpText="listItem.help_text"
        />
        
        <div class="fluent-cart-integration-wrapper">
            <!-- Enable Integration Checkbox -->
            <el-form-item>
                <el-checkbox 
                    v-model="integrationSettings.enabled"
                    @change="onIntegrationToggle"
                >
                    {{ $t('Enable Fluent Cart Integration') }}
                </el-checkbox>
            </el-form-item>

            <!-- Product Selection -->
            <div v-if="integrationSettings.enabled">
                <el-form-item>
                    <elLabel
                        :label="$t('Select Product')"
                        :helpText="$t('Choose a Fluent Cart product to integrate with this payment field')"
                    />
                    <el-select
                        v-model="integrationSettings.product_id"
                        :placeholder="$t('Search and select product...')"
                        filterable
                        remote
                        :remote-method="searchProducts"
                        :loading="loadingProducts"
                        @change="onProductChange"
                        clearable
                    >
                        <el-option
                            v-for="product in products"
                            :key="product.id"
                            :label="product.title"
                            :value="product.id"
                        />
                    </el-select>
                </el-form-item>

                <!-- Variation Mapping -->
                <div v-if="integrationSettings.product_id && variations.length > 0">
                    <el-form-item>
                        <elLabel
                            :label="$t('Map Product Variations')"
                            :helpText="$t('Map product variations to pricing options. This will replace your current pricing options.')"
                        />
                        
                        <div class="variation-mapping-wrapper">
                            <div 
                                v-for="(variation, index) in variations" 
                                :key="variation.id"
                                class="variation-item"
                            >
                                <div class="variation-info">
                                    <strong>{{ variation.variation_title }}</strong>
                                    <span class="variation-price">{{ variation.formatted_total }}</span>
                                </div>
                                <el-checkbox
                                    :value="isVariationMapped(variation.id)"
                                    @input="toggleVariationMapping(variation, $event)"
                                >
                                    {{ $t('Map Variation') }}
                                </el-checkbox>
                            </div>
                        </div>
                    </el-form-item>
                </div>

                <!-- No variations message -->
                <div v-else-if="integrationSettings.product_id && variations.length === 0 && !loadingVariations">
                    <el-alert
                        :title="$t('No variations found')"
                        type="info"
                        :description="$t('The selected product has no variations. Please add variations to the product in Fluent Cart.')"
                        show-icon
                        :closable="false"
                    />
                </div>
            </div>
        </div>
    </el-form-item>
</template>

<script type="text/babel">
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'fluentCartIntegration',
    props: ['listItem', 'value', 'editItem'],
    components: {
        elLabel
    },
    data() {
        return {
            products: [],
            variations: [],
            loadingProducts: false,
            loadingVariations: false,
            searchTimeout: null
        }
    },
    computed: {
        integrationSettings: {
            get() {
                // Ensure variation_mapping is initialized as an array
                const settings = this.value || {
                    enabled: false,
                    product_id: '',
                    variation_mapping: []
                };

                // Make sure variation_mapping is always an array
                if (!settings.variation_mapping) {
                    settings.variation_mapping = [];
                }

                return settings;
            },
            set(val) {
                this.$emit('input', val);
            }
        }
    },
    methods: {
        onIntegrationToggle(enabled) {
            if (!enabled) {
                this.integrationSettings = {
                    enabled: false,
                    product_id: '',
                    variation_mapping: []
                };
            }
        },

        searchProducts(query) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }

            this.searchTimeout = setTimeout(() => {
                this.loadProducts(query);
            }, 300);
        },

        loadProducts(search = '') {
            this.loadingProducts = true;

            window.FluentFormsGlobal.$post({
                action: 'fluentform_get_fluent_cart_products',
                search: search
            }).then(response => {
                this.products = response.data.products || [];
            }).fail(error => {
                if (this.$message) {
                    this.$message.error(this.$t('Failed to load products'));
                }
            }).always(() => {
                this.loadingProducts = false;
            });
        },

        onProductChange(productId) {
            if (productId) {
                this.loadVariations(productId);
            } else {
                this.variations = [];
                this.integrationSettings.variation_mapping = [];
            }
        },

        loadVariations(productId) {
            this.loadingVariations = true;

            window.FluentFormsGlobal.$post({
                action: 'fluentform_get_fluent_cart_variations',
                product_id: productId
            }).then(response => {
                this.variations = response.data.variations || [];
                this.integrationSettings.variation_mapping[this.variations.id] = this.variations.variation_title;
            }).fail(error => {
                if (this.$message) {
                    this.$fail(this.$t('Failed to load product variations'));
                }
            }).always(() => {
                this.loadingVariations = false;
            });
        },

        isVariationMapped(variationId) {
            // Check if variation_mapping is an object (your new approach)
            if (typeof this.integrationSettings.variation_mapping === 'object' && !Array.isArray(this.integrationSettings.variation_mapping)) {
                return this.integrationSettings.variation_mapping.hasOwnProperty(variationId);
            }

            // Fallback for array structure (old approach)
            return this.integrationSettings.variation_mapping.some(
                mapping => mapping.variation_id === variationId
            );
        },

        toggleVariationMapping(variation, isChecked) {
            let mappings = {...this.integrationSettings.variation_mapping};

            if (isChecked) {
                // Add variation to mapping object
                mappings[variation.id] = variation.variation_title;
            } else {
                // Remove variation from mapping object
                delete mappings[variation.id];
            }

            this.integrationSettings.variation_mapping = mappings;

            this.updatePricingOptions();
        },

        updatePricingOptions() {
            const pricingOptions = [];

            // Handle object structure (your approach)
            if (typeof this.integrationSettings.variation_mapping === 'object' && !Array.isArray(this.integrationSettings.variation_mapping)) {
                Object.keys(this.integrationSettings.variation_mapping).forEach(variationId => {
                    const variation = this.variations.find(v => v.id == variationId); // Use == for type coercion

                    if (variation) {
                        const option = {
                            label: variation.variation_title,
                            value: variation.item_price / 100,
                            image: variation.thumbnail || '',
                            fluent_cart_variation_id: variation.id
                        };
                        pricingOptions.push(option);
                    }
                });
            } else {
                // Fallback for array structure (old approach)
                this.integrationSettings.variation_mapping.forEach(mapping => {
                    const variation = this.variations.find(v => v.id === mapping.variation_id);

                    if (variation) {
                        const option = {
                            label: variation.variation_title,
                            value: variation.item_price / 100,
                            image: variation.thumbnail || '',
                            fluent_cart_variation_id: variation.id
                        };
                        pricingOptions.push(option);
                    }
                });
            }

            if (pricingOptions.length > 0) {
                this.editItem.settings.pricing_options = pricingOptions;
            }
        }
    },

    mounted() {
        this.loadProducts();
        // Load variations if product is already selected
        if (this.integrationSettings.product_id) {
            this.loadVariations(this.integrationSettings.product_id);
        }
    }
}
</script>

<style scoped>
.fluent-cart-integration-wrapper {
    border: 1px solid #e1e5e9;
    border-radius: 4px;
    padding: 15px;
    margin-top: 10px;
}

.variation-mapping-wrapper {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e1e5e9;
    border-radius: 4px;
    padding: 10px;
}

.variation-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
}

.variation-item:last-child {
    border-bottom: none;
}

.variation-info {
    flex: 1;
}

.variation-price {
    color: #666;
    font-size: 12px;
    margin-left: 10px;
}

.help-text {
    font-size: 12px;
    color: #666;
    margin-top: 5px;
}
</style>

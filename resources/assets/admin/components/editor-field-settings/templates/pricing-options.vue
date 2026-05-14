<template>
    <div class="ff_payment_item_wrapper">
        <el-form-item>
            <elLabel
                slot="label"
                :label="$t('Product Display Type')"
                :helpText="$t('Select which display type you want for your payment item. Please provide valid number only')"
            />

            <el-radio-group
                @change="editItem.attributes.value = ''"
                v-model="editItem.attributes.type"
                size="small"
            >
                <el-radio-button label="single">{{ $t('Single') }}</el-radio-button>
                <el-radio-button label="radio">{{ $t('Radio') }}</el-radio-button>
                <el-radio-button label="checkbox">{{ $t('Checkbox') }}</el-radio-button>
                <el-radio-button label="select">{{ $t('Select') }}</el-radio-button>
            </el-radio-group>
        </el-form-item>

        <div v-if="editItem.attributes.type == 'single'">
            <el-form-item v-if="hasFluentCartProducts">
                <el-checkbox v-model="editItem.settings.use_fluent_cart_product">
                    {{ $t('Use Fluent Cart Product') }}
                </el-checkbox>
            </el-form-item>

            <el-form-item v-if="!isSingleFluentCartProductEnabled">
                <elLabel
                    slot="label"
                    :label="$t('Payment Amount')"
                    :helpText="$t('Please Provide the payment amount. Max 2 decimal point is excepted')"
                />
                <el-input
                    type="text"
                    v-model="editItem.attributes.value"
                />
            </el-form-item>

            <el-form-item v-if="!isSingleFluentCartProductEnabled">
                <elLabel
                    slot="label"
                    :label="$t('Amount Label')"
                    :helpText="$t('Please Provide the Amount Label')"
                />
                <el-input type="text" v-model="editItem.settings.price_label" />
            </el-form-item>

            <el-form-item v-if="isSingleFluentCartProductEnabled">
                <elLabel
                    slot="label"
                    :label="$t('Fluent Cart Product')"
                    :helpText="$t('Map this payment item to a Fluent Cart product variation. Fluent Cart pricing will be used on checkout.')"
                />
                <el-select
                    v-model="editItem.settings.fluent_cart_product_id"
                    filterable
                    clearable
                    style="width: 100%;"
                    :placeholder="$t('Select a Fluent Cart product')"
                >
                    <el-option
                        v-for="product in fluentCartProducts"
                        :key="product.value"
                        :label="product.label"
                        :value="product.value"
                    />
                </el-select>
            </el-form-item>
        </div>

        <el-form-item v-else>
            <div class="clearfix">
                <div class="pull-right top-check-action">
                    <el-checkbox
                        v-if="hasImageSupport"
                        v-model="editItem.settings.enable_image_input"
                    >Photo</el-checkbox>
                </div>
                <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text" />
            </div>

            <vddl-list
                :drop="handleDrop"
                v-if="optionsToRender.length"
                class="vddl-list__handle"
                :list="editItem.settings.pricing_options"
                :horizontal="false"
            >
                <vddl-draggable
                    :moved="handleMoved"
                    class="optionsToRender ff_t"
                    v-for="(option, index) in editItem.settings.pricing_options"
                    :key="option.id"
                    :draggable="option"
                    :index="index"
                    :wrapper="editItem.settings.pricing_options"
                    effect-allowed="move"
                >
                    <div>
                        <div
                            v-if="hasFluentCartProducts"
                            style="margin: 0 0 8px 46px;"
                        >
                            <el-checkbox
                                v-model="option.use_fluent_cart_product"
                            >
                                {{ $t('Use Fluent Cart Product') }}
                            </el-checkbox>
                        </div>

                        <vddl-nodrag class="nodrag ff_tr">
                            <div class="checkbox">
                                <input
                                    ref="defaultOptions"
                                    class="form-control"
                                    :type="optionsType"
                                    name="fluentform__default-option"
                                    :value="option.value"
                                    :checked="isChecked(option.value)"
                                    @change="updateDefaultOption(option)"
                                />
                            </div>

                            <vddl-handle :handle-left="20" :handle-top="20" class="handle"></vddl-handle>

                            <div
                                style="max-width: 64px; max-height: 32px; overflow: hidden;"
                                v-if="editItem.settings.enable_image_input && hasImageSupport"
                            >
                                <photo-widget enable_clear="yes" v-model="option.image" :for_advanced_option="true"/>
                            </div>

                            <div>
                                <el-input
                                    :placeholder="$t('Label')"
                                    v-model="option.label"
                                    @input="updateValue(option)"
                                />
                            </div>

                            <div>
                                <el-input
                                    v-if="!isOptionFluentCartProductEnabled(option)"
                                    min="0"
                                    step="any"
                                    type="number"
                                    :placeholder="$t('Price')"
                                    v-model="option.value"
                                />
                                <el-select
                                    v-else
                                    v-model="option.fluent_cart_product_id"
                                    filterable
                                    clearable
                                    style="width: 100%;"
                                    :placeholder="$t('Map to Fluent Cart product')"
                                >
                                    <el-option
                                        v-for="product in fluentCartProducts"
                                        :key="product.value"
                                        :label="product.label"
                                        :value="product.value"
                                    />
                                </el-select>
                            </div>

                            <action-btn>
                                <action-btn-add @click="increase(index)" size="mini"></action-btn-add>
                                <action-btn-remove @click="decrease(index)" size="mini"></action-btn-remove>
                            </action-btn>
                        </vddl-nodrag>
                    </div>
                    <div v-if="editItem.settings.enable_desc_input" class="item_desc">
                        <textarea :placeholder="$t('Item Short Description')" v-model="option.desc" />
                    </div>
                </vddl-draggable>
            </vddl-list>
            <el-button
                type="warning"
                size="mini"
                :disabled="!editItem.attributes.value"
                @click.prevent="clear"
            >{{ $t('Clear Selection') }}</el-button>
        </el-form-item>

        <el-form-item v-if="editItem.attributes.type == 'select'" :label="$t('Placeholder')">
            <el-input placeholder="Placeholder" v-model="editItem.settings.placeholder" />
        </el-form-item>

    </div>

</template>

<script type="text/babel">
    import elLabel from '../../includes/el-label.vue';
    import PhotoWidget from '@/common/PhotoUploader';
    import ActionBtn from '@/admin/components/ActionBtn/ActionBtn.vue';
    import ActionBtnAdd from '@/admin/components/ActionBtn/ActionBtnAdd.vue';
    import ActionBtnRemove from '@/admin/components/ActionBtn/ActionBtnRemove.vue';

    export default {
        name: 'pricing-options',
        props: ['editItem', 'listItem'],
        components: {
            elLabel,
            PhotoWidget,
            ActionBtn,
            ActionBtnAdd,
            ActionBtnRemove
        },
        data() {
            return {
                valuesVisible: false,
                optionsToRender: [],
                bulkEditVisible: false,
                value_key_pair_text: '',
                has_pro: !!window.FluentFormApp.hasPro,
                pro_mock: false
            }
        },
        computed: {
            optionsType() {
                let item = this.editItem;
                let attributes = item.attributes;
                let determiner = attributes.type || (attributes.multiple && 'multiselect') || item.element;

                switch (determiner) {
                    case 'multiselect':
                    case 'checkbox':
                        return 'checkbox'
                        break;
                    case 'select':
                    case 'radio':
                        return 'radio'
                        break;
                    default:
                        return 'radio'
                }
            },
            hasImageSupport() {
                return this.editItem.element != 'select';
            },
            fluentCartProducts() {
                return (window.FluentFormApp?.fluent_cart_product_options || []).filter((product) => {
                    return product.payment_type !== 'subscription';
                });
            },
            hasFluentCartProducts() {
                return this.fluentCartProducts.length > 0;
            },
            isSingleFluentCartProductEnabled() {
                return this.hasFluentCartProducts && this.editItem.settings.use_fluent_cart_product;
            }
        },
        methods: {
            isOptionFluentCartProductEnabled(option) {
                return this.hasFluentCartProducts && option.use_fluent_cart_product;
            },
            handleDrop(data) {
                const {index, list, item} = data;
                item.id = new Date().getTime();
                list.splice(index, 0, item);
            },
            handleMoved(item) {
                const {index, list} = item;
                list.splice(index, 1);
            },

            isChecked(optVal) {
                if (typeof this.editItem.attributes.value != 'number') {
                    return this.editItem.attributes.value.includes(optVal);
                }
            },

            increase(index) {
                let options = this.editItem.settings.pricing_options;
                let key = options.length + 1;
                let optionStr = `Payment Item ${key}`;

                let newOpt = {
                    label: optionStr,
                    value: 10,
                    use_fluent_cart_product: false,
                    fluent_cart_product_id: ''
                };

                options.splice(index + 1, 0, newOpt);
            },

            decrease(index) {
                let options = this.editItem.settings.pricing_options;
                if (options.length > 1) {
                    options.splice(index, 1);
                } else {
                    this.$notify.error({
                        message: 'You have to have at least one option.',
                        offset: 30
                    });
                }
            },

            clear() {
                let attributes = this.editItem.attributes;
                if (attributes.type == 'checkbox' || attributes.multiple) {
                    attributes.value = [];
                } else {
                    attributes.value = '';
                }
                this.$refs.defaultOptions.map(el => el.checked = false);
            },

            updateDefaultOption(option) {
                let attributes = this.editItem.attributes;
                if (attributes.type == 'checkbox' || attributes.multiple) {
                    if (typeof attributes.value != 'object') {
                        attributes.value = [];
                    }

                    if (event.target.checked) {
                        attributes.value.push(option.value);
                    } else {
                        attributes.value.splice(attributes.value.indexOf(option.value), 1);
                    }
                } else {
                    if (event.target.checked) {
                        attributes.value = option.value;
                    } else {
                        attributes.value = '';
                    }
                }
            },

            createOptionsToRender() {
                this.optionsToRender = this.editItem.settings.pricing_options;
            },
            normalizeFluentCartMapping() {
                if (this.editItem.settings.fluent_cart_product_id === undefined) {
                    this.$set(this.editItem.settings, 'fluent_cart_product_id', '');
                }

                if (this.editItem.settings.use_fluent_cart_product === undefined) {
                    this.$set(this.editItem.settings, 'use_fluent_cart_product', !!this.editItem.settings.fluent_cart_product_id);
                }

                (this.editItem.settings.pricing_options || []).forEach((option) => {
                    if (option.fluent_cart_product_id === undefined) {
                        this.$set(option, 'fluent_cart_product_id', '');
                    }

                    if (option.use_fluent_cart_product === undefined) {
                        this.$set(option, 'use_fluent_cart_product', !!option.fluent_cart_product_id);
                    }
                });
            },
            showProMessage() {
                this.$notify.error('Images with options is available in the Pro version');
                this.pro_mock = false;
            }
        },
        mounted() {
            this.createOptionsToRender();
            this.normalizeFluentCartMapping();
        },
        watch: {
            'editItem.settings.pricing_options': {
                deep: true,
                handler() {
                    this.normalizeFluentCartMapping();
                }
            }
        }
    };
</script>

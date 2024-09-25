<template>
    <div class="ff_payment_item_wrapper">
        <el-form-item>
            <template #label>
                <el-label
                    :label="$t('Product Display Type')"
                    :helpText="
                        $t('Select which display type you want for your payment item. Please provide valid number only')
                    "
                />
            </template>

            <el-radio-group @change="editItem.attributes.value = ''" v-model="editItem.attributes.type" size="small">
                <el-radio-button value="single">{{ $t('Single') }}</el-radio-button>
                <el-radio-button value="radio">{{ $t('Radio') }}</el-radio-button>
                <el-radio-button value="checkbox">{{ $t('Checkbox') }}</el-radio-button>
                <el-radio-button value="select">{{ $t('Select') }}</el-radio-button>
            </el-radio-group>
        </el-form-item>

        <div v-if="editItem.attributes.type === 'single'">
            <el-form-item>
                <template #label>
                    <el-label
                        :label="$t('Payment Amount')"
                        :helpText="$t('Please Provide the payment amount. Max 2 decimal point is excepted')"
                    />
                </template>
                <el-input type="text" v-model="editItem.attributes.value"/>
            </el-form-item>

            <el-form-item>
                <template #label>
                    <el-label
                        slot="label"
                        :label="$t('Amount Label')"
                        :helpText="$t('Please Provide the Amount Label')"
                    />
                </template>
                <el-input type="text" v-model="editItem.settings.price_label"/>
            </el-form-item>
        </div>

        <el-form-item v-else>
            <template #label>
                <div class="clearfix">
                    <div class="pull-right top-check-action">
                        <el-checkbox v-if="hasImageSupport" v-model="editItem.settings.enable_image_input"
                        >Photo
                        </el-checkbox>
                    </div>
                    <el-label :label="listItem.label" :helpText="listItem.help_text"/>
                </div>
            </template>

            <draggable
                v-if="optionsToRender.length"
                v-model="editItem.settings.pricing_options"
                class="vddl-list__handle"
                v-bind="stageDragOptions"
                item-key="id"
                @change="handleDrop"
            >
                <template #item="{ element: option, index }">
                    <div class="optionsToRender ff_t">
                        <div class="vddl-nodrag nodrag-address-fields">
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

                            <div class="vddl-handle handle"></div>

                            <div
                                style="max-width: 64px; max-height: 32px; overflow: hidden"
                                v-if="editItem.settings.enable_image_input && hasImageSupport"
                            >
                                <photo-widget enable_clear="yes" v-model="option.image" :for_advanced_option="true"/>
                            </div>

                            <div>
                                <el-input :placeholder="$t('label')" v-model="option.label"
                                          @input="updateValue(option)"/>
                            </div>

                            <div>
                                <el-input
                                    min="0"
                                    step="any"
                                    type="number"
                                    :placeholder="$t('Price')"
                                    v-model="option.value"
                                />
                            </div>

                            <action-btn>
                                <action-btn-add @click="increase(index)" size="small"></action-btn-add>
                                <action-btn-remove @click="decrease(index)" size="small"></action-btn-remove>
                            </action-btn>
                        </div>
                        <div v-if="editItem.settings.enable_desc_input" class="item_desc">
                            <textarea :placeholder="$t('Item Short Description')" v-model="option.desc"/>
                        </div>
                    </div>
                </template>
            </draggable>
            <el-button type="warning" size="small" :disabled="!editItem.attributes.value" @click.prevent="clear"
            >{{ $t('Clear Selection') }}
            </el-button>
        </el-form-item>

        <el-form-item v-if="editItem.attributes.type === 'select'" :label="$t('Placeholder')">
            <el-input placeholder="Placeholder" v-model="editItem.settings.placeholder"/>
        </el-form-item>
    </div>
</template>

<script>
import elLabel from '../../includes/el-label.vue';
import PhotoWidget from '@/common/PhotoUploader.vue';
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
        ActionBtnRemove,
    },
    data() {
        return {
            valuesVisible: false,
            optionsToRender: [],
            bulkEditVisible: false,
            value_key_pair_text: '',
            has_pro: !!window.FluentFormApp.hasPro,
            pro_mock: false,
        };
    },
    computed: {
        stageDragOptions() {
            return {
                animation: 200,
                ghostClass: 'vddl-placeholder',
                dragClass: 'vddl-dragover',
                bubbleScroll: false,
                emptyInsertThreshold: 100,
                handle: '.handle',
                direction: 'horizontal'
            };
        },
        optionsType() {
            let item = this.editItem;
            let attributes = item.attributes;
            let determiner = attributes.type || (attributes.multiple && 'multiselect') || item.element;

            switch (determiner) {
                case 'multiselect':
                case 'checkbox':
                    return 'checkbox';
                    break;
                case 'select':
                case 'radio':
                    return 'radio';
                    break;
                default:
                    return 'radio';
            }
        },
        hasImageSupport() {
            return this.editItem.element !== 'select';
        },
    },
    methods: {
        handleDrop(evt) {
            const movedElement = evt.moved.element;
            movedElement.id = new Date().getTime();
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
                    offset: 30,
                });
            }
        },

        clear() {
            let attributes = this.editItem.attributes;
            if (attributes.type === 'checkbox' || attributes.multiple) {
                attributes.value = [];
            } else {
                attributes.value = '';
            }
            this.$refs.defaultOptions.map(el => (el.checked = false));
        },

        updateDefaultOption(option) {
            let attributes = this.editItem.attributes;
            if (attributes.type === 'checkbox' || attributes.multiple) {
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
        showProMessage() {
            this.$notify.error('Image type fields only available on pro version');
            this.pro_mock = false;
        },
    },
    mounted() {
        this.createOptionsToRender();
    },
};
</script>

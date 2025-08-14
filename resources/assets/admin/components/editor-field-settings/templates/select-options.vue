<template>
    <el-form-item v-if="editItem.editor_options.element !== 'country-list'">
        <template #label>
            <div class="ff_advanced_options">
                <div>
                    <el-checkbox v-model="valuesVisible">{{ $t('Show Values') }}</el-checkbox>
                </div>
                <div>
                    <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
                </div>
            </div>
        </template>
        <draggable
            v-if="optionsToRender.length"
            v-model="optionsToRender"
            class="vddl-list__handle"
            v-bind="stageDragOptions"
            item-key="id"
        >
            <template #item="{ element: option, index }">
                <div class="vddl-draggable optionsToRender">
                    <div class="vddl-nodrag nodrag">
                        <div class="checkbox" v-if="!listItem.hide_default_value">
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

                        <div>
                            <el-input v-model="option.label" @input="updateValue(option)"></el-input>
                        </div>
                        <div v-if="valuesVisible">
                            <el-input v-model="option.value"></el-input>
                        </div>

                        <action-btn>
                            <action-btn-add @click="increase(index)" size="small"></action-btn-add>
                            <action-btn-remove @click="decrease(index)" size="small"></action-btn-remove>
                        </action-btn>
                    </div>
                </div>
            </template>
        </draggable>

        <el-button
            v-if="!listItem.hide_default_value"
            type="warning"
            size="small"
            :disabled="!editItem.attributes.value"
            @click.prevent="clear"
        >Clear Selection
        </el-button>
        <el-button @click="initBulkEdit()" size="small">{{ $t('Bulk Edit') }}</el-button>

        <div :class="{ ff_backdrop: bulkEditVisible }">
            <el-dialog
                v-model="bulkEditVisible"
                :append-to-body="false"
                :title="$t('Edit your options')"
            >
                <template #header>
                    <h4 class="mb-2">{{ $t('Edit your options') }}</h4>
                    <p>
                        {{
                            $t('Please provide the value as LABEL:VALUE as each line or select from predefined data sets')
                        }}
                    </p>
                </template>
                <div v-if="bulkEditVisible" class="bulk_editor_wrapper mt-4">
                    <el-row :gutter="20">
                        <el-col :span="24">
                            <el-input type="textarea" :rows="5" v-model="value_key_pair_text"></el-input>
                            <p class="mt-2">
                                {{ $t('You can simply give value only the system will convert the label as value') }}
                            </p>
                        </el-col>
                    </el-row>
                </div>
                <template #footer>
                <span class="dialog-footer">
                    <el-button size="small" @click="bulkEditVisible = false">{{ $t('Cancel') }}</el-button>
                    <el-button size="small" type="primary" @click="confirmBulkEdit()">{{ $t('Confirm') }}</el-button>
                </span>
                </template>
            </el-dialog>
        </div>
    </el-form-item>
</template>

<script type="text/babel">
import elLabel from '../../includes/el-label.vue';
import ActionBtn from '@/admin/components/ActionBtn/ActionBtn.vue';
import ActionBtnAdd from '@/admin/components/ActionBtn/ActionBtnAdd.vue';
import ActionBtnRemove from '@/admin/components/ActionBtn/ActionBtnRemove.vue';
import each from 'lodash/each';

export default {
    name: 'selectOptions',
    props: ['editItem', 'listItem'],
    components: {
        elLabel,
        ActionBtn,
        ActionBtnAdd,
        ActionBtnRemove,
    },
    data() {
        return {
            valuesVisible: false || this.listItem.show_values,
            optionsToRender: [],
            bulkEditVisible: false,
            value_key_pair_text: '',
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
            let determiner =
                this.editItem.attributes.type ||
                (this.editItem.attributes.multiple && 'multiselect') ||
                this.editItem.element;

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

        is_rating_field() {
            return this.editItem.element == 'ratings';
        },
    },
    watch: {
        optionsToRender: {
            handler() {
                let newOptions = {};
                _ff.map(this.optionsToRender, option => {
                    newOptions[option.value] = option.label;
                });
                this.editItem.options = newOptions;
            },
            deep: true,
        },
    },
    methods: {
        updateValue(currentOption) {
            if (!this.is_rating_field) {
                currentOption.value = event.target.value;
            }
        },

        initBulkEdit() {
            let asText = '';
            each(this.editItem.options, (item, itemName) => {
                asText += item;
                if (itemName && item != itemName) {
                    asText += ':' + itemName;
                }
                asText += String.fromCharCode(13, 10);
            });
            this.value_key_pair_text = asText;
            this.bulkEditVisible = true;
        },

        confirmBulkEdit() {
            let lines = this.value_key_pair_text.split('\n');
            let values = [];
            each(lines, line => {
                let lineItem = line.split(':');
                let label = lineItem[0];
                let value = lineItem[1];
                if (!value) {
                    value = label;
                }
                if (label && value) {
                    values.push({
                        label: label,
                        value: value,
                        vkey: value,
                    });
                }
            });
            this.optionsToRender = values;
            this.bulkEditVisible = false;
        },

        isChecked(optVal) {
            if (typeof this.editItem.attributes.value != 'number') {
                return this.editItem.attributes.value.includes(optVal);
            }
        },
        increase(index) {
            let options = this.optionsToRender;
            let keys = options.map(opt => {
                let value = opt.value;
                value = opt.value.toString();
                let nums = value.match(/\d+/g);
                return nums && Number(nums.pop());
            });
            let key = Math.max(...keys.filter(i => i != 'undefined')) + 1;
            let optionStr = `Item ${key}`;
            let optionKey = optionStr.toLowerCase().replace(/\s/g, '_');

            if (this.is_rating_field) {
                optionKey = options.length + 1;
            }

            let newOpt = {
                label: optionStr,
                value: optionKey,
                vkey: new Date().getTime(),
            };

            options.splice(index + 1, 0, newOpt);
        },

        decrease(index) {
            let options = this.optionsToRender;
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

            if (attributes.type == 'checkbox' || attributes.multiple) {
                attributes.value = [];
            } else {
                attributes.value = '';
            }
            this.$refs.defaultOptions.map(el => (el.checked = false));
        },

        updateDefaultOption(option) {
            let attributes = this.editItem.attributes;

            if (attributes.type == 'checkbox' || attributes.multiple) {
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
            _ff.each(this.editItem.options, (label, value) => {
                this.optionsToRender.push({value, label, vkey: value});
            });
        },
    },
    mounted() {
        this.createOptionsToRender();
    },
};
</script>

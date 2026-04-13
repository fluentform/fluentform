<template>
    <el-form-item v-if="editItem.editor_options.element != 'country-list'">
        <div class="clearfix">
            <div class="pull-right">
                <el-checkbox v-model="valuesVisible">{{ $t('Show Values') }}</el-checkbox>
            </div>
            <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        </div>

        <vddl-list v-if="optionsToRender.length" class="vddl-list__handle" :list="optionsToRender" :horizontal="false">
            <vddl-draggable class="optionsToRender" v-for="(option, index) in optionsToRender" :key="option.vkey"
                            :draggable="option"
                            :index="index"
                            :wrapper="optionsToRender"
                            effect-allowed="move">
                <vddl-nodrag class="nodrag">
                    <div class="checkbox" v-if="!listItem.hide_default_value">
                        <input ref="defaultOptions"
                               class="form-control"
                               :type="optionsType"
                               name="fluentform__default-option"
                               :value="option.value"
                               :checked="isChecked(index)"
                               @change="updateDefaultOption(index)">
                    </div>

                    <vddl-handle
                        :handle-left="20"
                        :handle-top="20"
                        class="handle">
                    </vddl-handle>

                    <div>
                        <el-input v-model="option.label" @input="updateValue(option)"></el-input>
                    </div>
                    <div v-if="valuesVisible">
                        <el-input v-model="option.value"></el-input>
                    </div>


                    <action-btn>
                        <action-btn-add @click="increase(index)" size="mini"></action-btn-add>
                        <action-btn-remove @click="decrease(index)" size="mini"></action-btn-remove>
                    </action-btn>
                </vddl-nodrag>
            </vddl-draggable>
        </vddl-list>

        <el-button v-if="!listItem.hide_default_value" type="warning" size="mini" :disabled="!editItem.attributes.value" @click.prevent="clear">
            {{ $t('Clear Selection') }}
        </el-button>
        <el-button @click="initBulkEdit()" size="mini">{{ $t('Bulk Edit') }}</el-button>

        <el-dialog
            :append-to-body="true"
            class="ff_backdrop"
            :title="$t('Edit your options')"
            :visible.sync="bulkEditVisible"
        >
            <div slot="title">
                <h4 class="mb-2">{{$t('Edit your options')}}</h4>
                <p>{{ $t('Please provide the value as LABEL:VALUE as each line or select from predefined data sets') }}</p>
            </div>
            <div v-if="bulkEditVisible" class="bulk_editor_wrapper mt-4">
                <el-row :gutter="20">

                    <el-col :span="24">
                        <el-input type="textarea" :rows="5" v-model="value_key_pair_text"></el-input>
                        <p class="mt-2">{{ $t('You can simply give value only the system will convert the label as value') }}</p>
                    </el-col>
                </el-row>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button size="mini" @click="bulkEditVisible = false">{{ $t('Cancel') }}</el-button>
                <el-button size="mini" type="primary" @click="confirmBulkEdit()">{{ $t('Confirm') }}</el-button>
            </span>
        </el-dialog>


    </el-form-item>
</template>

<script type="text/babel">
    import elLabel from '../../includes/el-label.vue'
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
            ActionBtnRemove
        },
        data() {
            return {
                valuesVisible: false || this.listItem.show_values,
                optionsToRender: [],
                bulkEditVisible: false,
                value_key_pair_text: ''
            }
        },
        computed: {
            optionsType() {
                let determiner = this.editItem.attributes.type || (this.editItem.attributes.multiple && 'multiselect') || this.editItem.element;

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

            is_rating_field() {
                return this.editItem.element == 'ratings';
            },
            selectedOptionIndexSet() {
                return new Set(this.getSelectedOptionIndexes());
            }
        },
        watch: {
            optionsToRender: {
                handler() {
                    let newOptions = {};
                    _ff.map(this.optionsToRender, (option) => {
                        newOptions[option.value] = option.label;
                    });
                    this.editItem.options = newOptions;
                },
                deep: true
            }
        },
        methods: {
            updateValue(currentOption) {
                if (!this.is_rating_field) {
                    currentOption.value = event.target.value;
                }
            },

            initBulkEdit() {
                let astext = '';
                each(this.editItem.options, (item, itemName) => {
                    astext += item;
                    if (itemName && item != itemName) {
                        astext += ':' + itemName;
                    }
                    astext += String.fromCharCode(13, 10);
                });
                this.value_key_pair_text = astext;
                this.bulkEditVisible = true
            },

            confirmBulkEdit() {
                let lines = this.value_key_pair_text.split('\n');
                let values = [];
                each(lines, (line) => {
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
                            vkey: value
                        });
                    }
                });
                this.optionsToRender = values;
                this.ensureOptionIds();
                this.syncSelectionMetadata();
                this.bulkEditVisible = false
            },

            isChecked(optionIndex) {
                return this.selectedOptionIndexSet.has(optionIndex);
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
                    vkey: new Date().getTime()
                };

                options.splice(index + 1, 0, newOpt);
                this.ensureOptionIds();
                this.syncSelectionMetadata();
            },

            decrease(index) {
                let options = this.optionsToRender;
                if (options.length > 1) {
                    options.splice(index, 1);
                    this.syncSelectionMetadata();
                } else {
                    this.$notify.error({
                        message: 'You have to have at least one option.',
                        offset: 30
                    });
                }
            },

            clear() {
                this.applySelectedOptionIds([]);
                this.$refs.defaultOptions.map(el => el.checked = false);
            },

            updateDefaultOption(optionIndex) {
                const selectedIds = this.getSelectedOptionIds().slice();
                const optionId = this.getOptionId(this.optionsToRender[optionIndex]);

                if (this.isMultipleSelection()) {
                    if (event.target.checked) {
                        if (!selectedIds.includes(optionId)) {
                            selectedIds.push(optionId);
                        }
                    } else {
                        const removalIndex = selectedIds.indexOf(optionId);

                        if (removalIndex !== -1) {
                            selectedIds.splice(removalIndex, 1);
                        }
                    }
                } else {
                    selectedIds.splice(0, selectedIds.length);

                    if (event.target.checked) {
                        selectedIds.push(optionId);
                    }
                }

                this.applySelectedOptionIds(selectedIds);
            },

            createOptionsToRender() {
                _ff.each(this.editItem.options, (label, value) => {
                    this.optionsToRender.push({value, label, vkey: value});
                });
            },
            generateOptionId() {
                return 'ffo_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
            },
            ensureOptionIds() {
                this.optionsToRender.forEach((option, index) => {
                    if (!option._ff_option_id) {
                        this.$set(option, '_ff_option_id', this.generateOptionId() + '_' + index);
                    }
                });
            },
            getOptionId(option) {
                if (!option._ff_option_id) {
                    this.$set(option, '_ff_option_id', this.generateOptionId());
                }

                return String(option._ff_option_id);
            },
            getSelectedOptionIndexes() {
                const optionIds = this.optionsToRender.map(option => this.getOptionId(option));

                return this.getSelectedOptionIds()
                    .map(optionId => optionIds.indexOf(optionId))
                    .filter(index => index !== -1);
            },
            getSelectedOptionIds() {
                const storedIds = this.getStoredSelectedOptionIds();

                if (storedIds !== null) {
                    return storedIds;
                }

                const storedIndexes = this.getStoredSelectedOptionIndexes();

                if (storedIndexes !== null) {
                    return storedIndexes.map(index => this.getOptionId(this.optionsToRender[index]));
                }

                const optionValues = this.optionsToRender.map(option => String(option.value));
                const remainingValues = [].concat(this.editItem.attributes.value || []).map(String);
                const selectedIndexes = [];

                remainingValues.forEach(selectedValue => {
                    const matchedIndex = optionValues.findIndex((value, index) => {
                        return value === selectedValue && !selectedIndexes.includes(index);
                    });

                    if (matchedIndex !== -1) {
                        selectedIndexes.push(matchedIndex);
                    }
                });

                return selectedIndexes.map(index => this.getOptionId(this.optionsToRender[index]));
            },
            getStoredSelectedOptionIds() {
                if (!Array.isArray(this.editItem.settings.default_value_option_ids)) {
                    return null;
                }

                const validIds = this.editItem.settings.default_value_option_ids
                    .map(String)
                    .filter(optionId => this.optionsToRender.some(option => this.getOptionId(option) === optionId));

                return validIds.length ? validIds : null;
            },
            getStoredSelectedOptionIndexes() {
                if (!Array.isArray(this.editItem.settings.default_value_option_indexes)) {
                    return null;
                }

                const optionCount = this.optionsToRender.length;
                const validIndexes = this.editItem.settings.default_value_option_indexes
                    .map(index => parseInt(index, 10))
                    .filter(index => !isNaN(index) && index >= 0 && index < optionCount);

                return validIndexes.length ? validIndexes : null;
            },
            applySelectedOptionIds(selectedIds) {
                const normalizedIds = selectedIds
                    .map(String)
                    .filter((optionId, index, list) => {
                        return list.indexOf(optionId) === index && this.optionsToRender.some(option => this.getOptionId(option) === optionId);
                    });
                const optionIds = this.optionsToRender.map(option => this.getOptionId(option));
                const normalizedIndexes = normalizedIds
                    .map(optionId => optionIds.indexOf(optionId))
                    .filter(index => index !== -1);

                this.$set(this.editItem.settings, 'default_value_option_ids', normalizedIds);
                this.$set(this.editItem.settings, 'default_value_option_indexes', normalizedIndexes);

                if (this.isMultipleSelection()) {
                    this.editItem.attributes.value = normalizedIndexes.map(index => {
                        return this.optionsToRender[index].value;
                    });
                } else {
                    this.editItem.attributes.value = normalizedIndexes.length
                        ? this.optionsToRender[normalizedIndexes[0]].value
                        : '';
                }
            },
            syncSelectionMetadata() {
                this.applySelectedOptionIds(this.getSelectedOptionIds());
            },
            isMultipleSelection() {
                const attributes = this.editItem.attributes;

                return attributes.type == 'checkbox' || attributes.multiple;
            }
        },
        mounted() {
            this.createOptionsToRender();
            this.ensureOptionIds();
            this.syncSelectionMetadata();
        }
    }
</script>

<template>
    <el-form-item class="js-el-form-item">
        <template #label>
            <div class="clearfix">
                <div class="pull-right">
                    <el-checkbox v-model="valuesVisible">{{ $t('Show Values') }}</el-checkbox>
                </div>
                <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
            </div>
        </template>

        <draggable
            v-if="optionsToRender.length"
            v-model="optionsToRender"
            class="vddl-list__handle"
            v-bind="stageDragOptions"
            item-key="id"
            @change="handleDrop"
        >
            <template #item="{ element: option, index }">
                <div class="optionsToRender">
                    <div class="vddl-nodrag nodrag-address-fields">
                        <div v-show="hideRowForRadios" class="checkbox">
                            <input
                                ref="defaultOptions"
                                class="form-control"
                                :type="fieldType"
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
                            <action-btn-add size="small" @click="increase(index)"></action-btn-add>
                            <action-btn-remove size="small" @click="decrease(index)"></action-btn-remove>
                        </action-btn>
                    </div>
                </div>
            </template>
        </draggable>

        <el-button type="warning" size="small" :disabled="isClearBtnDisabled" @click.prevent="clear">
            {{ $t('Clear Selection') }}
        </el-button>
    </el-form-item>
</template>

<script>
import ActionBtn from '@/admin/components/ActionBtn/ActionBtn.vue';
import ActionBtnAdd from '@/admin/components/ActionBtn/ActionBtnAdd.vue';
import ActionBtnRemove from '@/admin/components/ActionBtn/ActionBtnRemove.vue';
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'gridRowCols',
    props: ['editItem', 'listItem', 'value', 'prop', 'valuesAlwaysVisible'],
    components: {
        elLabel,
        ActionBtn,
        ActionBtnAdd,
        ActionBtnRemove,
    },
    data() {
        return {
            valuesVisible: false,
            optionsToRender: [],
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

        fieldType() {
            return this.editItem.settings.tabular_field_type;
        },

        hideRowForRadios() {
            return !(this.prop === 'grid_rows' && this.fieldType === 'radio');
        },

        defaultChecked: {
            get() {
                return this.editItem.settings.selected_grids;
            },
            set(val) {
                this.editItem.settings.selected_grids = val;
            },
        },

        isClearBtnDisabled() {
            let disabled = true;
            this.optionsToRender.map(option => {
                if (this.defaultChecked.includes(option.value)) {
                    return (disabled = false);
                }
            });
            return disabled;
        },
        alwaysShowValues() {
            return this.valuesAlwaysVisible === undefined;
        },
    },
    watch: {
        fieldType() {
            this.defaultChecked = [];
        },

        optionsToRender: {
            handler() {
                let newOptions = {};
                _ff.map(this.optionsToRender, option => {
                    newOptions[option.value] = option.label;
                });
                this.$emit('input', newOptions);
            },
            deep: true,
        },
    },
    methods: {
        updateValue(currentOption) {
            currentOption.value = event.target.value;
        },

        isChecked(optVal) {
            return this.defaultChecked.includes(optVal);
        },

        increase(index) {
            let options = this.optionsToRender;
            let keys = options.map(opt => {
                let value = opt.value.toString();
                let nums = value.match(/\d+/g);
                return nums && Number(nums.pop());
            });
            let key = Math.max(...keys.filter(i => i !== 'undefined')) + 1;
            let optionStr = `Item ${key}`;
            let optionKey = optionStr.toLowerCase().replace(/\s/g, '_');

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
            this.$refs.defaultOptions.map(el => {
                el.checked = false;

                const index = this.defaultChecked.indexOf(el.value);

                if (~index) this.defaultChecked.splice(index, 1);
            });
        },

        updateDefaultOption(option) {
            const selectedGrids = this.defaultChecked;

            if (this.fieldType === 'checkbox') {
                if (event.target.checked) {
                    selectedGrids.push(option.value);
                } else {
                    selectedGrids.splice(selectedGrids.indexOf(option.value), 1);
                }
            } else {
                if (event.target.checked) {
                    selectedGrids[0] = option.value;
                } else {
                    selectedGrids[0] = '';
                }
            }
        },

        createOptionsToRender() {
            _ff.each(this.value, (label, value) => {
                this.optionsToRender.push({value, label, vkey: value});
            });
        },

        handleDrop(evt) {
            const movedElement = evt.moved.element;
            movedElement.id = new Date().getTime();
        },
    },
    created() {
        this.createOptionsToRender();
        this.valuesVisible = !this.alwaysShowValues;
    },
};
</script>

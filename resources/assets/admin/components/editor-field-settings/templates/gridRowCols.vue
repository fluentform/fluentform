<template>
    <el-form-item class="js-el-form-item">
        <div class="clearfix">
            <div class="pull-right">
                <el-checkbox v-model="valuesVisible">Show Values</el-checkbox>
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
                    <div v-show="hideRowForRadios" class="checkbox">
                        <input ref="defaultOptions"
                            class="form-control"
                            :type="fieldType"
                            name="fluentform__default-option"
                            :value="option.value"
                            :checked="isChecked(option.value)"
                           @change="updateDefaultOption(option)">
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

                    <div class="action-btn">
                        <i @click="increase(index)" class="icon icon-plus-circle"></i>
                        <i @click="decrease(index)" class="icon icon-minus-circle"></i>
                    </div>
                </vddl-nodrag>
            </vddl-draggable>
        </vddl-list>

        <el-button type="warning" size="mini" :disabled="isClearBtnDisabled" @click.prevent="clear">Clear Selection</el-button>

    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'gridRowCols',
    props: ['editItem', 'listItem', 'value', 'prop', 'valuesAlwaysVisible'],
    components: {
        elLabel
    },
    data() {
        return {
            valuesVisible: false,
            optionsToRender: []
        }
    },
    computed: {
        fieldType() {
            return this.editItem.settings.tabular_field_type;
        },

        hideRowForRadios() {
            return this.prop == 'grid_rows' && this.fieldType == 'radio' ? false : true;
        },

        defaultChecked: {
            get() {
                return this.editItem.settings.selected_grids;
            },
            set(val) {
                this.editItem.settings.selected_grids = val;
            }
        },

        isClearBtnDisabled() {
            let disabled = true;
            this.optionsToRender.map(option => {
                if (this.defaultChecked.includes(option.value)) {
                    return disabled = false;
                }
            });
            return disabled;
        },
        alwayShowValues() {
            return this.valuesAlwaysVisible == undefined;
        }
    },
    watch: {
        fieldType() {
            this.defaultChecked = [];
        },

        optionsToRender: {
            handler() {
                let newOptions = {};
                _ff.map(this.optionsToRender, (option) => {
                    newOptions[option.value] = option.label
                });
                this.$emit('input', newOptions);
            },
            deep: true
        }
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
                let value = opt.value;
                value = opt.value.toString();
                let nums = value.match(/\d+/g);
                return nums && Number(nums.pop());
            });
            let key = Math.max(...keys.filter(i => i != 'undefined')) + 1;
            let optionStr = `Item ${key}`;
            let optionKey = optionStr.toLowerCase().replace(/\s/g, '_');

            let newOpt = {
                label: optionStr,
                value: optionKey,
                vkey: new Date().getTime()
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
                    offset: 30
                });
            }
        },

        clear() {
            this.$refs.defaultOptions.map( el => {
                el.checked = false;
                
                const index = this.defaultChecked.indexOf(el.value);

                if (~ index) this.defaultChecked.splice(index, 1);
            });
        },

        updateDefaultOption(option) {
            const selectedGrids = this.defaultChecked;

            if (this.fieldType == 'checkbox') {
                if (event.target.checked) {
                    selectedGrids.push(option.value);
                } else {
                    selectedGrids.splice(selectedGrids.indexOf(option.value), 1);
                }
            } else {
                if (event.target.checked) {
                    this.$set(selectedGrids, 0, option.value);
                } else {
                    this.$set(selectedGrids, 0, '');
                }
            }
        },

        createOptionsToRender() {
            _ff.each(this.value, (label, value) => {
                this.optionsToRender.push({ value, label, vkey: value });
            });
        }
    },
    created() {
        this.createOptionsToRender();
        this.valuesVisible = !this.alwayShowValues;
    }
}
</script>

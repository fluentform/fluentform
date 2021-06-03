<template>
    <el-form-item v-if="editItem.editor_options.element != 'country-list'">
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
                    <div class="checkbox">
                        <input ref="defaultOptions"
                               class="form-control"
                               :type="optionsType"
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

        <el-button type="warning" size="mini" :disabled="!editItem.attributes.value" @click.prevent="clear">Clear
            Selection
        </el-button>
        <el-button @click="initBulkEdit()" size="mini">Bulk Edit</el-button>

        <el-dialog
            :append-to-body="true"
            class="ff_backdrop"
            title="Edit your options"
            :visible.sync="bulkEditVisible"
        >
            <div class="bulk_editor_wrapper">
                <h4>Please provide the value as LABEL:VALUE as each line.</h4>
                <el-input type="textarea" :rows="5" v-model="value_key_pair_text"></el-input>
                <p>You can simply give value only the system will convert the label as value</p>
            </div>
            <span slot="footer" class="dialog-footer">
                <el-button size="mini" @click="bulkEditVisible = false">Cancel</el-button>
                <el-button size="mini" type="primary" @click="confirmBulkEdit()">Confirm</el-button>
            </span>
        </el-dialog>


    </el-form-item>
</template>

<script type="text/babel">
    import elLabel from '../../includes/el-label.vue'
    import each from 'lodash/each';

    export default {
        name: 'select-options',
        props: ['editItem', 'listItem'],
        components: {
            elLabel
        },
        data() {
            return {
                valuesVisible: false,
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
                currentOption.value = event.target.value;
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
                this.bulkEditVisible = false
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
            }
        },
        mounted() {
            this.createOptionsToRender();
        }
    }
</script>

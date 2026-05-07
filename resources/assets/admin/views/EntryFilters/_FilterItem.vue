<template>
    <tr>
        <td class="filter_name">
            <el-popover
                v-if="!view_only && filterOptions && filterOptions.length"
                placement="bottom-start"
                width="450"
                trigger="click"
                v-model="changeFieldOpen">
                <el-cascader-panel
                    class="ff_filter_field_picker"
                    :options="filterOptions"
                    v-model="changeFieldSelection"
                    @change="maybeChangeField" />
                <span slot="reference" class="ff_filter_field_btn" :title="$t('Click to change field')">
                    {{ itemConfig.provider | ucFirst }}
                    <span class="fs_provider_separator">/</span>
                    {{ itemConfig.label }}
                    <i class="el-icon-edit-outline ff_filter_field_edit_icon"></i>
                </span>
            </el-popover>
            <span v-else>
                {{ itemConfig.provider | ucFirst }}
                <span class="fs_provider_separator">/</span>
                {{ itemConfig.label }}
            </span>
            <span v-if="itemConfig.help">
                <el-tooltip class="item" effect="dark" placement="top-start">
                    <i class="el-icon el-icon-info"></i>
                    <span slot="content" v-html="itemConfig.help"></span>
                </el-tooltip>
            </span>
        </td>
        <td class="fc_filter_operator">
            <el-select :disabled="view_only" size="mini" :placeholder="$t('Select Operator')"
                       @visible-change="maybeOperatorSelected"
                       v-model="item.operator">
                <el-option v-for="(optionLabel, option) in operators" :key="option" :value="option"
                           :label="optionLabel" :title="operatorHelp[option] || ''"></el-option>
            </el-select>
        </td>
        <td class="fc_filter_value">
            <template v-if="item.operator == 'is_null' || item.operator == 'not_null'">
                --
            </template>
            <template v-else>
                <el-input size="mini"
                          v-if="isNumericType"
                          :type="isMultiValueOperator ? 'text' : 'number'"
                          :placeholder="isMultiValueOperator ? $t('Comma-separated values, e.g. 1,5,10') : $t('Condition Value')"
                          v-model="item.value"/>
                <template v-else-if="itemConfig.type == 'dates'">
	                <el-date-picker :type="dateType"
	                                :disabled="view_only" value-format="yyyy-MM-dd HH:mm:ss"
	                                size="mini"
	                                :range-separator="$t('To')"
	                                :start-placeholder="$t('Start date')"
	                                :end-placeholder="$t('End date')"
	                                v-model="item.value"></el-date-picker>
                </template>
	            <template v-else-if="itemConfig.type == 'time'">
		            <el-time-picker
			            :is-range="isTimeRange"
			            v-model="item.value"
			            size="mini"
			            value-format="HH:mm:ss"
			            :range-separator="$t('To')"
			            :start-placeholder="$t('Start date')"
			            :end-placeholder="$t('End date')"
		            >
		            </el-time-picker>
                </template>
                <template v-else-if="itemConfig.type == 'selections'">
                    <template v-if="itemConfig.options">
                        <el-select :disabled="view_only" size="mini" :multiple="itemConfig.is_multiple"
                                   :placeholder="$t('Select Option')"
                                   v-model="item.value">
                            <el-option v-for="(optionLabel,option) in itemConfig.options" :key="option" :value="option"
                                       :label="optionLabel"></el-option>
                        </el-select>
                    </template>

                    <template v-else-if="itemConfig.disable_values">
                        <p v-html="itemConfig.value_description"></p>
                    </template>
                    <pre v-else>{{ itemConfig }}</pre>
                </template>
                <template v-else-if="itemConfig.type == 'single_assert_option' || itemConfig.type == 'straight_assert_option'">
                    <el-select size="mini" :placeholder="$t('Select Option')" :disabled="view_only"
                               v-model="item.value">
                        <el-option v-for="(optionLabel,option) in itemConfig.options" :key="option" :value="option"
                                   :label="optionLabel"></el-option>
                    </el-select>
                </template>
                <template v-else-if="itemConfig.type == 'times_numeric'">
                    <item-times-selection :disabled="view_only" v-model="item.value" :field="itemConfig"/>
                </template>
                <div class="fc_composite_filters" v-else-if="itemConfig.type == 'composite_optioned_compare'">
                    <div v-if="itemConfig.ajax_selector" class="fc_composite_filter">
                        <label>{{itemConfig.ajax_selector.label}}</label>
                        <div class="fc_composite_input">
                            ajax selector
                        </div>
                    </div>
                    <div class="fc_composite_filter">
                        <label>{{itemConfig.value_config.label}}</label>
                        <div class="fc_composite_input">
                            <el-input size="mini" v-model="item.value" :type="itemConfig.value_config.data_type" :placeholder="itemConfig.value_config.placeholder"></el-input>
                        </div>
                    </div>
                </div>
	            <el-input :disabled="view_only" size="mini" v-else
	                      :placeholder="$t('Condition Value')"
	                      type="text" v-model="item.value"/>
            </template>
        </td>
        <td v-if="!view_only" class="fc_filter_actions">
            <el-button
                plain
                icon="el-icon-delete"
                @click="removeItem()"
                size="mini"
                type="danger">
            </el-button>
        </td>
    </tr>
</template>

<script type="text/babel">
import isArray from 'lodash/isArray';


export default {
    name: 'RichFilterItem',
    props: {
        item: { type: Object, required: true },
        filterLabels: { type: Object, default: () => ({}) },
        filterOptions: { type: Array, default: () => [] },
        view_only: { type: Boolean, default: false }
    },
    components: {

    },
    data() {
        return {
			all_operator : window.fluent_form_entries_vars.advanced_filters_operators || {},
			all_columns : window.fluent_form_entries_vars.advanced_filters_columns || {},
            changeFieldOpen: false,
            changeFieldSelection: []
        }
    },
    computed: {
        /**
         * Short, plain-language descriptions for each operator. Shown as a
         * native title tooltip when the user hovers an option in the
         * operator dropdown.
         */
        operatorHelp() {
            return {
                '=': this.$t('Field value is exactly equal to the input'),
                '!=': this.$t('Field value is anything other than the input'),
                '>': this.$t('Field value is greater than the input'),
                '<': this.$t('Field value is less than the input'),
                '>=': this.$t('Field value is greater than or equal to the input'),
                '<=': this.$t('Field value is less than or equal to the input'),
                'IN': this.$t('Field value matches any item in the comma-separated list'),
                'NOT IN': this.$t('Field value does not match any item in the comma-separated list'),
                'BETWEEN': this.$t('Field value falls between two values (inclusive)'),
                'NOT BETWEEN': this.$t('Field value falls outside the two values'),
                'contains': this.$t('Field value contains this text anywhere'),
                'doNotContains': this.$t('Field value does not contain this text'),
                'startsWith': this.$t('Field value begins with this text'),
                'endsWith': this.$t('Field value ends with this text'),
                'is_null': this.$t('Field has no value'),
                'not_null': this.$t('Field has any value')
            };
        },
	    operators() {
		    let operators = { ...this.all_operator };
		    const type = this.itemConfig.type;
		    const itemName = this.item.source.join('.');
			let allow_operators = [];
			if (['dates', 'time'].includes(type)) {
			    allow_operators = ['=', '!=', '<', '<=', '>', '>=', 'BETWEEN', 'NOT BETWEEN'];
		    } else if (['is_favourite', 'straight_assert_option'].includes(type)) {
			    allow_operators = ['=', '!='];
		    } else if (type == 'single_assert_option') {
			    allow_operators = ['='];
		    } else if (type == 'selections') {
			    if (this.itemConfig.is_multiple) {
					allow_operators = ['IN', 'NOT IN'];
			    } else {
				    allow_operators = ['=', '!='];
			    }
		    } else if (this.isNumericType) {
			    allow_operators = ['>', '<', '>=', '<=', '=', '!=', 'IN', 'NOT IN'];
		    } else {
				allow_operators = ['=', '!=', 'IN', 'NOT IN', 'contains', 'doNotContains', 'startsWith', 'endsWith'];
		    }
		    for (const key in operators) {
			    if (!(allow_operators.includes(key))) {
				    delete operators[key];
			    }
		    }
		    return operators;
	    },
	    isNumericType(){
			return this.itemConfig.type == 'numeric' || this.all_columns.numeric.includes(this.item.source.join('.'));
	    },
        /**
         * Operators that accept a comma-separated list of values. The input
         * for these must be plain text so users can type commas — a
         * native number input strips them.
         */
        isMultiValueOperator() {
            return ['IN', 'NOT IN'].includes(this.item.operator);
        },
	    dateType() {
		    if (['BETWEEN', 'NOT BETWEEN'].includes(this.item.operator)) {
			    return this.itemConfig.date_type + 'range';
		    }
		    return this.itemConfig.date_type;
	    },

	    isTimeRange() {
		    if (['BETWEEN', 'NOT BETWEEN'].includes(this.item.operator)) {
			    return true;
		    }
		    return false;
	    },
	    dateFormat() {
		    return this.itemConfig.date_format;
	    },
        itemConfig() {
            const key = this.item.source.join('-');
            return this.filterLabels[key] || {}
        }
    },
    methods: {
        /**
         * Replace the field source for this filter row with the cascader's
         * new selection. Resets the operator and value because the new field
         * may not support the previously selected operator/value type.
         */
        maybeChangeField(newSource) {
            if (!Array.isArray(newSource) || newSource.length !== 2) {
                return;
            }
            this.item.source = [...newSource];
            this.item.operator = '';
            this.item.value = '';
            this.changeFieldOpen = false;
            this.changeFieldSelection = [];
        },
        closingSource(status) {
            if (!status) {
                setTimeout(() => {
                    jQuery(this.$el).find('.fc_filter_operator .el-select').trigger('click');
                }, 300);
            }
        },
        maybeOperatorSelected(status) {
            if (!status && this.item.operator) {
                if (this.itemConfig.type == 'dates') {
                    this.item.value = '';
                }
                setTimeout(() => {
                    jQuery(this.$el).find('.fc_filter_value input').focus();
                }, 200);
            }
        },
        removeItem() {
            this.$emit('removeItem');
        }
    },
    mounted() {
        if (this.itemConfig.is_multiple && !isArray(this.item.value)) {
            this.item.value = [];
        }
        if (!this.item.operator) {
            const objectValues = Object.keys(this.operators);
            if (objectValues.length) {
                this.item.operator = objectValues[0];
                jQuery(this.$el).find('.fc_filter_operator .el-select').trigger('click');
            }
        } else {
            const itemOperator = this.item.operator;

            const objectValues = Object.keys(this.operators);

            if (objectValues.length && objectValues.indexOf(itemOperator) === -1) {
                this.item.operator = objectValues[0];
            }
        }
    }
}
</script>

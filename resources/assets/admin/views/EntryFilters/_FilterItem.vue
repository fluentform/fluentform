<template>
    <tr>
        <td style="width: 210px; line-height: 110%;" class="filter_name">
            {{ itemConfig.provider|ucFirst }} <span class="fs_provider_separator">/</span>
            {{ itemConfig.label }}
            <span v-if="itemConfig.help">
                <el-tooltip class="item" effect="dark" placement="top-start">
                    <i class="el-icon el-icon-info"></i>
                    <template #content v-html="itemConfig.help"></template>
                </el-tooltip>
            </span>
        </td>
        <td style="width: 190px" class="fc_filter_operator">
            <el-select :disabled="view_only" size="small" :placeholder="$t('Select Operator')"
                       @visible-change="maybeOperatorSelected"
                       v-model="item.operator">
                <el-option v-for="(optionLabel, option) in operators" :key="option" :value="option"
                           :label="optionLabel"></el-option>
            </el-select>
        </td>
        <td class="fc_filter_value">
            <template v-if="item.operator == 'is_null' || item.operator == 'not_null'">
                --
            </template>
            <template v-else>
                <el-input size="small" v-if="isNumericType" type="number"
                          :placeholder="$t('Condition Value')"
                          v-model="item.value" />
                <template v-else-if="itemConfig.type === 'dates'">
                    <el-date-picker :type="dateType"
                                    :disabled="view_only" value-format="yyyy-MM-dd HH:mm:ss"
                                    size="small"
                                    :range-separator="$t('To')"
                                    :start-placeholder="$t('Start date')"
                                    :end-placeholder="$t('End date')"
                                    v-model="item.value"></el-date-picker>
                </template>
                <template v-else-if="itemConfig.type === 'time'">
                    <el-time-picker
                        :is-range="isTimeRange"
                        v-model="item.value"
                        size="small"
                        value-format="HH:mm:ss"
                        :range-separator="$t('To')"
                        :start-placeholder="$t('Start date')"
                        :end-placeholder="$t('End date')"
                    >
                    </el-time-picker>
                </template>
                <template v-else-if="itemConfig.type === 'selections'">
                    <template v-if="itemConfig.options">
                        <el-select :disabled="view_only" size="small" :multiple="itemConfig.is_multiple"
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
                <template
                    v-else-if="itemConfig.type === 'single_assert_option' || itemConfig.type === 'straight_assert_option'">
                    <el-select size="small" :placeholder="$t('Select Option')" :disabled="view_only"
                               v-model="item.value">
                        <el-option v-for="(optionLabel,option) in itemConfig.options" :key="option" :value="option"
                                   :label="optionLabel"></el-option>
                    </el-select>
                </template>
                <template v-else-if="itemConfig.type === 'times_numeric'">
                    <item-times-selection :disabled="view_only" v-model="item.value" :field="itemConfig" />
                </template>
                <div class="fc_composite_filters" v-else-if="itemConfig.type === 'composite_optioned_compare'">
                    <div v-if="itemConfig.ajax_selector" class="fc_composite_filter">
                        <label>{{ itemConfig.ajax_selector.label }}</label>
                        <div class="fc_composite_input">
                            ajax selector
                        </div>
                    </div>
                    <div class="fc_composite_filter">
                        <label>{{ itemConfig.value_config.label }}</label>
                        <div class="fc_composite_input">
                            <el-input size="small" v-model="item.value" :type="itemConfig.value_config.data_type"
                                      :placeholder="itemConfig.value_config.placeholder"></el-input>
                        </div>
                    </div>
                </div>
                <el-input :disabled="view_only" size="small" v-else
                          :placeholder="$t('Condition Value')"
                          type="text" v-model="item.value" />
            </template>
        </td>
        <td v-if="!view_only" style="width: 50px; text-align: right;">
            <el-button
                plain
                @click="removeItem()"
                size="small"
                type="danger"
            >
                <template #icon>
                    <i class="el-icon-delete"></i>
                </template>
            </el-button>
        </td>
    </tr>
</template>

<script type="text/babel">
import isArray from "lodash/isArray";
import ItemTimesSelection from "@/admin/views/EntryFilters/_ItemTimesSelection.vue";


export default {
    name: "RichFilterItem",
    props: ["item", "filterLabels", "view_only"],
    components: {
        ItemTimesSelection
    },
    data() {
        return {
            all_operator: window.fluent_form_entries_vars.advanced_filters_operators || {},
            all_columns: window.fluent_form_entries_vars.advanced_filters_columns || {}
        };
    },
    computed: {
        operators() {
            let operators = { ...this.all_operator };
            const type = this.itemConfig.type;
            const itemName = this.item.source.join(".");
            let allow_operators = [];
            if (["dates", "time"].includes(type)) {
                allow_operators = ["=", "!=", "<", "<=", ">", ">=", "BETWEEN", "NOT BETWEEN"];
            } else if (["is_favourite", "straight_assert_option"].includes(type)) {
                allow_operators = ["=", "!="];
            } else if (type == "single_assert_option") {
                allow_operators = ["="];
            } else if (type == "selections") {
                if (this.itemConfig.is_multiple) {
                    allow_operators = ["IN", "NOT IN"];
                } else {
                    allow_operators = ["=", "!="];
                }
            } else if (this.isNumericType) {
                allow_operators = [">", "<", ">=", "<=", "=", "!="];
            } else {
                allow_operators = ["=", "!=", "IN", "NOT IN", "contains", "doNotContains", "startsWith", "endsWith"];
            }
            for (const key in operators) {
                if (!(allow_operators.includes(key))) {
                    delete operators[key];
                }
            }
            return operators;
        },
        isNumericType() {
            return this.itemConfig.type == "numeric" || this.all_columns.numeric.includes(this.item.source.join("."));
        },
        dateType() {
            if (["BETWEEN", "NOT BETWEEN"].includes(this.item.operator)) {
                return this.itemConfig.date_type + "range";
            }
            return this.itemConfig.date_type;
        },

        isTimeRange() {
            if (["BETWEEN", "NOT BETWEEN"].includes(this.item.operator)) {
                return true;
            }
            return false;
        },
        dateFormat() {
            return this.itemConfig.date_format;
        },
        itemConfig() {
            const key = this.item.source.join("-");
            return this.filterLabels[key] || {};
        }
    },
    methods: {
        closingSource(status) {
            if (!status) {
                setTimeout(() => {
                    jQuery(this.$el).find(".fc_filter_operator .el-select").trigger("click");
                }, 300);
            }
        },
        maybeOperatorSelected(status) {
            if (!status && this.item.operator) {
                if (this.itemConfig.type == "dates") {
                    this.item.value = "";
                }
                setTimeout(() => {
                    jQuery(this.$el).find(".fc_filter_value input").focus();
                }, 200);
            }
        },
        removeItem() {
            this.$emit("removeItem");
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
                jQuery(this.$el).find(".fc_filter_operator .el-select").trigger("click");
            }
        } else {
            const itemOperator = this.item.operator;

            const objectValues = Object.keys(this.operators);

            if (objectValues.length && objectValues.indexOf(itemOperator) === -1) {
                this.item.operator = objectValues[0];
            }
        }
    }
};
</script>

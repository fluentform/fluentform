<template>
    <div class="ff_routing_fields">
        <div v-if="!disabled">
            <table class="ff_routing_table">
                <tbody>
                    <tr v-for="(routing, key) in routings" :key="key">
                        <td>
                            <label class="ff_inline">
                                {{labels.input_label}}
                                <el-input v-if="input_type == 'text'" :placeholder="labels.input_placeholder" size="small" v-model="routing.input_value"/>
                                <el-select size="small" v-else-if="input_type == 'select'" v-model="routing.input_value" :placeholder="labels.input_placeholder">
                                    <el-option
                                        v-for="(item,itemValue) in input_options"
                                        :key="itemValue"
                                        :label="item"
                                        :value="itemValue">
                                    </el-option>
                                </el-select>
                            </label>
                        </td>
                        <td>
                            If
                        </td>
                        <td>
                            <el-select size="small" v-model="routing.field" style="width: 100%" @change="routing.value = ''">
                                <el-option v-for="(field, key) in fields" :key="key"
                                           :label="field.admin_label" :value="key"
                                ></el-option>
                            </el-select>
                        </td>
                        <td>
                            <el-select size="small" v-model="routing.operator">
                                <el-option value="=" label="equal"></el-option>
                                <el-option value="!=" label="not equal"></el-option>
                                <template v-if="fields[routing.field] && !Object.keys(fields[routing.field].options).length">
                                    <el-option value=">" label="greater than"></el-option>
                                    <el-option value="<" label="less than"></el-option>
                                    <el-option value=">=" label="greater than or equal"></el-option>
                                    <el-option value="<=" label="less than or equal"></el-option>
                                    <el-option value="contains" label="contains"></el-option>
                                    <el-option value="doNotContains" label="do not contains"></el-option>
                                    <el-option value="startsWith" label="starts with"></el-option>
                                    <el-option value="endsWith" label="ends with"></el-option>
                                </template>
                            </el-select>
                        </td>
                        <td>
                            <el-select size="small"
                                       v-if="fields[routing.field] && Object.keys(fields[routing.field].options).length"
                                       v-model="routing.value" style="width: 100%">
                                <el-option v-for="(label, value) in fields[routing.field].options" :key="value"
                                           :label="label" :value="value"
                                ></el-option>
                            </el-select>
                            <el-input size="small" v-else placeholder="Enter a value" v-model="routing.value"></el-input>
                        </td>
                        <td>
                            <div style="line-height: 100%;" class="action-btns ">
                                <i class="el-icon-plus" @click="add(key)"></i>
                                <i class="el-icon-minus" @click="remove(key)" v-if="routings.length > 1"></i>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <coming-soon v-else :visibility.sync="comingSoon"/>

    </div>
</template>

<script type="text/babel">
    import ComingSoon from '../../modals/ItemDisabled';

    export default {
        name: 'RoutingFilterFields',
        components: {
            ComingSoon
        },
        props: {
            routings: {
                type: Array,
                required: true,
                default: []
            },
            fields: {
                type: Object,
                required: true,
                default: {}
            },
            disabled: {
                type: Boolean,
                required: false,
                default: false,
            },
            labels: {
                default: () => ({
                    input_label: 'Send To',
                    input_placeholder: 'Email Address'
                })
            },
            input_type: {
                type: String,
                default: 'text'
            },
            input_options: {
                type: Object,
                required: false,
                default: {}
            }
        },
        data() {
            return {
                defaultRules: {
                    input_value: '',
                    field: '',
                    operator: '=',
                    value: null
                },
                comingSoon: false,
            }
        },
        methods: {
            add(index) {
                this.routings.splice(index + 1, 0, {...this.defaultRules});
            },
            remove(index) {
                this.routings.splice(index, 1);
            }
        },
        mounted() {
            if (!this.routings || !this.routings.length) {
                this.routings.push({...this.defaultRules});
            }
        }
    };
</script>

<style>
    .action-btns i {
        cursor: pointer;
        padding: 2px;
    }

    .action-btns i:hover {
        color: #58B7FF
    }

    .ff_inline .el-input {
        display: inline-block;
        width: auto;
    }
    .ff_routing_fields {
        margin-bottom: 30px;
    }
    table.ff_routing_table {
        width: 100%;
        border: 0;
        border-spacing: 0;
        border-collapse: collapse;
    }

    table.ff_routing_table tr td {
        padding: 12px 3px;
        border: 0;
    }

    table.ff_routing_table tr {
        border: 1px solid #e8e8ec70;
        border-left: 0;
        border-right: 0;
    }
</style>

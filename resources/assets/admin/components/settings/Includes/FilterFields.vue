<template>
    <div class="ff_filter_fields_wrap">
        <div class="ff_block_item">
            <el-checkbox v-model="conditionals.status" v-if="!disabled">
                {{ labels.status_label }}
            </el-checkbox>
            <el-checkbox v-else disabled @click.native="comingSoon = true">
                {{ labels.status_label }}
            </el-checkbox>
        </div><!--.ff_block_item -->

        <div v-if="conditionals.status" class="ff_block_item">
            <div class="ff_block_title_group mb-4">
                <h6 class="ff_block_title fw-500">{{ labels.notification_if_start }}</h6>
                <select class="ff_select ff_select_small w-80px ml-2 mr-2" v-model="conditionals.type">
                    <option v-for="(label, value) in {all: 'All', any: 'Any'}" :key="value" :value="value">
                        {{ label }}
                    </option>
                </select>
                <h6 class="ff_block_title fw-500">{{ labels.notification_if_end }}</h6>
            </div><!--.ff_block_title_group -->
            <div class="ff_block_item_body">
                <el-row class="items-center" v-for="(logic, key) in items" :key="key" :gutter="10">
                    <el-col :span="8">
                        <el-select class="w-100" v-model="items[key].field" @change="items[key].value = ''">
                            <el-option v-for="(field, key) in fields" :key="key" :label="field.admin_label" :value="key"></el-option>
                        </el-select>
                    </el-col>
                    <el-col :span="5">
                        <el-select class="w-100" v-model="items[key].operator">
                            <el-option-group :label="$t('General Operators')">
                                <el-option value="=" :label="$t('equal')"></el-option>
                                <el-option value="!=" :label="$t('not equal')"></el-option>
                                <template v-if="fields[logic.field] && !Object.keys(fields[logic.field].options).length">
                                    <el-option value=">" :label="$t('greater than')"></el-option>
                                    <el-option value="<" :label="$t('less than')"></el-option>
                                    <el-option value=">=" :label="$t('greater than or equal')"></el-option>
                                    <el-option value="<=" :label="('less than or equal')"></el-option>
                                    <el-option value="contains" :label="$t('contains')"></el-option>
                                    <el-option value="doNotContains" :label="$t('do not contains')"></el-option>
                                    <el-option value="startsWith" :label="$t('starts with')"></el-option>
                                    <el-option value="endsWith" :label="$t('ends with')"></el-option>
                                </template>
                            </el-option-group>
                            <el-option-group :label="$t('Advanced Operators')">
                                <el-option value="length_equal" :label="$t('Equal to Data Length')"></el-option>
                                <el-option value="length_less_than" :label="$t('Less than to Data length')"></el-option>
                                <el-option value="length_greater_than" :label="$t('Greater than to Data Length')"></el-option>
                                <el-option value="test_regex" :label="$t('Regex Match')"></el-option>
                            </el-option-group>
                        </el-select>
                    </el-col>

                    <el-col :span="8">
                        <template v-if="items[key].operator == 'length_equal' || items[key].operator == 'length_less_than' || items[key].operator == 'length_greater_than'">
                            <el-input type="number" step="1" :placeholder="('Enter length in number')" v-model="items[key].value" />
                        </template>
                        <template v-else>
                            <el-select class="w-100" v-if="fields[logic.field] && Object.keys(fields[logic.field].options).length" v-model="items[key].value">
                                <el-option v-for="(label, value) in fields[logic.field].options" :key="value" :label="label" :value="value"></el-option>
                            </el-select>
                            <el-input v-else :placeholder="$t('Enter a value')" v-model="items[key].value"></el-input>
                        </template>
                    </el-col>

                    <el-col :span="3">
                        <ul class="ff_icon_group">
                            <li>
                                <div class="ff_icon_btn sm dark ff_icon_btn_clickable" @click="add(key)">
                                    <i class="el-icon-plus"></i>
                                </div>
                            </li> 
                            <li v-if="items.length > 1">
                                <div class="ff_icon_btn sm dark ff_icon_btn_clickable" @click="remove(key)">
                                   <i class="el-icon-minus"></i>
                                </div>
                            </li>
                        </ul>
                    </el-col>
                </el-row>
            </div><!--.ff_block_item_body -->
        </div><!-- .ff_block_item -->

    </div>
</template>

<script>
export default {
    name: 'FilterFields',
    props: {
        conditionals: {
            type: Object,
            required: true,
            default: {}
        },
        fields: {
            type: Object,
            required: true,
            default: {}
        },
        disabled: {
            type: Boolean,
            required: true,
            default: false,
        },
        labels: {
            default: () => ({
                status_label: 'Enable conditional logic',
                notification_if_start: 'Send this notification if',
                notification_if_end: 'of the following match:'
            })
        }
    },
    data() {
        return {
            defaultRules: {
                field: null,
                operator: '=',
                value: null
            },
            comingSoon: false,
        }
    },
    computed: {
        items() {
            return this.conditionals.conditions;
        }
    },
    methods: {
        add(index) {
            this.items.splice(index + 1, 0, {...this.defaultRules});
        },
        remove(index) {
            this.items.splice(index, 1);
        }
    },
    mounted() {
        if (!this.conditionals.conditions.length) {
            this.conditionals.conditions.push({...this.defaultRules});
        }
    }
};
</script>

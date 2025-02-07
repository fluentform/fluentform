<template>
    <div>
        <!-- ADDITIONAL OPTIONS : CONDITIONAL LOGIC -->
        <el-form-item>
            <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
            <el-radio v-model="conditional_logics.status" :label="true">{{ $t('Yes') }}</el-radio>
            <el-radio v-model="conditional_logics.status" :label="false">{{ $t('No') }}</el-radio>
        </el-form-item>

        <div class="ff_conditions_warp" v-if="conditional_logics.status">
            <el-form-item>
                <elLabel slot="label" :label="$t('Condition Match')"
                         :helpText="$t('Select to match whether all rules are required or any. if the match success then the field will be shown')"></elLabel>

                <el-radio v-model="conditional_logics.type" label="any">{{ $t('Any') }}</el-radio>
                <el-radio v-model="conditional_logics.type" label="all">{{ $t('All') }}</el-radio>
                <el-radio v-model="conditional_logics.type" label="group">{{ $t('Group') }}</el-radio>
            </el-form-item>

            <div v-if="conditional_logics.type!='group'" v-for="(condition, i) in conditional_logics.conditions" :key="i" class="conditional-logic">
                <select
                        v-model="condition.field"
                        @change="condition.value = ''"
                        :placeholder="$t('Select')"
                        class="condition-field ff-select ff-select-small"
                >
                    <option value="" disabled>Select</option>
                    <template v-for="(dep, meta, i) in dependencies">
                        <option
                            v-if="meta != editItem.attributes.name"
                            :key="i"
                            :value="meta">{{ dep.field_label || meta }}
                        </option>
                    </template>
                </select>
                <select v-model="condition.operator" :placeholder="$t('Select')" class="condition-operator ff-select ff-select-small">
                    <option value="" disabled>{{ $t('Select') }}</option>
                    <option value="=">{{ $t('equal') }}</option>
                    <option value="!=">{{ $t('not equal') }}</option>

                    <template
                            v-if="condition.field && (!dependencies[condition.field] || !dependencies[condition.field].options)">
                        <option value=">">{{ $t('greater than') }}</option>
                        <option value="<">{{ $t('less than') }}</option>
                        <option value=">=">{{ $t('greater than or equal') }}</option>
                        <option value="<=">{{ $t('less than or equal') }}</option>
                        <option value="contains">{{ $t('includes') }}</option>
                        <option value="doNotContains">{{ $t('not includes') }}</option>
                        <option value="startsWith">{{ $t('starts with') }}</option>
                        <option value="endsWith">{{ $t('ends with') }}</option>
                        <option value="test_regex">{{ $t('Regex match') }}</option>
                    </template>
                </select>

                <template v-if="condition.field">
                    <input
                            v-if="!dependencies[condition.field] ||!dependencies[condition.field].options"
                            class="form-control-2 condition-value"
                            type="text"
                            v-model="condition.value"
                    >
                    <select v-else-if="dependencies[condition.field] && dependencies[condition.field].options"
                            v-model="condition.value" :placeholder="$t('Select')" class="condition-value ff-select ff-select-small">
                        <option value="" selected >{{ $t('Select') }}</option>
                        <option v-for="(option, i) in dependencies[condition.field].options"
                                :key="i"
                                :value="option.value">{{ option.label }}
                        </option>
                    </select>
                </template>

                <!-- JUST A PLACEHOLDER -->
                <select v-else class="condition-value ff-select ff-select-small">
                    <option value="" disabled selected>{{ $t('Select') }}</option>
                </select>
                <action-btn>
                    <action-btn-add @click="conditional_logics.conditions.pushAfter(i, emptyRules)" size="mini"></action-btn-add>
                    <action-btn-remove @click="decreaseLogic(i)" size="mini"></action-btn-remove>
                </action-btn>
            </div>

            <div v-if="conditional_logics.type == 'group'">
                <div v-for="(group, groupIndex) in conditional_logics.condition_groups"
                     :key="groupIndex"
                     class="group-container"
                     :class="{'is-empty': isGroupEmpty(group)}">

                    <div class="group-header">
                        <div class="title-section">
                            <template v-if="group.isEditingTitle">
                                <el-input
                                        v-model="group.title"
                                        size="small"
                                        class="title-input"
                                        @blur="finishTitleEdit(group)"
                                        @keyup.enter.native="finishTitleEdit(group)"
                                        v-clickoutside="() => finishTitleEdit(group)"
                                        v-focus
                                />
                            </template>
                            <template v-else>
                                <div class="group-title" @click="startTitleEdit(group)">
                                    <span v-if="group.title">{{ group.title }}</span>
                                    <span v-else>{{ `${$t('Group')} ${groupIndex + 1}` }}</span>
                                    <i class="el-icon-edit-outline" style="font-size: 12px; margin-left: 5px;"></i>
                                </div>
                            </template>
                            <div class="group-relationship">
                                <b> {{ groupIndex === 0 ? $t('IF') : $t('OR IF') }} </b>
                            </div>
                        </div>

                        <div class="actions">

                            <el-button size="mini"   v-if="conditional_logics.condition_groups.length > 1" @click="removeGroup(groupIndex)" icon="el-icon-delete" type="danger" plain>
                            </el-button>

                            <el-button size="mini"   v-if="conditional_logics.condition_groups.length > 1" @click="toggleGroup(groupIndex)"  type="default" plain>
                                <i :class="[
                                    { 'el-icon-arrow-up': group.isGroupOpen },
                                    { 'el-icon-arrow-down': !group.isGroupOpen }
                                ]"> </i>
                            </el-button>
                        </div>
                    </div>

                    <!-- Conditions within group -->
                    <div v-for="(condition, conditionIndex) in group.rules"
                         :key="conditionIndex"
                         class="conditional-logic" v-show="group.isGroupOpen">
                        <select
                                v-model="condition.field"
                                @change="condition.value = ''"
                                :placeholder="$t('Select')"
                                class="condition-field ff-select ff-select-small"
                        >
                            <option value="" disabled>{{ $t('Select') }}</option>
                            <template v-for="(dep, meta, i) in dependencies">
                                <option
                                        v-if="meta != editItem.attributes.name"
                                        :key="i"
                                        :value="meta"
                                >
                                    {{ dep.field_label || meta }}
                                </option>
                            </template>
                        </select>

                        <!-- Operator Selection -->
                        <select
                                v-model="condition.operator"
                                :placeholder="$t('Select')"
                                class="condition-operator ff-select ff-select-small"
                        >
                            <option value="" disabled>{{ $t('Select') }}</option>
                            <option value="=">{{ $t('equal') }}</option>
                            <option value="!=">{{ $t('not equal') }}</option>

                            <template v-if="condition.field && (!dependencies[condition.field] || !dependencies[condition.field].options)">
                                <option value=">">{{ $t('greater than') }}</option>
                                <option value="<">{{ $t('less than') }}</option>
                                <option value=">=">{{ $t('greater than or equal') }}</option>
                                <option value="<=">{{ $t('less than or equal') }}</option>
                                <option value="contains">{{ $t('includes') }}</option>
                                <option value="doNotContains">{{ $t('not includes') }}</option>
                                <option value="startsWith">{{ $t('starts with') }}</option>
                                <option value="endsWith">{{ $t('ends with') }}</option>
                                <option value="test_regex">{{ $t('Regex match') }}</option>
                            </template>
                        </select>

                        <!-- Value Input -->
                        <template v-if="condition.field">
                            <input
                                    v-if="!dependencies[condition.field] || !dependencies[condition.field].options"
                                    class="form-control-2 condition-value"
                                    type="text"
                                    v-model="condition.value"
                            >
                            <select
                                    v-else-if="dependencies[condition.field] && dependencies[condition.field].options"
                                    v-model="condition.value"
                                    :placeholder="$t('Select')"
                                    class="condition-value ff-select ff-select-small"
                            >
                                <option value="" selected>{{ $t('Select') }}</option>
                                <option
                                        v-for="(option, i) in dependencies[condition.field].options"
                                        :key="i"
                                        :value="option.value"
                                >
                                    {{ option.label }}
                                </option>
                            </select>
                        </template>

                        <select v-else class="condition-value ff-select ff-select-small">
                            <option value="" disabled selected>{{ $t('Select') }}</option>
                        </select>

                        <action-btn>
                            <action-btn-add @click="addGroupRule(groupIndex, conditionIndex)" size="mini"/>
                            <action-btn-remove v-if="group.rules.length > 1" @click="removeRule(groupIndex, conditionIndex)" size="mini"/>
                        </action-btn>
                    </div>

                    <div class="preview-section" v-if="!isGroupEmpty(group)">
                        <div class="preview-header" @click="togglePreview(group)">
                            <div class="preview-toggle">
                                <i :class="[
                                    { 'el-icon-arrow-up': group.isPreviewOpen },
                                    { 'el-icon-arrow-down': !group.isPreviewOpen }
                                ]"></i>
                            </div>
                        </div>

                        <div v-show="group.isPreviewOpen" class="preview-content">
                            <div class="group-preview">
                                <div class="preview-conditions" v-html="getGroupPreview(group)"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="add-group-btn">
                    <el-button
                            @click="addNewGroup"
                            type="primary"
                            plain
                            size="small">
                        {{ $t('+ Add New Group') }}
                    </el-button>
                </div>
            </div>

        </div>

        <el-dialog
                width="30%"
                top="30%"
                style="text-align: center;"
                :visible.sync="showPreventMessage">
            <span>{{ $t('You have to have at least one item here.') }}</span>
            <div style="margin-top: 20px;">
                <el-button @click="showPreventMessage = false">{{ $t('Close') }}</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
    import elLabel from '@/admin/components/includes/el-label.vue'
    import each from "lodash/each";
    import ActionBtn from '@/admin/components/ActionBtn/ActionBtn.vue';
    import ActionBtnAdd from '@/admin/components/ActionBtn/ActionBtnAdd.vue';
    import ActionBtnRemove from '@/admin/components/ActionBtn/ActionBtnRemove.vue';

    export default {
        name: 'conditionalLogics',
        props: ['listItem', 'editItem', 'form_items'],
        components: {
            elLabel,
            ActionBtn,
            ActionBtnAdd,
            ActionBtnRemove
        },
        data() {
            return {
                inputs: null,
                conditionalSupportedFields: [
                    'input_hidden',
                    'address',
                    'input_name',
                    'select',
                    'ratings',
                    'net_promoter',
                    'textarea',
                    'input_url',
                    'input_text',
                    'input_date',
                    'input_email',
                    'input_radio',
                    'input_number',
                    'select_country',
                    'input_checkbox',
                    'input_password',
                    'terms_and_condition',
                    'gdpr_agreement',
                    'phone',
                    'rangeslider',
                    'net_promoter_score',
                    'post_title',
                    'post_content',
                    'post_excerpt',
                    'taxonomy',
                    'input_image',
                    'input_file',
                    'chained_select',
                    'payment_method',
                    'custom_payment_component',
                    'multi_payment_component',
                    'item_quantity_component',
                    'cpt_selection',
                    'dynamic_field',
                    'subscription_payment_component'
                ],
                showPreventMessage: false,
                emptyRules: { field: '', value: '', operator: '' },
            }
        },
        computed: {
            conditional_logics: {
                get() {
                    return this.editItem.settings.conditional_logics;
                },
                set(defaultObj) {
                    this.editItem.settings.conditional_logics = defaultObj;
                }
            },

            /**
             * Conditions of one element can possibly
             * depend on those elements
             * @return {Object}
             */
            dependencies() {
                let dependencies = {};
                this.mapElements(this.form_items, (formItem) => {
                    if (this.conditionalSupportedFields.includes(formItem.element)) {
                        if (this.editItem.uniqElKey != formItem.uniqElKey) {
                            if (['terms_and_condition', 'gdpr_agreement'].includes(formItem.element)) {
                                dependencies[formItem.attributes.name] = {
                                    options: this.formatOptions({'on': 'Checked'}),
                                    field_label: formItem.settings.label
                                }
                            } else if (['address', 'input_name'].includes(formItem.element)) {
                                this.mapElements(formItem.fields, item => {
                                    if (item.settings.visible) {
                                        let name = formItem.attributes.name + '[' + item.attributes.name + ']';
                                        dependencies[name] = {
                                            options: item.options ? this.formatOptions(item.options) : null,
                                            field_label: formItem.attributes.name + '[' + item.settings.label + ']'
                                        };
                                        if (item.element == 'select_country') {
                                            dependencies[name]['options'] = this.formatOptions(window.FluentFormApp.countries);
                                        }
                                    }
                                });
                            } else if (formItem.element === 'chained_select') {
                                this.mapElements(formItem.settings.data_source.headers, item => {
                                    let name = formItem.attributes.name + '[' + item + ']';
                                    dependencies[name] = {
                                        options: formItem.options ? this.formatOptions(formItem.options) : null,
                                        field_label: formItem.attributes.name + '[' + item + ']'
                                    };
                                });
                            } else if (formItem.element == 'select_country') {
                                dependencies[formItem.attributes.name] = {
                                    options: this.formatOptions(window.FluentFormApp.countries),
                                    field_label: formItem.settings.label
                                };
                            } else if (['input_radio', 'select', 'input_checkbox', 'dynamic_field'].includes(formItem.element)) {
                                let options = formItem.options ? this.formatOptions(formItem.options) : null;
                                if (!options) {
                                    options = formItem.settings.advanced_options;
                                }
								if ('text' === formItem.attributes.type) {
									options = null
								}
                                dependencies[formItem.attributes.name] = {
                                    options: options,
                                    field_label: formItem.settings.label
                                }
                            } else if (formItem.element == 'payment_method') {
                                let options = [];
                                each(formItem.settings.payment_methods, (optionItem, itemName) => {
                                    options.push({
                                        label: optionItem.title,
                                        value: itemName
                                    })
                                });
                                dependencies[formItem.attributes.name] = {
                                    options: options,
                                    field_label: formItem.settings.label
                                }
                            } else if (formItem.element == 'multi_payment_component') {
                                if (formItem.attributes.type == 'single') {
                                    dependencies[formItem.attributes.name] = {
                                        options: null,
                                        field_label: formItem.settings.label
                                    }
                                } else {
                                    let options = [];
                                    each(formItem.settings.pricing_options, (priceOption) => {
                                        options.push({
                                            label: priceOption.label,
                                            value: priceOption.label
                                        })
                                    });

                                    dependencies[formItem.attributes.name] = {
                                        options: options,
                                        field_label: formItem.settings.label
                                    }
                                }
                            } else if (formItem.element == 'input_number') {
                                if (formItem.attributes.name) {
                                    dependencies[formItem.attributes.name] = {
                                        options: formItem.options ? this.formatOptions(formItem.options) : null,
                                        field_label: formItem.settings.label,
                                    }
                                    this.editItem.settings.conditional_logics.conditions.map(cond => {
                                        if (cond.value && formItem.attributes.name === cond.field && formItem.settings.numeric_formatter) {
                                            cond.numeric_formatter = formItem.settings.numeric_formatter;
                                        }
                                    });
                                }
                            } else {
                                if (formItem.attributes.name) {
                                    dependencies[formItem.attributes.name] = {
                                        options: formItem.options ? this.formatOptions(formItem.options) : null,
                                        field_label: formItem.settings.label
                                    }
                                }
                            }
                        }
                    }
                });

                return dependencies;
            }
        },
        methods: {

            addGroupRule(groupIndex, conditionIndex) {
                const group = this.conditional_logics.condition_groups[groupIndex]
                group.rules.splice(conditionIndex + 1, 0, { ...this.emptyRule })
            },

            removeRule(groupIndex, conditionIndex) {
                const group = this.conditional_logics.condition_groups[groupIndex]
                if (group.rules.length > 1) {
                    group.rules.splice(conditionIndex, 1)
                }
            },

            removeGroup(groupIndex) {
                if (this.conditional_logics.condition_groups.length > 1) {
                    this.conditional_logics.condition_groups.splice(groupIndex, 1)
                }
            },
            isGroupEmpty(group) {
                return group.rules.every(rule => !rule.field && !rule.value);
            },
            togglePreview(group) {
                if (!group.hasOwnProperty('isPreviewOpen')) {
                    this.$set(group, 'isPreviewOpen', false);
                }
                group.isPreviewOpen = !group.isPreviewOpen;
            },
            toggleGroup(groupIndex) {
                const group = this.conditional_logics.condition_groups[groupIndex]
                if (!group.hasOwnProperty('isGroupOpen')) {
                    this.$set(group, 'isGroupOpen', false);
                }
                group.isGroupOpen = !group.isGroupOpen;
            },

            getGroupPreview(group) {
                const conditions = group.rules.map(rule => {
                    if (!rule.field || !rule.operator) return '';

                    const fieldLabel = this.dependencies[rule.field]?.field_label || rule.field;
                    const value = this.dependencies[rule.field]?.options?.find(opt => opt.value === rule.value)?.label || rule.value;
                    const operator = this.getOperatorLabel(rule.operator);

                    return `
                <span class="preview-field">${fieldLabel}</span>
                <span class="preview-operator">${operator}</span>
                <span class="preview-value">${value || ''}</span>
            `;
                }).filter(preview => preview);

                return conditions.join('<span class="preview-and">AND</span>');
            },

            getOperatorLabel(operator) {
                const operators = {
                    '=': this.$t('equals'),
                    '!=': this.$t('not equals'),
                    '>': this.$t('greater than'),
                    '<': this.$t('less than'),
                    '>=': this.$t('greater than or equals'),
                    '<=': this.$t('less than or equals'),
                    'contains': this.$t('contains'),
                    'doNotContains': this.$t('does not contain'),
                    'startsWith': this.$t('starts with'),
                    'endsWith': this.$t('ends with'),
                    'test_regex': this.$t('matches regex')
                };
                return operators[operator] || operator;
            },
            decreaseLogic(index) {
                if (this.conditional_logics.conditions.length > 1) {
                    return this.conditional_logics.conditions.splice(index, 1);
                }
                this.conditional_logics.conditions = [this.emptyRules];
            },
            bootConditionals() {
                if (_ff.isEmpty(this.conditional_logics)) {
                    this.conditional_logics = {
                        type: 'any',
                        status: false,
                        conditions: [this.emptyRules]
                    };
                }
                if (!this.conditional_logics.conditions.length) {
                    this.conditional_logics.conditions.push(this.emptyRules);
                }

                // Ensure condition_groups exists and has at least one group with an empty rule
                if (!this.conditional_logics.condition_groups) {
                    this.$set(this.conditional_logics, 'condition_groups', [{
                        rules: [{ ...this.emptyRules }]
                    }]);
                } else if (!this.conditional_logics.condition_groups.length) {
                    this.conditional_logics.condition_groups.push({
                        rules: [{ ...this.emptyRules }]
                    });
                } else {
                    // Ensure each existing group has at least one rule
                    this.conditional_logics.condition_groups.forEach(group => {
                        if (!group.rules || !group.rules.length) {
                            group.rules = [{ ...this.emptyRules }];
                        }
                    });
                }
            },
            startTitleEdit(group) {
                if (!group.hasOwnProperty('title')) {
                    this.$set(group, 'title', '');
                }
                this.$set(group, 'isEditingTitle', true);
            },
            finishTitleEdit(group) {
                group.isEditingTitle = false;
                if (group.title) {
                    group.title = group.title.trim();
                }
            },
            addNewGroup() {
                if (!this.conditional_logics.condition_groups) {
                    this.$set(this.conditional_logics, 'condition_groups', []);
                }

                const newGroup = {
                    rules: [{ ...this.emptyRules }],
                    title: '',
                    isEditingTitle: false,
                    isPreviewOpen: false,
                    isGroupOpen: true
                };

                this.conditional_logics.condition_groups.push(newGroup);

                // Ensure the conditional_logics type is set to 'group'
                if (this.conditional_logics.type !== 'group') {
                    this.conditional_logics.type = 'group';
                }
            },
            formatOptions(items) {
                let options = [];

                each(items, (value, key) => options.push({
                    label: value,
                    value: key
                }));

                return options;
            }
        },
        beforeMount() {
            this.bootConditionals();
            FluentFormEditorEvents.$on('onElRemoveSuccess', () => {
                if (!this.conditional_logics.conditions.length) {
                    this.conditional_logics.conditions.push(this.emptyRules);
                }
            });
        },
        created() {
            if (this.conditional_logics.condition_groups) {
                this.conditional_logics.condition_groups.forEach(group => {
                    if (!group.hasOwnProperty('title')) {
                        this.$set(group, 'title', '');
                    }
                    if (!group.hasOwnProperty('isEditingTitle')) {
                        this.$set(group, 'isEditingTitle', false);
                    }
                    if (!group.hasOwnProperty('isPreviewOpen')) {
                        this.$set(group, 'isPreviewOpen', false);
                    }
                    if (!group.hasOwnProperty('isGroupOpen')) {
                        this.$set(group, 'isGroupOpen', true);
                    }
                });
            }
        }
    }
</script>

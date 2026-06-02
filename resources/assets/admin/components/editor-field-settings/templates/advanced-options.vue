<template>
    <el-form-item class="ff_advanced_options_form_item">
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>

        <div class="ff_advanced_options_toolbar">
            <div v-if="supportsGrouping" class="ff_advanced_options_toolbar__grouping">
                <div class="ff_advanced_options_toolbar__grouping-copy">
                    <span class="ff_advanced_options_toolbar__grouping-title">{{ $t('Enable Option Grouping') }}</span>
                    <small class="ff_advanced_options_toolbar__grouping-help">{{ $t('Create labeled option sections for this field') }}</small>
                </div>
                <el-switch
                    v-model="groupingEnabled"
                    class="ff-switch-sm"
                    active-color="#409EFF"
                    inactive-color="#dcdfe6"
                    @change="handleGroupingModeChange"
                ></el-switch>
            </div>

            <div class="top-check-action">
                <el-checkbox v-model="valuesVisible">{{ $t('Show Values') }}</el-checkbox>
                <el-checkbox v-if="hasCalcValueSupport" v-model="editItem.settings.calc_value_status">{{ $t('Calc Values') }}</el-checkbox>
                <template v-if="has_pro">
                    <el-checkbox v-if="hasImageSupport" v-model="editItem.settings.enable_image_input">{{ $t('Photo') }}</el-checkbox>
                </template>
                <template v-else-if="hasImageSupport">
                    <el-checkbox v-model="pro_mock" @change="showProMessage()">{{ $t('Photo') }}</el-checkbox>
                </template>
            </div>
        </div>

        <vddl-list
            v-if="groupingEnabled"
            class="ff_option_groups_wrap"
            :list="editItem.settings.advanced_options"
            :horizontal="false"
            :drop="handleDrop"
        >
            <vddl-draggable
                v-for="(group, groupIndex) in groupedOptions"
                :key="group.id || `group-${groupIndex}`"
                :draggable="group"
                :index="groupIndex"
                :wrapper="editItem.settings.advanced_options"
                :moved="handleMoved"
                effect-allowed="move"
                class="ff_option_group_drag"
            >
                <vddl-nodrag class="ff_option_group mb-3">
                    <div class="ff_option_group__head">
                        <div class="ff_option_group__head-main">
                            <vddl-handle
                                :handle-left="20"
                                :handle-top="20"
                                class="handle ff_option_group__handle"
                            >
                                <i class="el-icon-rank"></i>
                            </vddl-handle>

                            <button
                                type="button"
                                class="ff_option_group__toggle"
                                @click.prevent="toggleGroup(group)"
                            >
                                <i :class="group.is_open === false ? 'el-icon-arrow-right' : 'el-icon-arrow-down'"></i>
                            </button>

                            <el-input
                                :placeholder="$t('Group label')"
                                v-model="group.label"
                                class="ff_option_group__label"
                            ></el-input>
                        </div>

                        <div class="ff_option_group__actions">
                            <button
                                type="button"
                                class="ff_option_group__icon-btn ff_option_group__icon-btn--danger"
                                @click.prevent="removeGroup(groupIndex)"
                                :title="$t('Remove Group')"
                            >
                                <i class="el-icon-delete"></i>
                            </button>
                        </div>
                    </div>

                    <div v-show="group.is_open !== false" class="ff_option_group__body">
                        <div class="ff_option_group__rail"></div>

                        <div class="ff_option_group__rows">
                            <div
                                v-for="(option, optionIndex) in group.options"
                                :key="`group-${groupIndex}-option-${optionIndex}`"
                                class="ff_option_group__row"
                            >
                                <div v-if="!isRankingField" class="checkbox ff_option_group__default">
                                    <input
                                        class="form-control"
                                        :type="optionsType"
                                        name="fluentform__default-option"
                                        :value="option.value"
                                        :checked="isChecked(option.value)"
                                        @change="updateDefaultOption(option, $event)"
                                    >
                                </div>

                                <div class="ff_option_group__field ff_option_group__field--label">
                                    <el-input
                                        :placeholder="$t('label')"
                                        v-model="option.label"
                                        @input="updateValue(option, $event)"
                                    ></el-input>
                                </div>

                                <div v-if="valuesVisible" class="ff_option_group__field ff_option_group__field--value">
                                    <el-input :placeholder="$t('value')" v-model="option.value"></el-input>
                                </div>

                                <div v-if="editItem.settings.calc_value_status" class="ff_option_group__field ff_option_group__field--calc">
                                    <el-input
                                        :placeholder="$t('calc value')"
                                        type="number"
                                        step="any"
                                        v-model="option.calc_value"
                                    ></el-input>
                                </div>

                                <action-btn>
                                    <action-btn-add @click="addOptionToGroup(groupIndex, optionIndex)" size="mini"></action-btn-add>
                                    <action-btn-remove @click="removeGroupOption(groupIndex, optionIndex)" size="mini"></action-btn-remove>
                                </action-btn>
                            </div>
                        </div>
                    </div>
                </vddl-nodrag>
            </vddl-draggable>

            <button
                type="button"
                class="ff_option_groups_wrap__add"
                @click.prevent="addGroup()"
            >
                <i class="el-icon-circle-plus-outline"></i>
                <span>{{ $t('Create New Option Group') }}</span>
            </button>
        </vddl-list>

        <vddl-list
            :drop="handleDrop"
            v-else-if="optionsToRender.length"
            class="vddl-list__handle ff_advnced_options_wrap"
            :list="editItem.settings.advanced_options"
            :horizontal="false"
        >
            <vddl-draggable
                :moved="handleMoved"
                class="optionsToRender"
                v-for="(option, index) in editItem.settings.advanced_options"
                :key="option.id || index"
                :draggable="option"
                :index="index"
                :wrapper="editItem.settings.advanced_options"
                effect-allowed="move"
            >
                <vddl-nodrag class="nodrag">
                    <div v-if="!isRankingField" class="checkbox">
                        <input
                            ref="defaultOptions"
                            class="form-control"
                            :type="optionsType"
                            name="fluentform__default-option"
                            :value="option.value"
                            :checked="isChecked(option.value)"
                            @change="updateDefaultOption(option, $event)"
                        >
                    </div>

                    <vddl-handle
                        :handle-left="20"
                        :handle-top="20"
                        class="handle"
                    >
                    </vddl-handle>

                    <div
                        style="max-width: 64px; max-height: 32px; overflow: hidden;"
                        v-if="editItem.settings.enable_image_input && hasImageSupport"
                    >
                        <photo-widget enable_clear="yes" v-model="option.image" :for_advanced_option="true" />
                    </div>

                    <div>
                        <el-input
                            :placeholder="$t('label')"
                            v-model="option.label"
                            @input="updateValue(option, $event)"
                        ></el-input>
                    </div>

                    <div v-if="valuesVisible">
                        <el-input :placeholder="$t('value')" v-model="option.value"></el-input>
                    </div>

                    <div v-if="editItem.settings.calc_value_status">
                        <el-input
                            :placeholder="$t('calc value')"
                            type="number"
                            step="any"
                            v-model="option.calc_value"
                        ></el-input>
                    </div>

                    <action-btn v-if="!isToggleField">
                        <action-btn-add @click="increase(index)" size="mini"></action-btn-add>
                        <action-btn-remove @click="decrease(index)" size="mini"></action-btn-remove>
                    </action-btn>
                </vddl-nodrag>
            </vddl-draggable>
        </vddl-list>

        <el-button
            type="warning"
            size="mini"
            v-if="!isRankingField"
            :disabled="!editItem.attributes.value || (Array.isArray(editItem.attributes.value) && !editItem.attributes.value.length)"
            @click.prevent="clear"
        >{{ $t('Clear Selection') }}</el-button>

        <el-button
            size="mini"
            @click="initBulkEdit()"
            v-if="!groupingEnabled && !isToggleField && !editItem.settings.calc_value_status && !editItem.settings.enable_image_input"
        >{{ $t('Bulk Edit / Predefined Data Sets') }} </el-button>

        <el-dialog
            :append-to-body="true"
            class="ff_backdrop"
            :visible.sync="bulkEditVisible"
            width="60%"
        >
            <div slot="title">
                <h4 class="mb-2">{{$t('Edit your options')}}</h4>
                <p>{{ $t('Please provide the value as LABEL:VALUE as each line or select from predefined data sets') }}</p>
            </div>
            <div v-if="bulkEditVisible" class="bulk_editor_wrapper mt-4">
                <el-row :gutter="20">
                    <el-col :span="24">
                        <ul class="ff_bulk_option_groups mb-3">
                            <li
                                @click="setOptions(options)"
                                v-for="(options, optionGroup) in editor_options"
                                :key="optionGroup"
                                :class="{ 'active': options === activeClass}"
                            >{{optionGroup}}</li>
                        </ul>
                    </el-col>
                    <el-col :span="24">
                        <el-input type="textarea" :rows="5" v-model="value_key_pair_text"></el-input>
                        <p class="mt-2">{{ $t('You can simply give value only the system will convert the label as value. To include a colon in either the label or value, use the escape sequence \\:, e.g., LABEL\\:A:VALUE') }}</p>
                    </el-col>
                </el-row>
            </div>
            <div slot="footer" class="dialog-footer text-left mt-4">
                <el-button type="primary" @click="confirmBulkEdit()">{{ $t('Yes, Confirm!') }}</el-button>
                <el-button @click="bulkEditVisible = false" type="info" class="el-button--soft">{{ $t('Cancel') }}</el-button>
            </div>
        </el-dialog>
    </el-form-item>
</template>

<script type="text/babel">
    import elLabel from '../../includes/el-label.vue';
    import each from 'lodash/each';
    import PhotoWidget from '@/common/PhotoUploader';
    import ActionBtn from '@/admin/components/ActionBtn/ActionBtn.vue';
    import ActionBtnAdd from '@/admin/components/ActionBtn/ActionBtnAdd.vue';
    import ActionBtnRemove from '@/admin/components/ActionBtn/ActionBtnRemove.vue';

    export default {
        name: 'advanced-options',
        props: {
            editItem: {
                type: Object
            },
            listItem: {
                type: Object
            },
            hasCalValue: {
                default() {
                    return true;
                }
            }
        },
        components: {
            elLabel,
            PhotoWidget,
            ActionBtn,
            ActionBtnAdd,
            ActionBtnRemove
        },
        data() {
            return {
                optionsToRender: [],
                bulkEditVisible: false,
                value_key_pair_text: '',
                has_pro: !!window.FluentFormApp.hasPro,
                pro_mock: false,
                editor_options: JSON.parse(window.FluentFormApp.bulk_options_json),
                activeClass: null,
            }
        },
        computed: {
            optionsType() {
                let determiner = this.editItem.attributes.type || (this.editItem.attributes.multiple && 'multiselect') || this.editItem.element;

                switch (determiner) {
                    case 'multiselect':
                    case 'checkbox':
                        return 'checkbox'
                    case 'select':
                    case 'radio':
                        return 'radio'
                    default:
                        return 'radio'
                }
            },
            hasImageSupport() {
                return this.editItem.element != 'select';
            },
            valuesVisible:{
                get() {
                    return this.editItem.settings.values_visible || false;
                },
                set(val) {
                    this.$set(this.editItem.settings, 'values_visible', val);
                }
            },
            supportsGrouping() {
                return this.editItem.element === 'select';
            },
            groupingEnabled: {
                get() {
                    return this.editItem.settings.enable_option_groups === 'yes';
                },
                set(value) {
                    this.$set(this.editItem.settings, 'enable_option_groups', value ? 'yes' : 'no');
                }
            },
            groupedOptions() {
                return this.editItem.settings.advanced_options || [];
            },
            isToggleField() {
                return this.editItem && this.editItem.element === 'input_toggle';
            },
            isRankingField() {
                return this.editItem && this.editItem.element === 'input_ranking';
            },
            hasCalcValueSupport() {
                return this.hasCalValue && !this.isRankingField;
            }
        },
        methods: {
            handleDrop(data) {
                const { index, list, item } = data;
                item.id = new Date().getTime();
                list.splice(index, 0, item);
            },
            handleMoved(item) {
                const { index, list } = item;
                list.splice(index, 1);
            },
            updateValue(currentOption, value) {
                if (!this.valuesVisible) {
                    currentOption.value = value;
                }
            },
            initBulkEdit() {
                let astext = '';
                each(this.editItem.settings.advanced_options, item => {
                    let label = item.label;
                    let value = item.value;

                    if (label.includes(':')) {
                        label = label.replace(/:/g, '\\:');
                    }
                    if (value.includes(':')) {
                        value = value.replace(/:/g, '\\:');
                    }

                    astext += label;
                    if (item.label && item.label != item.value) {
                        astext += ' : ' + value;
                    }
                    astext += String.fromCharCode(13, 10);
                });
                this.value_key_pair_text = astext;
                this.bulkEditVisible = true
            },
            confirmBulkEdit() {
                let lines = this.value_key_pair_text.split('\n');
                let values = [];
                each(lines, line => {
                    let lineItem = line.split(/(?<!\\):/);

                    let label = lineItem[0];
                    if (label) {
                        label = label.replace(/\\:/g, ':').trim();
                    }
                    let value = lineItem[1];
                    if (value) {
                        value = value.replace(/\\:/g, ':').trim();
                    } else {
                        value = label;
                    }
                    if (label && value) {
                        values.push({
                            label: label,
                            value: value,
                            calc_value: '',
                            image: ''
                        });
                    }
                });

                this.editItem.settings.advanced_options = values;
                this.bulkEditVisible = false
            },
            isChecked(optVal) {
                if (Array.isArray(this.editItem.attributes.value)) {
                    return this.editItem.attributes.value.includes(optVal);
                }

                return this.editItem.attributes.value == optVal;
            },
            increase(index) {
                let options = this.editItem.settings.advanced_options;
                options.splice(index + 1, 0, this.createOption());
            },
            decrease(index) {
                let options = this.editItem.settings.advanced_options;
                const minOptions = this.isRankingField ? 2 : 1;
                if (options.length > minOptions) {
                    options.splice(index, 1);
                } else {
                    this.$notify.error({
                        message: this.isRankingField
                            ? 'You have to have at least two options.'
                            : 'You have to have at least one option.',
                        offset: 30
                    });
                }
            },
            setOptions(options) {
                this.value_key_pair_text = options.join('\n');
                this.activeClass = options;
            },
            clear() {
                let attributes = this.editItem.attributes;

                if (attributes.type == 'checkbox' || attributes.multiple) {
                    attributes.value = [];
                } else {
                    attributes.value = '';
                }

                let defaultOptions = this.$refs.defaultOptions || [];
                if (!Array.isArray(defaultOptions)) {
                    defaultOptions = [defaultOptions];
                }
                defaultOptions.forEach(el => {
                    if (el) {
                        el.checked = false;
                    }
                });
            },
            updateDefaultOption(option, event) {
                let attributes = this.editItem.attributes;
                if (attributes.type == 'checkbox' || attributes.multiple) {
                    if (!Array.isArray(attributes.value)) {
                        this.$set(attributes, 'value', []);
                    }

                    if (event.target.checked && !attributes.value.includes(option.value)) {
                        attributes.value.push(option.value);
                    } else if (!event.target.checked) {
                        attributes.value.splice(attributes.value.indexOf(option.value), 1);
                    }
                } else {
                    attributes.value = event.target.checked ? option.value : '';
                }
            },
            createOptionsToRender() {
                this.optionsToRender = this.editItem.settings.advanced_options;
            },
            showProMessage() {
                this.$notify.error('Images with options is available in the Pro version');
                this.pro_mock = false;
            },
            createOption(optionNumber = null) {
                if (!optionNumber) {
                    optionNumber = this.flattenAdvancedOptions(this.editItem.settings.advanced_options || []).length + 1;
                }

                const optionLabel = `Option ${optionNumber}`;

                return {
                    label: optionLabel,
                    value: optionLabel,
                    calc_value: '',
                    image: ''
                };
            },
            createDefaultGroupOptions() {
                const nextOptionNumber = this.flattenAdvancedOptions(this.editItem.settings.advanced_options || []).length + 1;

                return [
                    this.createOption(nextOptionNumber),
                    this.createOption(nextOptionNumber + 1)
                ];
            },
            createGroup(options = [], groupNumber = null) {
                if (!groupNumber) {
                    groupNumber = (this.editItem.settings.advanced_options || []).length + 1;
                }

                return {
                    type: 'group',
                    label: `Group ${groupNumber}`,
                    is_open: true,
                    options: options.length ? options : this.createDefaultGroupOptions()
                };
            },
            createInitialGroupedOptions(options = []) {
                let normalizedOptions = this.flattenAdvancedOptions(options || []).filter(Boolean);

                while (normalizedOptions.length < 4) {
                    normalizedOptions.push(this.createOption(normalizedOptions.length + 1));
                }

                const groups = [];
                for (let i = 0; i < normalizedOptions.length; i += 2) {
                    groups.push(this.createGroup(normalizedOptions.slice(i, i + 2), groups.length + 1));
                }

                return groups;
            },
            flattenAdvancedOptions(options) {
                let flattened = [];

                each(options, option => {
                    if (option && option.type === 'group' && Array.isArray(option.options)) {
                        flattened = flattened.concat(this.flattenAdvancedOptions(option.options));
                        return;
                    }

                    flattened.push(option);
                });

                return flattened;
            },
            hasGroupedOptions(options) {
                return (options || []).some(option => option && option.type === 'group' && Array.isArray(option.options));
            },
            handleGroupingModeChange(value) {
                this.$set(this.editItem.settings, 'enable_option_groups', value ? 'yes' : 'no');

                if (value) {
                    if (!this.hasGroupedOptions(this.editItem.settings.advanced_options)) {
                        const flattened = this.flattenAdvancedOptions(this.editItem.settings.advanced_options || []);
                        this.$set(
                            this.editItem.settings,
                            'advanced_options',
                            this.createInitialGroupedOptions(flattened)
                        );
                    }
                } else {
                    this.$set(
                        this.editItem.settings,
                        'advanced_options',
                        this.flattenAdvancedOptions(this.editItem.settings.advanced_options || [])
                    );
                }

                this.createOptionsToRender();
            },
            addGroup(index = null) {
                const groups = this.editItem.settings.advanced_options || [];
                const newGroup = this.createGroup();

                if (index === null || index === undefined) {
                    groups.push(newGroup);
                } else {
                    groups.splice(index + 1, 0, newGroup);
                }
            },
            removeGroup(groupIndex) {
                const groups = this.editItem.settings.advanced_options || [];

                if (groups.length > 1) {
                    groups.splice(groupIndex, 1);
                    return;
                }

                this.$notify.error({
                    message: 'You have to have at least one group.',
                    offset: 30
                });
            },
            addOptionToGroup(groupIndex, optionIndex = null) {
                const group = this.editItem.settings.advanced_options[groupIndex];
                if (!group || !Array.isArray(group.options)) {
                    return;
                }

                const newOption = this.createOption();
                if (optionIndex === null || optionIndex === undefined) {
                    group.options.push(newOption);
                } else {
                    group.options.splice(optionIndex + 1, 0, newOption);
                }
            },
            removeGroupOption(groupIndex, optionIndex) {
                const group = this.editItem.settings.advanced_options[groupIndex];
                if (!group || !Array.isArray(group.options)) {
                    return;
                }

                if (group.options.length > 1) {
                    group.options.splice(optionIndex, 1);
                    return;
                }

                this.$notify.error({
                    message: 'You have to have at least one option in a group.',
                    offset: 30
                });
            },
            toggleGroup(group) {
                this.$set(group, 'is_open', group.is_open === false);
            },
            normalizeGroupingState() {
                if (!this.supportsGrouping) {
                    return;
                }

                if (this.hasGroupedOptions(this.editItem.settings.advanced_options || [])) {
                    this.$set(this.editItem.settings, 'enable_option_groups', 'yes');
                return;
            }

            if (!this.editItem.settings.enable_option_groups) {
                this.$set(this.editItem.settings, 'enable_option_groups', 'no');
            }
            each(this.editItem.settings.advanced_options || [], group => {
                if (group && group.type === 'group' && typeof group.is_open === 'undefined') {
                    this.$set(group, 'is_open', true);
                }
            });
        }
    },
        mounted() {
            this.normalizeGroupingState();
            this.createOptionsToRender();
            (this.editItem.settings.advanced_options || []).forEach((item, i) => {
                if (!item.id) {
                    item.id = i;
                }
            });
        }
    }
</script>

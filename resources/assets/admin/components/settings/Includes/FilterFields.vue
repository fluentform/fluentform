<template>
    <div class="ff-filter-fields-wrap">
        <el-checkbox v-model="conditionals.status" v-if="hasPro">
            {{ $t(labels.status_label) }}
        </el-checkbox>

        <div v-if="conditionals.status" class="mt-3">
            <div class="mb-3">
                {{ $t(labels.notification_if_start) }}
	            <el-select
		            style="width: 90px;"
		            :placeholder="$t('Select')"
		            popper-class="ff-mw-100"
		            v-model="conditionals.type"
	            >
		            <el-option
			            v-for="(field, key) in {all: 'All', any: 'Any', group: 'Group'}" :key="key"
			            :label="field" :value="key"
		            ></el-option>
	            </el-select>
                {{ $t(labels.notification_if_end) }}
            </div>


	        <div v-if="conditionals.type === 'group'" class="ff_conditions_warp">
		        <div v-for="(group, groupIndex) in items" :key="groupIndex" class="group-container" :class="{'is-empty': isGroupEmpty(group)}">
			        <el-row class="group-header items-center" >
				        <el-col :md="11" class="mb-1">
					        <div class="title-section">
						        <template v-if="group.isEditingTitle">
							        <el-input
								        v-model="group.title"
								        class="title-input"
								        @blur="finishTitleEdit(group)"
								        @keyup.enter.native="finishTitleEdit(group)"
							        />
						        </template>
						        <template v-else>
							        <div class="group-title" @click="startTitleEdit(group)">
								        <span v-if="group.title">{{ group.title }}</span>
								        <span v-else>{{ `${$t('Group')} ${groupIndex + 1}` }}</span>
								        <i class="el-icon-edit-outline" style="font-size: 12px; margin-left: 5px;"></i>
							        </div>
						        </template>
					        </div>
				        </el-col>
				        <el-col :md="8" class="mb-1">
					        <div class="group-relationship">
						        <b> {{ groupIndex === 0 ? $t('IF') : $t('OR IF') }} </b>
					        </div>
				        </el-col>
				        <el-col :md="4" class="mt-1">
					        <div class="actions">
						        <el-button v-if="items.length > 1" @click="removeGroup(groupIndex)" icon="el-icon-delete" type="danger" plain>
						        </el-button>
						        <el-button v-if="items.length > 1" @click="toggleGroup(group)" plain>
							        <i :class="[
	                                    { 'el-icon-arrow-up': group.isGroupOpen },
	                                    { 'el-icon-arrow-down': !group.isGroupOpen }
	                                ]"></i>
						        </el-button>
				            </div>
				        </el-col>
			        </el-row>

			        <el-row v-for="(logic, ruleIndex) in group.rules" :key="`${groupIndex}-${ruleIndex}`" :gutter="5" class="items-center conditional-logic" v-show="group.isGroupOpen">
				        <el-col :md="8" class="mb-2">
					        <div>
						        <el-select
							        :placeholder="$t('Select')"
							        popper-class="ff-mw-100"
							        v-model="logic.field"
							        style="width: 100%" @change="logic.value = ''">
							        <el-option
								        v-for="(field, key) in fields" :key="key"
								        :label="field.admin_label" :value="key"
							        ></el-option>
						        </el-select>
					        </div>
				        </el-col>


				        <el-col :md="5" class="mb-2">
					        <div>
						        <el-select :placeholder="$t('Select')"  v-model="logic.operator">
							        <el-option-group :label="$t('General Operators')">
								        <el-option value="=" :label="$t('equal')"></el-option>
								        <el-option value="!=" :label="$t('not equal')"></el-option>
								        <template v-if="fields[logic.field] && !Object.keys(fields[logic.field].options || {}).length">
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
					        </div>
				        </el-col>

				        <el-col :md="8" class="mb-2">
					        <div >
						        <template v-if="logic.operator == 'length_equal' || logic.operator == 'length_less_than' || logic.operator == 'length_greater_than'">
							        <el-input  type="number" step="1" :placeholder="('Enter length in number')" v-model="logic.value" />
						        </template>
						        <template v-else>
							        <el-select
								        v-if="fields[logic.field] && Object.keys(fields[logic.field].options || {}).length"
							                   v-model="logic.value"
								        clearable filterable allow-create
								        style="width: 100%">
								        <el-option
									        v-for="(label, value) in fields[logic.field].options"
									        :key="value"
								                   :label="label" :value="value"

								        ></el-option>
							        </el-select>
							        <el-input
								        v-else
								        :placeholder="$t('Enter a value')"
								        v-model="logic.value"
							        ></el-input>
						        </template>
					        </div>
				        </el-col>

				        <el-col :md="2" class="mb-2">
					        <action-btn>
						        <action-btn-add @click="addCondition(groupIndex, ruleIndex)" />
						        <action-btn-remove v-if="group.rules.length > 1" @click="removeCondition(groupIndex, ruleIndex)" />
					        </action-btn>
				        </el-col>
			        </el-row>

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
					        <div class="group-preview" v-if="getGroupPreview(group)">
						        <div class="preview-conditions" v-html="getGroupPreview(group)"></div>
					        </div>
				        </div>
			        </div>
		        </div>

		        <div class="add-group-btn">
			        <el-button
				        @click="addGroup"
				        type="primary"
				        plain
			        >
				        {{ $t('+ Add New Group') }}
			        </el-button>
		        </div>
	        </div>

            <el-row v-else class="items-center" v-for="(logic, key) in items" :key="key" :gutter="12">
                <el-col :md="8">
                    <div class="mb-2">
                        <el-select popper-class="ff-mw-100" v-model="items[key].field" style="width: 100%" @change="items[key].value = ''">
                            <el-option
                                v-for="(field, key) in fields" :key="key"
                                :label="field.admin_label" :value="key"
                            ></el-option>
                        </el-select>
                    </div>
                </el-col>

                <el-col :md="5">
                    <div class="mb-2">
                        <el-select v-model="items[key].operator">
                            <el-option-group :label="$t('General Operators')">
                                <el-option value="=" :label="$t('equal')"></el-option>
                                <el-option value="!=" :label="$t('not equal')"></el-option>
                                <template v-if="fields[logic.field] && !Object.keys(fields[logic.field].options || {}).length">
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
                    </div>
                </el-col>

                <el-col :md="8">
                    <div class="mb-2">
                        <template v-if="items[key].operator == 'length_equal' || items[key].operator == 'length_less_than' || items[key].operator == 'length_greater_than'">
                            <el-input type="number" step="1" :placeholder="('Enter length in number')" v-model="items[key].value" />
                        </template>
                        <template v-else>
                            <el-select v-if="fields[logic.field] && Object.keys(fields[logic.field].options || {}).length"
                                    v-model="items[key].value" clearable filterable allow-create style="width: 100%">
                                <el-option v-for="(label, value) in fields[logic.field].options" :key="value"
                                        :label="label" :value="value"
                                ></el-option>
                            </el-select>
                            <el-input v-else :placeholder="$t('Enter a value')" v-model="items[key].value"></el-input>
                        </template>
                    </div>
                </el-col>

                <el-col :md="3">
                    <action-btn class="mb-2">
                        <action-btn-add @click="add(key)"></action-btn-add>
                        <action-btn-remove @click="remove(key)" v-if="items.length > 1"></action-btn-remove>
                    </action-btn>
                </el-col>
            </el-row>
        </div>

    </div>
</template>

<script>
    import ActionBtn from '@/admin/components/ActionBtn/ActionBtn.vue';
    import ActionBtnAdd from '@/admin/components/ActionBtn/ActionBtnAdd.vue';
    import ActionBtnRemove from '@/admin/components/ActionBtn/ActionBtnRemove.vue';

    export default {
        name: 'FilterFields',
        components: {
            ActionBtn,
            ActionBtnAdd,
            ActionBtnRemove
        },
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
            hasPro: {
                type: Boolean,
                required: true
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
                }
            }
        },
	    watch: {
		    'conditionals.type'(newType) {
			    if (newType === 'group' && (!this.conditionals.condition_groups || !this.conditionals.condition_groups.length)) {
				    this.addGroup();
			    }
		    }
	    },
        computed: {
	        items() {
		        return this.conditionals.type === 'group'
			        ? (this.conditionals.condition_groups || [])
			        : (this.conditionals.conditions || []);
	        }
        },
	    methods: {
		    add(index) {
			    if (this.conditionals.type === 'group') {
				    this.addCondition(0, index);
			    } else {
				    this.items.splice(index + 1, 0, {...this.defaultRules});
			    }
		    },
		    remove(index) {
			    if (this.conditionals.type === 'group') {
				    this.removeCondition(0, index);
			    } else {
				    this.items.splice(index, 1);
			    }
		    },
		    addGroup() {
			    if (!this.conditionals.condition_groups) {
				    this.$set(this.conditionals, 'condition_groups', []);
			    }
			    this.conditionals.condition_groups.push({
				    title: '',
				    isEditingTitle: false,
				    isGroupOpen: true,
				    isPreviewOpen: false,
				    rules: [{...this.defaultRules}]
			    });
		    },
		    removeGroup(groupIndex) {
			    this.conditionals.condition_groups.splice(groupIndex, 1);
		    },
		    addCondition(groupIndex, index) {
			    this.conditionals.condition_groups[groupIndex].rules.splice(index + 1, 0, {...this.defaultRules});
		    },
		    removeCondition(groupIndex, index) {
			    this.conditionals.condition_groups[groupIndex].rules.splice(index, 1);
		    },
		    toggleGroup(group) {
			    group.isGroupOpen = !group.isGroupOpen;
		    },
		    togglePreview(group) {
			    group.isPreviewOpen = !group.isPreviewOpen;
		    },
		    startTitleEdit(group) {
			    group.isEditingTitle = true;
		    },
		    finishTitleEdit(group) {
			    group.isEditingTitle = false;
		    },
		    isGroupEmpty(group) {
			    return group.rules.length === 0;
		    },
		    getGroupPreview(group) {
			    const conditions = group.rules.map(rule => {
				    if (!rule.field || !rule.operator) return '';

				    const fieldLabel = this.fields[rule.field]?.admin_label || rule.field;
				    const value = this.fields[rule.field]?.options[rule.value] || rule.value;
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
				    'length_equal': this.$t('Equal to Data Length'),
				    'length_less_than': this.$t('Less than to Data length'),
				    'length_greater_than': this.$t('Greater than to Data length'),
				    'test_regex': this.$t('Regex Match')
			    };
			    return operators[operator] || operator;
		    },
	    },
	    mounted() {
		    if (this.conditionals.type === 'group') {
			    if (!this.conditionals.condition_groups || !this.conditionals.condition_groups.length) {
				    this.addGroup();
			    }
		    } else {
			    if (!this.conditionals.conditions || !this.conditionals.conditions.length) {
				    this.$set(this.conditionals, 'conditions', [{...this.defaultRules}]);
			    }
		    }
	    }
    };
</script>

<template>
	<div>
		<el-label
			v-if="listItem.label"
			:label="listItem.label"
			:helpText="listItem.help_text"
			class="el-form-item__label"
		></el-label>
		<div class="ff-dynamic-warp">
			<!-- Type -->
			<el-form-item>
				<elLabel
					slot="label"
					:label="$t('Type')"
					:help-text="$t('Choose the type to populate dynamically')"
				></elLabel>
				<el-select class="el-fluid" v-model="model.type">
					<el-option
						v-for="(label, key) in listItem.types"
						:key="key"
						:label="label"
						:value="key"
					></el-option>
				</el-select>
			</el-form-item>

			<el-tabs v-model="model.query_type" v-if="hasBasicQuery">
				<el-tab-pane :label="$t('Basic')" name="basic">
					<!-- Basic Filters -->
					<dynamic-basic-filter
						:filter_value_options="filter_value_options"
						:config="model"
						v-model="model.basic_query"
					/>
				</el-tab-pane>
				<el-tab-pane :label="$t('Advance')" name="advance">
					<!--Advance Filters -->
					<dynamic-advance-filter
						v-model="model.filters"
						:list-item="listItem"
						:filter-columns="filterColumns"
						:filter_value_options="filter_value_options"
						@update-filter-value-options="updateFilterValueOptions"
					/>
				</el-tab-pane>
			</el-tabs>

			<!--Advance Filters -->
			<dynamic-advance-filter
				v-else
				v-model="model.filters"
				:list-item="listItem"
				:filter-columns="filterColumns"
				:filter_value_options="filter_value_options"
				@update-filter-value-options="updateFilterValueOptions"
			/>

			<!-- Unique Result -->
			<el-form-item>
				<input-yes-no-checkbox
					v-model="model.unique_result"
					:listItem="{
						label: $t('Only Show Unique Result'),
						help_text : $t(`Toggle to display only unique results based on the `) + listItem.types[model.type]}"
				></input-yes-no-checkbox>
			</el-form-item>



			<!-- Result Limits -->
			<el-form-item>
				<elLabel
					slot="label"
					:label="$t('Result Limits')"
					:help-text="$t('Specify the result limits')"
				></elLabel>
				<el-row :gutter="20">
					<el-col :span="24">
						<el-input type="number" v-model="model.result_limit"></el-input>
					</el-col>
				</el-row>
			</el-form-item>

			<!-- Filter Result -->
			<el-form-item>
				<el-row :gutter="20" type="flex" align="middle">
					<el-col :span="8">
						<el-button @click="getResult" type="primary" size="mini"
						           :icon="result_loading ? 'el-icon-loading' : 'el-icon-refresh'">{{ $t('Get Result') }}
						</el-button>
					</el-col>
					<el-col :span="16">
						<p>
							<span>
								<el-link
									@click="validOptionsDialog=true"
									type="primary"
								>{{ result_counts.valid || 0 }}
								</el-link>
							    {{ $t(`valid ${ isTextType ? 'values' : 'option' } of `) }}
							</span>
							<span>
								<el-link
									@click="allOptionsDialog = true"
									type="primary"
								>{{ result_counts.total || 0 }}
								</el-link>
								{{ $t('results') }}
							</span>
						</p>
					</el-col>
				</el-row>
			</el-form-item>

			<!-- Valid Result Modal-->
			<dynamic-filter-options-dialog
				v-model="editItem.attributes.value"
				@close-modal="validOptionsDialog=false"
				:text-value-disable="'yes' === model.dynamic_fetch"
				:visible="validOptionsDialog"
				:options="valid_options"
				:type="editItem.settings.field_type"
			></dynamic-filter-options-dialog>

			<!-- Result Modal-->
			<dynamic-filter-options-dialog
				@close-modal="allOptionsDialog=false"
				:visible="allOptionsDialog"
				:dynamic="true"
				:options="all_options"
				type="result"
			></dynamic-filter-options-dialog>


			<!-- Template Mapping -->
			<el-form-item v-if="hasTemplateColumnsOptions">
				<elLabel
					slot="label"
					:label="$t('Template Mapping')"
					:help-text="$t('Define the mapping template for generate options. Use placeholders to dynamically insert values from the database records.')"
				>
				</elLabel>

				<!-- Template Label Mapping -->
				<el-row v-if="!isTextType" :gutter="20" type="flex" align="middle" class="mb-2">
					<el-col :span="4">{{ $t('Label') }}</el-col>
					<el-col :span="16">
						<inputPopover
							v-if="isCustomTemplateLabel"
							fieldType="text"
							v-model="model.template_label.value"
							:data="templateOptionsAsShortCode"
							attr-name=""
						></inputPopover>
						<el-select v-else v-model="model.template_label.value" class="el-fluid">
							<el-option
								v-for="(label, value) in templateColumnsOptions"
								:key="'key_' + value"
								:label="label"
								:value="value"
							></el-option>
						</el-select>
					</el-col>
					<el-col :span="4">
						<el-button
							:type="isCustomTemplateLabel ? 'primary' : ''"
							@click="model.template_label.custom = !isCustomTemplateLabel"
							icon="el-icon-edit"
						></el-button>
					</el-col>
				</el-row>

				<!-- Template Value Mapping -->
				<el-row :gutter="20" type="flex" align="middle">
					<el-col :span="4">{{ $t('Value') }}</el-col>
					<el-col :span="16">
						<inputPopover
							v-if="isCustomTemplateValue"
							fieldType="text"
							v-model="model.template_value.value"
							:data="templateOptionsAsShortCode"
							attr-name=""
						></inputPopover>
						<el-select v-else v-model="model.template_value.value" class="el-fluid">
							<el-option
								v-for="(label, value) in templateColumnsOptions"
								:key="'key_' + value"
								:label="label"
								:value="value"
							></el-option>
						</el-select>
					</el-col>
					<el-col :span="4">
						<el-button
							:type="isCustomTemplateValue ? 'primary' : ''"
							@click="model.template_value.custom = !isCustomTemplateValue"
							icon="el-icon-edit"
						></el-button>
					</el-col>
				</el-row>
			</el-form-item>

            <!-- Ordering -->
            <el-form-item>
                <elLabel
                        slot="label"
                        :label="$t('Ordering')"
                        :help-text="$t('Specify the ordering of the dynamically populate')"
                ></elLabel>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-select v-model="model.sort_by" clearable filterable>
                            <el-option
                                    v-for="(label, value) in filterColumns"
                                    :key="'key_' + value"
                                    :label="label"
                                    :value="value"
                            ></el-option>
                        </el-select>
                    </el-col>
                    <el-col :span="12">
                        <el-select v-model="model.order_by">
                            <el-option
                                    v-for="(label, value) in listItem.order"
                                    :key="'key_' + value"
                                    :label="label"
                                    :value="value"
                            ></el-option>
                        </el-select>
                    </el-col>
                </el-row>
            </el-form-item>
		</div>
	</div>
</template>

<script>
import elLabel from '../../includes/el-label.vue'
import inputYesNoCheckbox from './inputYesNoCheckbox.vue';
import dynamicFilterGroup from './helpers/DynamicFilterGroup.vue'
import inputPopover from '../../input-popover.vue';
import debounce from 'lodash/debounce';
import DynamicFilterOptionsDialog from './helpers/DynamicFilterOptionsDialog.vue';
import DynamicBasicFilter from './helpers/DynamicBasicFilter.vue';
import DynamicAdvanceFilter from './helpers/DynamicAdvanceFilter.vue';

export default {
	name: 'dynamicValue',
	props: ['editItem', 'listItem', 'value'],
	components: {
		DynamicFilterOptionsDialog,
		elLabel,
		inputYesNoCheckbox,
		dynamicFilterGroup,
		DynamicBasicFilter,
		DynamicAdvanceFilter,
		inputPopover
	},
	data() {
		return {
			model: this.value,
			result_loading: false,
			filter_value_options: {},
			valid_options: [],
			all_options: [],
			result_counts: {
				total: 0,
				valid: 0,
			},
			validOptionsDialog: false,
			allOptionsDialog: false,
		}
	},
	watch: {
		'editItem.settings.field_type'() {
			this.maybeResetTextValue();
		},
		'model.type'() {
			this.getFilterValueOptions();
		},
		'model.query_type'(type) {
			this.resetTemplateMapping(type);
		},
		'model.basic_query.form_field'() {
			this.resetTemplateMapping();
		},
		model: {
			handler() {
				this.$emit('input', this.model);
				this.getDebounceResult()
			},
			deep: true,
		},
		valid_options() {
			this.maybeResetTextValue()
		}
	},
	methods: {
		resetTemplateMapping(type = 'basic') {
			if ('fluentform_submission' === this.model.type) {
				if ('basic' === type && this.model.basic_query?.form_id && this.model.basic_query?.form_field) {
					this.model.template_value.value = '{inputs.field_name}';
					this.model.template_label.custom = false;
					this.model.template_label.value = '{inputs.field_name}';
				} else {
					this.model.template_value.value = '{id}';
					this.model.template_label.custom = true;
					this.model.template_label.value = 'Submission ({id})';
				}
			}
		},
		maybeResetTextValue(){
			// Set first valid value for dynamically fetched
			if (this.isTextType && 'yes' === this.model.dynamic_fetch) {
				this.editItem.attributes.value = this.valid_options[0]?.value || '';
			}
		},

		updateFilterValueOptions(key, options){
			this.filter_value_options = {...this.filter_value_options, [key] : options};
		},

		getFilterValueOptions(onMounted = false) {
			FluentFormsGlobal.$get({
					action: 'fluentform-get-dynamic-filter-value-options',
					type: this.model.type
				})
				.done(res => {
					this.filter_value_options = {...this.filter_value_options, ...res.data.options };
					if (!onMounted) {
						this.model.filters = res.data.default_config.filters || [];
						this.model.sort_by = res.data.default_config.sort_by || '';
						this.model.order_by = res.data.default_config.order_by || '';
						this.model.query_type = res.data.default_config.query_type || '';
						if (res.data.default_config.query_type === 'basic') {
							this.model.basic_query = res.data.default_config.basic_query || {};
						}
						if (res.data.default_config.basic_query?.role_name) {
							this.model.basic_query.role_name = res.data.default_config.basic_query.role_name;
						}
						this.model.result_limit = res.data.default_config.result_limit || 500;
						this.model.template_value = res.data.default_config.template_value || '';
						this.model.template_label = res.data.default_config.template_label || '';
					}
				})
				.fail(error => {
					console.log(error?.responseJSON)
				})
				.always(() => {
				});
		},

		getResult() {
			this.result_loading = true;
			FluentFormsGlobal.$get({
					action: 'fluentform-get-dynamic-filter-result',
					config: this.model
				})
				.done(res => {
					this.result_counts = res.data.result_counts || {};
					this.valid_options = res.data.valid_options || [];
					this.editItem.settings.advanced_options = res.data.valid_options || [];
					this.all_options = res.data.all_options || [];
				})
				.fail(error => {
					console.log(error?.responseJSON)
				})
				.always(() => {
					this.result_loading = false;
				});
		},

		getDebounceResult: debounce(function () {
			this.getResult();
		}, 3 * 1000),
	},
	computed: {
		filterColumns() {
			return this.listItem.columns[this.model.type] || [];
		},
		hasTemplateColumnsOptions() {
			return Object.keys(this.templateColumnsOptions).length;
		},
		isCustomTemplateLabel() {
			return this.model.template_label.custom;
		},
		isCustomTemplateValue() {
			return this.model.template_value.custom;
		},
		templateOptionsAsShortCode() {
			let shortcodes = {
				shortcodes: this.templateColumnsOptions,
				title: ''
			};
			return [shortcodes];
		},
		templateColumnsOptions() {
			let options = {};
			if (this.all_options && this.all_options[0]) {
				for (let prop in this.all_options[0]) {
					if ('field_name' === prop) {
						prop = 'inputs.' + prop;
					}
					options[`{${ prop }}`] = _ff.startCase(prop)
				}
			}
			return options;
		},
		isTextType() {
			return 'text' === this.editItem.settings.field_type;
		},
		hasBasicQuery() {
			return ['fluentform_submission', 'user'].includes(this.model.type);
		}
	},
	mounted() {
		this.getFilterValueOptions(true);
		this.resetTemplateMapping();
		this.getResult();
	}
}
</script>
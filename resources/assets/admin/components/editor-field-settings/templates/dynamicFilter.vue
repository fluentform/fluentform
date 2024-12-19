<template>
	<div>
		<el-label
			v-if="listItem.label"
			:label="listItem.label"
			:helpText="listItem.help_text"
			class="el-form-item__label"
		></el-label>
		<div class="ff-dynamic-warp">
			<!-- Source -->
			<el-form-item>
				<elLabel
					slot="label"
					:label="$t('Source')"
					:help-text="$t('Choose the source to populate dynamically')"
				></elLabel>
				<el-select filterable class="el-fluid" v-model="model.source">
					<el-option
						v-for="(label, key) in listItem.sources"
						:key="key"
						:label="label"
						:value="key"
					></el-option>
				</el-select>
			</el-form-item>

			<template v-if="isDynamicCsv">
				<el-form-item>
					<elLabel
						slot="label"
						:label="$t('Url')"
						:help-text="$t('The google sheet CSV URL')"
					></elLabel>
					<el-row :gutter="20">
						<el-col :span="24">
							<el-input type="text" v-model="model.csv_url"></el-input>
						</el-col>
					</el-row>
				</el-form-item>
				<!--Csv Delimiter-->
				<el-form-item>
					<elLabel
						slot="label"
						:label="$t('CSV Delimiter')"
						:help-text="$t('Select your CSV file delimiter')"
					></elLabel>
					<el-select class="w-100" v-model="model.csv_delimiter">
						<el-option
							v-for="(delimiter, key) in {
                                comma: 'Comma Separated (,)',
                                semicolon: 'Semicolon Separated (;)',
                                auto_guess: 'Auto Guess'
                            }"
							:key="key"
							:label="$t(delimiter)"
                            :value="key"
						></el-option>
					</el-select>
				</el-form-item>
			</template>
			<template v-else>
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
			</template>

			<!-- Unique Result -->
			<el-form-item>
				<input-yes-no-checkbox
					v-model="model.unique_result"
					:listItem="{
						label: $t('Only Show Unique Result'),
						help_text : $t('Toggle to display only unique results based on the %s', listItem.sources[model.source])}"
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
                            <span v-html="
                                $t(
                                    '%s valid option of %s results',
                                    `<a class='el-link el-link--primary is-underline' onclick='window.ffDynamicFilterHandleValidOptionsClick()' type='primary'>${result_counts.valid || 0}</a>`,
                                    `<a class='el-link el-link--primary is-underline' onclick='window.ffDynamicFilterHandleAllOptionsClick()' type='primary'>${result_counts.total || 0}</a>`
                                )
                            ">
                            </span>
						</p>
					</el-col>
				</el-row>
			</el-form-item>

			<!-- Valid Result Modal-->
			<dynamic-filter-options-dialog
				v-model="editItem.attributes.value"
				@close-modal="validOptionsDialog=false"
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
				<el-row :gutter="20" type="flex" align="middle" class="mb-2">
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
            <el-form-item v-if="!isDynamicCsv">
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
		'model.source'() {
			this.getFilterValueOptions();
			this.maybeSetDefaultCsvDelimiter();
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
				if (this.isValid()) {
					this.getDebounceResult()
				}
			},
			deep: true,
		}
	},
	methods: {
		isValid() {
			if (this.isDynamicCsv && !this.model.csv_url) {
				return false;
			}
			return true;
		},

		resetTemplateMapping(type = 'basic') {
			if ('fluentform_submission' === this.model.source) {
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

		updateFilterValueOptions(key, options){
			this.filter_value_options = {...this.filter_value_options, [key] : options};
		},

		getFilterValueOptions(onMounted = false) {
			FluentFormsGlobal.$get({
					action: 'fluentform-get-dynamic-filter-value-options',
					source: this.model.source
				})
				.done(res => {
					this.filter_value_options = {...this.filter_value_options, ...res.data.options };
					if (!onMounted && res.data.default_config) {
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

		maybeSetDefaultCsvDelimiter() {
			if (this.isDynamicCsv && !this.model.csv_delimiter) {
				this.$set(this.model, 'csv_delimiter', 'comma')
			}
		},

		getResult() {
			this.result_loading = true;
			FluentFormsGlobal.$get({
					action: 'fluentform-get-dynamic-filter-result',
					config: this.model
				})
				.done(res => {
					if (false === res.success) {
						this.$fail(res.data.message);
						return;
					}
					this.result_counts = res.data.result_counts || {};
					this.valid_options = res.data.valid_options || [];
					this.editItem.settings.advanced_options = res.data.valid_options || [];
					this.all_options = res.data.all_options || [];
					if (!this.model.template_value) {
						this.model.template_value = {
							value: Object.keys(this.templateColumnsOptions)[0] || '',
							custom: false
						};
					}
					if (!this.model.template_label) {
						this.model.template_label = {
							value: Object.keys(this.templateColumnsOptions)[0] || '',
							custom: false
						};
					}
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
			return this.listItem.columns[this.model.source] || [];
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
				if (this.isBasicFFSubmissionSource) {
					options[`{option_label}`] = _ff.startCase('option_label')
				}
			}
			return options;
		},
		hasBasicQuery() {
			return ['fluentform_submission', 'user'].includes(this.model.source);
		},
		isBasicFFSubmissionSource() {
			return 'fluentform_submission' === this.model.source && 'basic' === this.model.query_type;
		},
		isDynamicCsv() {
			return this.model.source === 'dynamic_csv';
		}
	},
	mounted() {
		this.getFilterValueOptions(true);
		this.getResult();
		this.maybeSetDefaultCsvDelimiter();
        window.ffDynamicFilterHandleValidOptionsClick = () => {
            this.validOptionsDialog = true;
        };
        window.ffDynamicFilterHandleAllOptionsClick = () => {
            this.allOptionsDialog = true;
        };
	},
    beforeDestroy() {
        delete window.ffDynamicFilterHandleValidOptionsClick;
        delete window.ffDynamicFilterHandleAllOptionsClick;
    },
}
</script>

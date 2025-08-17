<template>
    <div class="ff_method_settings_form">
        <el-skeleton :loading="loading" animated :rows="10">
            <el-form v-if="settings" style="min-height: 300px;" label-position="top" :model="settings">
                <div v-for="field in formatted_fields" :key="field.settings_key">
                    <el-form-item class="ff-form-item payment-methods-item" v-if="field.type !== 'html' && field.type !== 'input-color'">
                        <template slot="label">
                            {{ field.label }}
                            <el-tooltip v-if="field.info_help" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p> {{ field.info_help }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled text-primary"/>
                            </el-tooltip>
                        </template>
                        <el-checkbox v-if="field.type == 'yes-no-checkbox'" v-model="settings[field.settings_key]" true-label="yes" false-label="no">
                            {{field.checkbox_label}}
                        </el-checkbox>
                        
                        <el-radio-group v-else-if="field.type == 'input-radio'" v-model="settings[field.settings_key]">
                            <el-radio v-for="(item, itemValue) in field.options" :key="itemValue" :label="itemValue">
                                {{ item }}
                            </el-radio>
                        </el-radio-group>
                        
                        <el-input v-else-if="field.type == 'input-text'" :type="field.data_type" 
                                :placeholder="field.placeholder" 
                                v-model="settings[field.settings_key]"
                        />

                        <el-checkbox-group v-else-if="field.type == 'input-checkboxes' && settings[field.settings_key]" v-model="settings[field.settings_key]">
                            <el-checkbox v-for="(item, itemValue) in field.options" :key="itemValue" :label="itemValue">
                                {{ item }}
                            </el-checkbox>
                        </el-checkbox-group>
                        
                        <p class="text-note mt-1" v-if="field.inline_help" v-html="field.inline_help"></p>
                        
                        <error-view :field="field.settings_key" :errors="errors" />
                    </el-form-item>
                    <template v-else-if="field.type === 'input-color' && settings.checkout_type === 'modal'">
                        <el-form-item class="ff-form-item payment-methods-item">
                            <template slot="label">
                                {{ field.label }}
                                <el-tooltip v-if="field.info_help" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                    <div slot="content">
                                        <p> {{ field.info_help }}</p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled text-primary"/>
                                </el-tooltip>
                            </template>
                            <el-color-picker
                                show-alpha
                                @active-change="(color) => settings[field.settings_key] = color"
                                color-format="hex" v-model="settings[field.settings_key]"></el-color-picker>
                        </el-form-item>
                    </template>
                    <div v-else v-html="field.html">
                    </div>
                </div>
                <div class="mt-4">
                    <el-button :disabled="saving" v-loading="saving" @click="saveSettings()" type="primary" size="default" icon="el-icon-success">
                        {{ $t('Save Settings') }}
                    </el-button>
                </div>
            </el-form>

            <div class="ff_tips_warning" v-else>
                <p>
                    {{ $t('Sorry! No settings found. Maybe your payment module is disabled!') }}
                </p>
            </div>
        </el-skeleton>
    </div>
</template>

<script type="text/babel">
import ErrorView from "@/common/errorView.vue";

export default {
    name: 'PaymentSettingsBuilder',
    props: ['method_key', 'method'],
    components: {
        ErrorView,
    },
    data() {
        return {
            loading: false,
            saving: false,
            settings: {},
            formatted_fields: this.method.fields,
	        filterable_fields : [],
	        payment_mode_filterable_fields : [],
	        checkout_type_filterable_fields : [],
            errors: new Errors()
        }
    },
    watch: {
		'settings.payment_mode' : function(newValue, oldValue) {
			this.handlePaymentModeChange(newValue)
        },
        'settings.checkout_type' : function(newValue, oldValue) {
			this.handlePaymentCheckoutTypeChange(newValue)
        },
		'settings.is_active' : function(newValue, oldValue) {
			if (newValue === 'no') {
			    this.formatted_fields = this.formatted_fields.filter(field => field.settings_key === 'is_active')
            } else {
				this.formatted_fields = this.method.fields;
            }
			this.handlePaymentModeChange(this.settings.payment_mode);
			this.handlePaymentCheckoutTypeChange(this.settings.checkout_type);
        }
    },
    methods: {
        getSettings() {
            this.loading = true;
            this.errors.clear();
            FluentFormsGlobal.$get({
                action: 'fluentform_handle_payment_ajax_endpoint',
                route: 'get_payment_method_settings',
                method: this.method_key
            })
                .then(response => {
                    this.settings = response.data.settings;
                })
                .fail(error => {

                })
                .always(() => {
                    this.loading = false;
                })
        },
        saveSettings() {
            this.errors.clear();
            this.saving = true;
            FluentFormsGlobal.$post({
                action: 'fluentform_handle_payment_ajax_endpoint',
                route: 'save_payment_method_settings',
                method: this.method_key,
                settings: this.settings
            })
                .then((response) => {
                    this.$success(response.data.message);
                })
                .fail((error) => {
                    this.$fail(error.responseJSON.data.message);
                    this.errors.record(error.responseJSON.data.errors);
                })
                .always(() => {
                    this.saving = false;
                });
        },
        handlePaymentModeChange(mode) {
	        if (this.settings.is_active !== 'yes') return;
	        if (mode === 'live') {
                this.payment_mode_filterable_fields = ['test_payment_tips', 'test_application_id', 'test_access_key', 'test_location_id', 'test_api_secret', 'test_api_key'];
	        } else {
		        this.payment_mode_filterable_fields = ['live_payment_tips', 'live_application_id', 'live_access_key', 'live_location_id', 'live_api_secret', 'live_api_key'];
	        }
			this.filterable_fields = [...this.payment_mode_filterable_fields, ...this.checkout_type_filterable_fields];
            this.formatted_fields = this.method.fields.filter(field => field.settings_key ? !this.filterable_fields.includes(field.settings_key) : true);
        },
	    handlePaymentCheckoutTypeChange(type) {
	        if (this.settings.is_active !== 'yes') return;
	        if (type === 'modal') {
		        this.checkout_type_filterable_fields = ['notifications', 'notifications_tips'];
	        } else if (type === 'hosted') {
		        this.checkout_type_filterable_fields = ['theme_color'];
	        }
			this.filterable_fields = [...this.payment_mode_filterable_fields, ...this.checkout_type_filterable_fields];
		    this.formatted_fields = this.method.fields.filter(field => field.settings_key ? !this.filterable_fields.includes(field.settings_key) : true);
        },
    },
    mounted() {
        this.getSettings();
    }
}
</script>

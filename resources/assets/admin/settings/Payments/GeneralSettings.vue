<template>
    <div class="ff_payment_general_settings">
        <ul class="ff_pay_navigation">
            <li @click="current_page = 'general'" :class="{ff_active: current_page == 'general'}">
                {{ $t('General') }}
            </li>
            <li @click="current_page = 'currency'" :class="{ff_active: current_page == 'currency'}">
                {{ $t('Currency') }}
            </li>
            <li @click="current_page = 'pages'" :class="{ff_active: current_page == 'pages'}">
                {{ $t('Pages & Subscription Management') }}
            </li>
        </ul>

        <el-form rel="currency_settings" label-position="top" :model="general_settings">
            <div class="wpf_settings_section">
                <div v-if="current_page == 'general'" class="ff_pay_section">
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Status') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('If you disable this then all the payment related functions will be disabled. If you want to process/accept payment using fluent forms. You should enable this.') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>
                        <el-checkbox true-label="yes" false-label="no" v-model="general_settings.status">
                            {{ $t('Enable Payment Module') }}
                        </el-checkbox>
                    </el-form-item>
                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Business Name') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Please provide your business name. It will be used to paypal\'s business name when redirect to checkout.') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>
                        <el-input v-model="general_settings.business_name" :placeholder="$t('Business Name')"/>
                    </el-form-item>

                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Business Address') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Please provide your full business address including street, city, zip, state and country.') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>
                        <el-input v-model="general_settings.business_address" :placeholder="$t('Full Business Address')"/>
                    </el-form-item>

                    <el-form-item class="ff-form-item" :label="$t('Business Logo')">
                        <photo-uploader enable_clear="yes" design_mode="horizontal" v-model="general_settings.business_logo"/>
                    </el-form-item>

                    <el-form-item class="ff-form-item">
                        <template slot="label">
                            {{ $t('Debug Log') }}
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <div slot="content">
                                    <p>
                                        {{ $t('Enable this only for test purpose, then FluentForm will log IPN and Payment errors in the log') }}
                                    </p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>
                        <el-checkbox true-label="yes" false-label="no" v-model="general_settings.debug_log">
                            {{ $t('Enable Debug Log (Recommended for debug purpose only)') }}
                        </el-checkbox>
                    </el-form-item>
                </div>
                <div v-else-if="current_page == 'currency'" class="ff_pay_section">
                    <div class="sub_section_body">
                        <el-form-item class="ff-form-item">
                            <template slot="label">
                                {{ $t('Default Currency') }}
                                <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                    <div slot="content">
                                        <p>
                                            {{ $t('Provide your default currency. You can also change your currency to each form in form\'s payment settings') }}
                                        </p>
                                    </div>
                                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                                </el-tooltip>
                            </template>
                            <el-select 
                                class="w-100" 
                                filterable 
                                v-model="general_settings.currency"
                                :placeholder="$t('Select Currency')"
                            >
                                <el-option
                                    v-for="(currencyName, currenyKey) in currencies"
                                    :key="currenyKey"
                                    :label="currencyName"
                                    :value="currenyKey">
                                </el-option>
                            </el-select>
                        </el-form-item>
                        <el-form-item class="ff-form-item" :label="$t('Currency Sign Position')">
                            <el-radio-group v-model="general_settings.currency_sign_position">
                                <el-radio 
                                    v-for="(sign, sign_key) in currency_sign_positions" 
                                    :key="sign_key"
                                    :label="sign_key">{{sign}}
                                </el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item class="ff-form-item" :label="$t('Currency Separators')">
                            <el-select class="w-100" v-model="general_settings.currency_separator">
                                <el-option value="dot_comma" :label="$t('Comma as Thousand and Dot as Decimal (EG: 12,000.00)')"/>
                                <el-option value="comma_dot" :label="$t('Dot as Thousand and Comma as Decimal ( EG: 12.000,00 )')"/>
                            </el-select>
                        </el-form-item>
                        <el-form-item class="ff-form-item" label="">
                            <el-checkbox true-label="0" false-label="2" v-model="general_settings.decimal_points">
                                {{ $t('Hide decimal points for rounded numbers') }}
                            </el-checkbox>
                        </el-form-item>
                    </div>
                </div>

                <div v-else-if="current_page == 'pages'" class="ff_pay_section">
                    <page-settings :settings="general_settings" />
                </div>

            </div>
        </el-form>

        <div class="ff_tips_error" v-if="general_settings.status == 'no'">
            <p>
                {{ $t('Payment Module has been disabled currently. No Payments will be processed and associated functions will be disabled') }}
            </p>
        </div>

        <div class="mt-4">
            <el-button @click="saveSettings()" type="primary" size="default" icon="el-icon-success">
                {{ $t('Save Settings') }}
            </el-button>
        </div>
    </div>
</template>

<script type="text/babel">
import PhotoUploader from "./PhotoUploader.vue";
import PageSettings from './_PageSettings.vue';

export default {
    name: 'general_payment_settings',
    props: ['settings'],
    components: {
        PhotoUploader,
        PageSettings
    },
    data() {
        return {
            currencies: this.settings.currencies,
            currency_sign_positions: {
                left: 'Left ($100)',
                right: 'Right (100$)',
                left_space: 'Left Space ($ 100)',
                right_space: 'Right Space 100 $'
            },
            general_settings: this.settings.general,
            current_page: 'general'
        }
    },
    methods: {
        saveSettings() {
            FluentFormsGlobal.$post({
                action: 'fluentform_handle_payment_ajax_endpoint',
                route: 'update_global_settings',
                settings: this.general_settings
            })
                .then(response => {
                    this.$success(response.data.message);
                });
        }
    }
}
</script>

<style lang="scss">
.item_full_width {
    width: 100%;
}

</style>

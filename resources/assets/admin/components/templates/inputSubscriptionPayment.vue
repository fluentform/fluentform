<template>
    <withLabel :item="modItem">
        <template v-if="isSinglePlan">
            <template v-if="singlePlan.user_input === 'yes'">
                <el-input :placeholder="modItem.settings.label" />
            </template>
        </template>

        <template v-else>
            <template v-if="item.settings.selection_type === 'radio'">
                <el-radio-group class="el-radio-horizontal" v-model="multiPlanDefault">
                    <el-radio :key="index" :value="index" v-for="(plan, index) in item.settings.subscription_options">
                        {{ plan.name }}
                    </el-radio>
                </el-radio-group>
            </template>
            <template v-else>
                <el-select
                    v-model="multiPlanDefault"
                    class="el-fluid el-form-item"
                    :placeholder="$t('--Select Plan--')"
                >
                    <el-option
                        v-for="(plan, index) in item.settings.subscription_options"
                        :key="index"
                        :label="plan.name"
                        :value="index"
                    />
                </el-select>
            </template>

            <template v-if="multiPlanModel && multiPlanModel.user_input === 'yes'">
                <div>
                    <label>
                        {{ multiPlanModel.user_input_label }}
                    </label>
                </div>

                <el-input
                    :placeholder="multiPlanModel.user_input_label"
                    :value="multiPlanModel.user_input_default_value"
                />
            </template>
        </template>

        <p class="plan_msg" v-html="$t(planMessage())" />
    </withLabel>
</template>

<script type="text/babel">
import each from 'lodash/each';
import withLabel from './withLabel.vue';

export default {
    name: 'inputSubscriptionPayment',
    props: ['item'],
    components: {
        withLabel,
    },
    data() {
        return {
            currency: window.FluentFormApp.payment_settings.currency,
        };
    },
    computed: {
        modItem() {
            if (this.isSinglePlan && this.singlePlan.user_input === 'yes' && this.singlePlan.user_input_label) {
                let modItem = { settings: {} };

                modItem.settings.validation_rules = this.item.settings.validation_rules;
                modItem.settings.label_placement = this.item.label_placement;
                modItem.settings.label = this.singlePlan.user_input_label;

                return modItem;
            }

            return this.item;
        },

        subscriptionType() {
            return this.item.attributes.type;
        },

        isSinglePlan() {
            return this.item.attributes.type === 'single';
        },

        singlePlan() {
            return this.item.settings.subscription_options[0];
        },

        multiPlanDefault() {
            let value = null;

            each(this.item.settings.subscription_options, (option, index) => {
                if (option.is_default === 'yes') {
                    value = index;
                }
            });

            return value;
        },

        multiPlanModel() {
            if (this.multiPlanDefault !== null) {
                return this.item.settings.subscription_options[this.multiPlanDefault];
            }

            return null;
        },
    },
    methods: {
        inputType(item) {
            return item.settings;
        },
        planMessage() {
            let plan, message;

            if (this.isSinglePlan) {
                plan = this.singlePlan;
            } else {
                plan = this.multiPlanModel;
            }

            if (plan) {
                const cases = {
                    has_signup_fee:
                        '{first_interval_total} for the first {billing_interval} then {subscription_amount}/{billing_interval}',
                    has_trial: '{trial_days} days free then {subscription_amount}/{billing_interval}',
                    onetime_only: 'One time payment of {first_interval_total}',
                    normal: '{subscription_amount} for each {billing_interval}',
                    bill_times: ', for {bill_times} installments',
                };

                let hasTrial = false;
                if (plan.has_trial_days === 'yes' && plan.trial_days) {
                    plan.signup_fee = 0;
                    hasTrial = true;
                }

                let hasSignup = false;
                if (plan.has_signup_fee === 'yes' && plan.signup_fee) {
                    plan.trial_days = 0;
                    hasSignup = true;
                }

                let subscriptionAmount = plan.subscription_amount;
                if (plan.user_input === 'yes') {
                    subscriptionAmount = plan.user_input_default_value || 0;
                }

                const signupFee = this.formatMoney(plan.signup_fee);
                const firstIntervalTotal = this.formatMoney(
                    Math.round((plan.signup_fee + subscriptionAmount) * 100) / 100
                );
                subscriptionAmount = this.formatMoney(subscriptionAmount);
                const billingInterval = plan.billing_interval;
                const replaces = {
                    '{signup_fee}': signupFee,
                    '{first_interval_total}': firstIntervalTotal,
                    '{subscription_amount}': subscriptionAmount,
                    '{billing_interval}': billingInterval,
                    '{trial_days}': plan.trial_days,
                    '{bill_times}': plan.bill_times,
                };

                if (plan.user_input === 'yes') {
                    replaces['{subscription_amount}'] = subscriptionAmount;
                }

                const regexExpression = RegExp(
                    Object.keys(replaces)
                        .map(r => '(' + r + ')')
                        .join('|'),
                    'g'
                );

                function replacer(match) {
                    return replaces[match];
                }

                for (let casesKey in cases) {
                    cases[casesKey] = cases[casesKey].replace(regexExpression, replacer);
                }

                if (hasSignup) {
                    message = cases.has_signup_fee;
                } else if (hasTrial) {
                    message = cases.has_trial;
                } else if (plan.bill_times === 1) {
                    message = cases.onetime_only;
                } else {
                    message = cases.normal;
                }

                if (plan.bill_times > 1) {
                    message += cases.bill_times;
                }
            }

            return message;
        },
        formatMoney(money) {
            const cents = money * 100;

            const config = window.FluentFormApp.payment_settings;

            const $symbol = config.currency_sign;

            let $decimalSeparator = '.';
            let $thousandSeparator = ',';

            if (config.currency_separator !== 'dot_comma') {
                $decimalSeparator = ',';
                $thousandSeparator = '.';
            }
            let $decimalPoints = 2;
            if (cents % 100 === 0 && config.decimal_points === 0) {
                $decimalPoints = 0;
            }

            let amount = this.formatMoneyFunc(cents / 100, $decimalPoints, $decimalSeparator, $thousandSeparator);

            if (config.currency_sign_position === 'right') {
                amount = amount + '' + $symbol;
            } else if (config.currency_sign_position === 'left_space') {
                amount = $symbol + ' ' + amount;
            } else if (config.currency_sign_position === 'right_space') {
                amount = amount + ' ' + $symbol;
            } else {
                amount = $symbol + '' + amount;
            }

            return amount;
        },
        formatMoneyFunc(n, decimals, decimal_sep, thousands_sep) {
            var c = isNaN(decimals) ? 2 : Math.abs(decimals),
                d = decimal_sep || '.',
                t = typeof thousands_sep === 'undefined' ? ',' : thousands_sep,
                sign = n < 0 ? '-' : '',
                //extracting the absolute value of the integer part of the number and converting to string
                i = parseInt((n = Math.abs(n).toFixed(c))) + '',
                j = (j = i.length) > 3 ? j % 3 : 0;

            return (
                sign +
                (j ? i.substr(0, j) + t : '') +
                i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + t) +
                (c
                    ? d +
                      Math.abs(n - i)
                          .toFixed(c)
                          .slice(2)
                    : '')
            );
        },
    },
};
</script>

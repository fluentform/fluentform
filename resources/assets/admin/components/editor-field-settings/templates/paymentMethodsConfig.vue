<template>
    <el-form-item>
        <elLabel
                slot="label"
                :label="listItem.label"
                :helpText="listItem.help_text"
        />
        <div v-if="isEmpty(value)">
            No Active Payment Method Found. Please configure from Fluent Forms Settings
        </div>

        <div class="ff_payment_settings_wrapper">
            <div
                    class="address-field-option"
                    v-for="(paymentMethod,methodName) in value"
                    :key="methodName"
            >
                <i
                        @click="toggleAddressFieldInputs"
                        class="el-icon-caret-bottom el-icon-clickable pull-right"
                />

                <el-checkbox true-label="yes" false-label="no" v-model="paymentMethod.enabled">
                    <span v-html="paymentMethod.title"></span>
                </el-checkbox>

                <div class="address-field-option__settings">
                    <el-form labelWidth="130px" labelPosition="left" class="el-form-nested">
                        <div v-for="(field, fieldKey) in paymentMethod.settings" :key="fieldKey">
                            <inputText
                                    class="pad-b-20"
                                    v-if="field.template == 'inputText'"
                                    :listItem="field"
                                    v-model="field.value"
                            />

                            <input-yes-no-check-box
                                    class="pad-b-20"
                                    :listItem="field"
                                    v-else-if="field.template == 'inputYesNoCheckbox'"
                                    v-model="field.value"
                            />

                            <input-radio
                                    class="pad-b-20"
                                    :listItem="field"
                                    v-else-if="field.template == 'inputRadioOptions'"
                                    v-model="field.value"
                            >
                            </input-radio>

                        </div>
                    </el-form>
                </div>
            </div>
        </div>

        <p v-if="noSubscriptionSupportMessage">
            {{ noSubscriptionSupportMessage }}
        </p>
    </el-form-item>
</template>

<script type="text/babel">
    import elLabel from '../../includes/el-label.vue'
    import isEmpty from 'lodash/isEmpty';
    import inputText from './inputText.vue'
    import InputYesNoCheckBox from "./inputYesNoCheckbox";
    import InputRadio from "./inputRadio";

    export default {
        name: 'paymentMethodConfig',
        props: ['listItem', 'value'],
        components: {
            InputRadio,
            InputYesNoCheckBox,
            elLabel,
            inputText
        },
        computed: {
            noSubscriptionSupportMessage() {
                const formHasSubscriptionField = this.$attrs.form_items.find(field => field.element === 'subscription_payment_component');

                let message;

                if (formHasSubscriptionField) {
                    const gateWays = [];
                    if (this.value.mollie && this.value.mollie.enabled === 'yes') {
                        gateWays.push('Mollie');
                    }

                    if (this.value.razorpay && this.value.razorpay.enabled === 'yes') {
                        gateWays.push('RazorPay');
                    }

                    if (gateWays.length) {
                        message = "We don't have Subscription Field support for " + gateWays.join(' & ');
                    }
                }

                return message;
            }
        },
        methods: {
            isEmpty,
            toggleAddressFieldInputs(event) {
                let $el = jQuery(event.target);
                if (!$el.parent().find('.address-field-option__settings').hasClass('is-open')) {
                    $el.removeClass('el-icon-caret-bottom');
                    $el.addClass('el-icon-caret-top');
                    $el.parent().find('.address-field-option__settings').addClass('is-open');
                    $el.parent().find('.required-checkbox').addClass('is-open');
                } else {
                    $el.removeClass('el-icon-caret-top');
                    $el.addClass('el-icon-caret-bottom');
                    $el.parent().find('.address-field-option__settings').removeClass('is-open');
                    $el.parent().find('.required-checkbox').removeClass('is-open');
                }
            }
        }
    };
</script>

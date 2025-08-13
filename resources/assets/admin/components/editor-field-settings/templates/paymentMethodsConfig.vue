<template>
    <el-form-item>
        <template #label>
            <ff-label :label="listItem.label" :helpText="listItem.help_text" />
        </template>
        <div v-if="isEmpty(value)">
            {{ $t('No Active Payment Method Found.Please configure from Fluent Forms Settings') }}
        </div>

        <div class="ff_payment_settings_wrapper">
            <div class="address-field-option" v-for="(paymentMethod, methodName) in value" :key="methodName">
                <el-icon @click="toggleAddressFieldInputs" class="el-icon-clickable pull-right"><CaretBottom /></el-icon>

                <el-checkbox true-value="yes" false-value="no" v-model="paymentMethod.enabled">
                    <span v-html="paymentMethod.title"></span>
                </el-checkbox>

                <div class="address-field-option__settings">
                    <el-form labelWidth="130px" labelPosition="left" class="el-form-nested">
                        <div v-for="(field, fieldKey) in paymentMethod.settings" :key="fieldKey">
                            <template v-if="dependencyPass(field, paymentMethod.settings)">
                                <inputText
                                    class="pad-b-20"
                                    v-if="field.template === 'inputText'"
                                    :listItem="field"
                                    v-model="field.value"
                                />

                                <input-yes-no-check-box
                                    class="pad-b-20"
                                    :listItem="field"
                                    v-else-if="field.template === 'inputYesNoCheckbox'"
                                    v-model="field.value"
                                />

                                <input-radio
                                    class="pad-b-20"
                                    :listItem="field"
                                    v-else-if="field.template === 'inputRadioOptions'"
                                    v-model="field.value"
                                >
                                </input-radio>
                            </template>
                        </div>
                    </el-form>
                </div>
            </div>
        </div>

        <p style="color: red" v-if="noSubscriptionSupportMessage">
            {{ noSubscriptionSupportMessage }}
        </p>
    </el-form-item>
</template>

<script type="text/babel">
import { CaretBottom } from '@element-plus/icons-vue';
import { ElIcon } from 'element-plus';
import elLabel from '../../includes/el-label.vue';
import isEmpty from 'lodash/isEmpty';
import inputText from './inputText.vue';
import InputYesNoCheckBox from './inputYesNoCheckbox.vue';
import InputRadio from './inputRadio.vue';

export default {
    name: 'paymentMethodConfig',
    props: ['listItem', 'value'],
    components: {
        CaretBottom,
        ElIcon,
        InputRadio,
        InputYesNoCheckBox,
        'ff-label': elLabel,
        inputText,
    },
    computed: {
        noSubscriptionSupportMessage() {
            const formHasSubscriptionField = this.$attrs.form_items.find(
                field => field.element === 'subscription_payment_component'
            );

            let message;

            if (formHasSubscriptionField) {
                const gateWays = [];
                if (this.value.mollie && this.value.mollie.enabled === 'yes') {
                    gateWays.push('Mollie');
                }

                if (this.value.razorpay && this.value.razorpay.enabled === 'yes') {
                    gateWays.push('RazorPay');
                }

                if (this.value.square && this.value.square.enabled === 'yes') {
                    gateWays.push('Square');
                }

                if (gateWays.length) {
                    if (gateWays.length > 2) {
                        message = gateWays.join(', ') + '.';
                    } else {
                        message = gateWays.join(' & ');
                    }
                }
            }

            return message && "We don't have Subscription Field support for " + message;
        },
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
        },
        dependencyPass(listItem, settings) {
            if (listItem.dependency) {
                let optionPaths = listItem.dependency.depends_on.split('/');

                let dependencyVal = optionPaths.reduce((obj, prop) => {
                    return obj[prop];
                }, settings);

                if (this.compare(listItem.dependency.value, listItem.dependency.operator, dependencyVal)) {
                    return true;
                }
                return false;
            }
            return true;
        },
        compare(operand1, operator, operand2) {
            switch (operator) {
                case '==':
                    return operand1 === operand2;
                    break;
                case '!=':
                    return operand1 !== operand2;
                    break;
            }
        },
    },
};
</script>

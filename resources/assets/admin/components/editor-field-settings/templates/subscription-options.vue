<template>
    <div class="ff_payment_item_wrapper">
        <el-form-item>
            <template #label>
                <el-label :label="$t('Subscription Type')" :helpText="$t('Select your subscription plan type')" />
            </template>

            <el-radio-group size="small" @change="checkPricingPlans()" v-model="editItem.attributes.type">
                <el-radio-button value="single">
                    {{ $t('Single Recurring Plan') }}
                </el-radio-button>

                <el-radio-button value="multiple">
                    {{ $t('Multiple Pricing Plans') }}
                </el-radio-button>
            </el-radio-group>
        </el-form-item>

        <el-form-item v-if="editItem.attributes.type === 'multiple'">
            <template #label>
                <el-label
                    :label="$t('Plan Display Type')"
                    :helpText="$t('Select how you want to display the plan options')"
                />
            </template>

            <el-radio-group size="small" v-model="editItem.settings.selection_type">
                <el-radio-button value="radio">
                    {{ $t('Radio input field') }}
                </el-radio-button>

                <el-radio-button value="select">
                    {{ $t('Select input field') }}
                </el-radio-button>
            </el-radio-group>
        </el-form-item>

        <p>
            <strong>
                {{ $t('Pricing Plans') }}
            </strong>
        </p>

        <div
            class="subscription-field-options"
            v-for="(item, index) in editItem.settings.subscription_options"
            :key="index"
        >
            <div class="plan_header">
                <div class="plan_label">#{{ index + 1 }}: {{ item.name }}</div>

                <div class="plan_actions">
                    <span v-if="editItem.attributes.type !== 'single'">
                        {{ $t('Default:') }}
                        <el-switch
                            class="mr-2"
                            v-model="item.is_default"
                            active-value="yes"
                            inactive-value="no"
                            @change="changeDefaultItem(index)"
                        />
                    </span>

                    <el-button
                        class="el-button--soft el-button--icon"
                        size="small"
                        type="danger"
                        icon="el-icon-delete"
                        @click="deleteItem(index)"
                        v-show="editItem.settings.subscription_options.length > 1"
                    />
                </div>
            </div>

            <div class="plan_body">
                <el-form-item>
                    <template #label>
                        <el-label :label="$t('Plan Name')" />
                    </template>

                    <el-input size="small" type="text" v-model="item.name" :placeholder="$t('Plan Name')" />
                </el-form-item>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item>
                            <template #label>
                                <elLabel :label="$t('Price')" />
                            </template>

                            <el-input-number
                                :min="0"
                                size="small"
                                v-model="item.subscription_amount"
                                :disabled="item.user_input === 'yes'"
                            />
                        </el-form-item>
                        <el-form-item>
                            <el-checkbox true-value="yes" false-value="no" v-model="item.user_input">
                                {{ $t('Enable User Input Amount') }}
                            </el-checkbox>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item>
                            <template #label>
                                <el-label :label="$t('Billing Interval')" />
                            </template>

                            <el-select size="small" :placeholder="$t('Select')" v-model="item.billing_interval">
                                <el-option
                                    v-for="(label, value) in interval_options"
                                    :key="value"
                                    :label="label"
                                    :value="value"
                                >
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>

                <template v-if="item.user_input === 'yes'">
                    <el-form-item>
                        <template #label>
                            <el-label :label="$t('User Input Amount label')" />
                        </template>

                        <el-input
                            type="text"
                            size="small"
                            v-model="item.user_input_label"
                            :placeholder="$t('ex: Please Provide amount/interval')"
                        />
                    </el-form-item>
                    <el-row :gutter="20">
                        <el-col :span="12">
                            <el-form-item>
                                <template #label>
                                    <el-label :label="$t('Minimum Amount')" />
                                </template>

                                <el-input-number size="small" v-model="item.user_input_min_value" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item>
                                <template #label>
                                    <el-label :label="$t('Default Amount')" />
                                </template>

                                <el-input-number size="small" v-model="item.user_input_default_value" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                </template>

                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item>
                            <template #label>
                                <el-label :label="$t('Has Signup Fee?')" />
                            </template>

                            <el-switch
                                active-value="yes"
                                inactive-value="no"
                                v-model="item.has_signup_fee"
                                :disabled="item.has_trial_days === 'yes'"
                            />

                            <el-input-number
                                :min="0"
                                size="small"
                                :placeholder="$t('Signup Fee')"
                                v-model="item.signup_fee"
                                v-if="item.has_signup_fee === 'yes'"
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item>
                            <template #label>
                                <el-label :label="$t('Has Trial Days? (in days)')" />
                            </template>

                            <el-switch
                                active-value="yes"
                                inactive-value="no"
                                v-model="item.has_trial_days"
                                :disabled="item.has_signup_fee === 'yes'"
                            />

                            <el-input-number
                                :min="0"
                                size="small"
                                :placeholder="$t('Trial Days')"
                                v-model="item.trial_days"
                                v-if="item.has_trial_days === 'yes'"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-form-item>
                    <template #label>
                        <el-label :label="$t('Total Billing times')" />
                    </template>

                    <el-input-number :min="0" size="small" v-model="item.bill_times" :placeholder="$t('times')" />

                    <p class="text-note mt-1">
                        {{ $t('Keep blank or 0 for billing unlimited period of times') }}
                    </p>
                </el-form-item>
            </div>

            <div class="plan_footer">
                <span v-html="getAdvancedText(item)"></span>
            </div>
        </div>

        <div class="wpf_plan_actions" v-if="editItem.attributes.type !== 'single'">
            <el-button @click="add" size="small">
                {{ $t('Add New Plan') }}
            </el-button>
        </div>
    </div>
</template>

<script>
import each from 'lodash/each';
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'subscription-options',
    props: ['editItem', 'listItem'],
    components: {
        elLabel,
    },
    data() {
        return {
            interval_options: {
                day: 'Daily',
                week: 'Weekly',
                month: 'Monthly',
                year: 'Yearly',
            },
        };
    },
    methods: {
        deleteItem(index) {
            this.editItem.settings.subscription_options.splice(index, 1);
        },

        add() {
            this.editItem.settings.subscription_options.push({
                name: 'Plan Name Here',
                trial_days: 0,
                has_trial_days: 'no',
                trial_period_days: 0,
                billing_interval: 'month',
                bill_times: 0,
                has_signup_fee: 'no',
                signup_fee: 0,
                subscription_amount: '19.99',
                plan_features: [],
            });
        },

        getAdvancedText(item) {
            let billAmount = item.subscription_amount;

            if (item.user_input === 'yes') {
                billAmount = 'USER_INPUT_AMOUNT';
            }

            let text = `Price <b>${billAmount}/${item.billing_interval}</b> `;

            if (item.has_trial_days === 'yes') {
                text += `with ${item.trial_days} trial days `;
            }

            if (item.has_signup_fee === 'yes') {
                text += `and Inital <b>Signup Fee ${item.signup_fee}</b> `;
            }

            if (parseInt(item.bill_times)) {
                text += `and Total <b>Billing times ${item.bill_times}</b> `;
            } else {
                text += `and will be billed until cancel`;
            }

            return this.$t(text);
        },

        changeDefaultItem(index) {
            each(this.editItem.settings.subscription_options, (option, itemIndex) => {
                if (itemIndex !== index) {
                    option.is_default = 'no';
                }
            });
        },

        checkPricingPlans() {
            if (this.editItem.attributes.type === 'single' && this.editItem.settings.subscription_options.length > 1) {
                this.editItem.settings.subscription_options = [this.editItem.settings.subscription_options[0]];
            }
        },
    },
};
</script>

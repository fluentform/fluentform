<template>
    <div>
        <template v-if="!editItem.settings.multi_column">
            <el-form labelWidth="130px" labelPosition="top">
                <inputDefaultValue
                    v-model="firstField.attributes.value"
                    :listItem="{ label: 'Default' }"
                    :editItem="firstField"
                ></inputDefaultValue>

                <inputText
                    :listItem="{ type: 'text', label: 'Placeholder' }"
                    v-model="firstField.attributes.placeholder"
                ></inputText>
            </el-form>

            <validationRules labelPosition="top" :editItem="firstField"></validationRules>
        </template>

        <template v-if="editItem.settings.multi_column">
            <div class="address-field-option" ref="highlight" v-for="(field, i) in editItem.fields" :key="i">
                <div class="field-options-settings">
                    <div class="action-btn pull-right">
                        <i @click="toggleAddressFieldInputs" class="icon el-icon-caret-bottom"></i>
                        <i @click="increase" class="icon el-icon-plus"></i>
                        <i @click="decrease(i)" class="icon el-icon-minus"></i>
                    </div>
                    {{ field.settings.label }}
                </div>
                <fieldOptionSettings class="address-field-option__settings" :field="field"> </fieldOptionSettings>
            </div>
        </template>
    </div>
</template>

<script>
import elLabel from '../../includes/el-label.vue';
import fieldOptionSettings from './fieldOptionSettings.vue';
import inputText from './inputText.vue';
import inputDefaultValue from './inputValue.vue';
import validationRules from './validationRules.vue';

export default {
    name: 'customRepeatFields',
    props: ['listItem', 'editItem'],
    components: {
        'ff-label': elLabel,
        inputText,
        inputDefaultValue,
        validationRules,
        fieldOptionSettings,
    },
    computed: {
        firstField() {
            return this.editItem.fields[0];
        },
    },
    watch: {
        'editItem.settings.multi_column'() {
            if (!this.editItem.settings.multi_column) {
                this.editItem.fields = [this.firstField];
            }
        },
    },
    methods: {
        highlightEl(el) {
            jQuery(el)
                .addClass('highlighted')
                .delay(1000)
                .queue(function (next) {
                    jQuery(this).removeClass('highlighted');
                    next();
                });
        },
        increase() {
            const newCol = _ff.cloneDeep(this.editItem.fields[0]);
            newCol.settings.label = `Column ${this.editItem.fields.length + 1}`;
            this.editItem.fields.push(newCol);
        },
        decrease(index) {
            if (this.editItem.fields.length > 1) {
                this.editItem.fields.splice(index, 1);
            } else {
                this.highlightEl(this.$refs.highlight);

                this.$notify.error({
                    title: 'Oops!',
                    message: 'The last item can not be deleted.',
                    offset: 30,
                });
            }
        },
        toggleAddressFieldInputs(event) {
            if (
                !jQuery(event.target)
                    .closest('.address-field-option')
                    .find('.address-field-option__settings')
                    .hasClass('is-open')
            ) {
                jQuery(event.target)
                    .closest('.address-field-option')
                    .find('.address-field-option__settings')
                    .addClass('is-open');
                jQuery(event.target).closest('.address-field-option').find('.required-checkbox').addClass('is-open');
            } else {
                jQuery(event.target)
                    .closest('.address-field-option')
                    .find('.address-field-option__settings')
                    .removeClass('is-open');
                jQuery(event.target).closest('address-field-option').find('.required-checkbox').removeClass('is-open');
            }
        },
    },
};
</script>

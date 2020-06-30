<template>
    <div class="el-form--label-top">
        <p><strong>{{ listItem.label }}</strong></p>

        <div class="address-field-option" v-for="field, i in editItem.fields">
            <i @click="toggleAddressFieldInputs" class="el-icon-caret-bottom el-icon-clickable pull-right"></i>

            <el-checkbox v-model="field.settings.visible">{{ field.settings.label }}</el-checkbox>

            <template v-if="!field.settings.hasOwnProperty('country_list')">
                <fieldOptionSettings class="address-field-option__settings" :field="field"></fieldOptionSettings>
            </template>

            <div v-if="field.settings.hasOwnProperty('country_list')" class="address-field-option__settings">
                <div class="form-group">
                    <div class="el-form-item">
                        <label class="el-form-item__label" for="">Label</label>
                        <el-input v-model="field.settings.label" size="small"></el-input>
                    </div>
                </div>

                <div class="form-group">
                    <div class="el-form-item">
                        <label class="el-form-item__label" for="">Placeholder</label>
                        <el-input v-model="field.attributes.placeholder" size="small"></el-input>
                    </div>
                </div>

                <wpuf_customCountryList :listItem="listItem" :editItem="field"></wpuf_customCountryList>

                <validationRules labelPosition="left" :editItem="field"></validationRules>
            </div>
        </div>
    </div>
</template>

<script>
import fieldOptionSettings from './fieldOptionSettings.vue'
import customCountryList from './customCountryList.vue'
import validationRules from './validationRules.vue'

export default {
    name: 'customAddressFields',
    props: ['listItem', 'editItem'],
    components: {
        'wpuf_customCountryList': customCountryList,
        fieldOptionSettings,
        validationRules
    },
    methods: {
        toggleAddressFieldInputs(event) {
            if (! jQuery(event.target).parent().find('.address-field-option__settings').hasClass('is-open')) {
                jQuery(event.target).removeClass('el-icon-caret-bottom');
                jQuery(event.target).addClass('el-icon-caret-top');
                jQuery(event.target).parent().find('.address-field-option__settings').addClass('is-open');
                jQuery(event.target).parent().find('.required-checkbox').addClass('is-open');
            } else {
                jQuery(event.target).removeClass('el-icon-caret-top');
                jQuery(event.target).addClass('el-icon-caret-bottom');
                jQuery(event.target).parent().find('.address-field-option__settings').removeClass('is-open');
                jQuery(event.target).parent().find('.required-checkbox').removeClass('is-open');
            }
        },
    }
}
</script>

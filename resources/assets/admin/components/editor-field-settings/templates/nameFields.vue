<template>
    <div class="el-form--label-top">
        <p><strong>{{ listItem.label }}</strong></p>

        <div class="address-field-option" v-for="field, i in editItem.fields">
            <i @click="toggleAddressFieldInputs" class="el-icon-caret-bottom el-icon-clickable pull-right"></i>

            <el-checkbox v-model="field.settings.visible"  :disabled="field.settings.disabled === true" >{{ field.settings.label }}</el-checkbox>

            <fieldOptionSettings class="address-field-option__settings" :field="field"  v-if="field.settings.disabled != true" ></fieldOptionSettings>
        </div>
    </div>
</template>

<script>
import { mapGetters } from 'vuex';
import fieldOptionSettings from './fieldOptionSettings.vue'

export default {
    name: 'nameFields',
    props: ['listItem', 'editItem'],
    components: {
        fieldOptionSettings
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

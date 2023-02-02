<template>
    <div class="ff_field_customization_option_wrap">
        <h6 class="ff_field_customization_option_title">{{ listItem.label }}</h6>
        <div class="ff_field_customization_option" v-for="(field, i) in editItem.fields" :key="i">
            <div class="ff_field_customization_option_title_group">
                <el-checkbox v-model="field.settings.visible"  :disabled="field.settings.disabled === true" >
                    {{ field.settings.label }}
                </el-checkbox>
                 <i @click="toggleAddressFieldInputs" class="el-icon-caret-bottom ff_toggle_icon"></i>
            </div>

            <fieldOptionSettings 
                class="ff_field_customization_option_settings" 
                :field="field"  
                v-if="field.settings.disabled != true"
            ></fieldOptionSettings>
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
            if (! jQuery(event.target).parent().parent().find('.ff_field_customization_option_settings').hasClass('is-open')) {
                jQuery(event.target).removeClass('el-icon-caret-bottom');
                jQuery(event.target).addClass('el-icon-caret-top');
                jQuery(event.target).parent().parent().find('.ff_field_customization_option_settings').addClass('is-open');
                jQuery(event.target).parent().parent().find('.required-checkbox').addClass('is-open');
            } else {
                jQuery(event.target).removeClass('el-icon-caret-top');
                jQuery(event.target).addClass('el-icon-caret-bottom');
                jQuery(event.target).parent().parent().find('.ff_field_customization_option_settings').removeClass('is-open');
                jQuery(event.target).parent().parent().find('.required-checkbox').removeClass('is-open');
            }
        },
    }
}
</script>

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
        <el-form-item v-if="has_gmap_api" label="Autocomplete Feature">
            <el-checkbox true-label="yes" false-label="no" v-model="editItem.settings.enable_g_autocomplete">Enable
                Autocomplete (Google Map)
            </el-checkbox>
        </el-form-item>
        <el-form-item v-if="has_gmap_api  && editItem.settings.enable_g_autocomplete =='yes'" label="Show Map">
            <el-checkbox true-label="yes" false-label="no" v-model="editItem.settings.enable_g_map">
                Enable Map (Google Map)
            </el-checkbox>
        </el-form-item>


        <el-form-item v-if="has_gmap_api && editItem.settings.enable_g_autocomplete =='yes'">
            <div slot="label">
                Auto locate
                <el-tooltip  effect="dark" content="Select auto user loacte & address fill up type , one page load or on address button click" placement="top">
                    <i class="tooltip-icon el-icon-info"></i>
                </el-tooltip>
            </div>

            <el-radio-group
                    size="small"
                    v-model="editItem.settings.enable_auto_locate"
            >
                <el-radio-button label="on_load">
                    {{ $t('Page Load') }}
                </el-radio-button>
                <el-radio-button label="on_click">
                    {{ $t('On Click ') }}
                </el-radio-button>
                <el-radio-button label="no">
                    {{ $t('Disable') }}
                </el-radio-button>
            </el-radio-group>
        </el-form-item>


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
    data() {
        return {
            has_gmap_api: !!window.FluentFormApp.has_address_gmap_api
        }
    },
    methods: {
        toggleAddressFieldInputs(event) {
            if (!jQuery(event.target).parent().find('.address-field-option__settings').hasClass('is-open')) {
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

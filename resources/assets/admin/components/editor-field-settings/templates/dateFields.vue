<template>
    <div>
        <template v-if="editItem.settings['date_type'] === 'single'">
            <singleDateSettings
                :field="editItem.single_field"
                :label_placement="editItem.single_field?.editor_elements?.label_placement"
                :date_format="editItem.single_field?.editor_elements?.date_format"
                :start_year="editItem.single_field?.editor_elements?.start_year"
                :end_year="editItem.single_field?.editor_elements?.end_year"
            />
        </template>
        <template v-if="editItem.settings['date_type'] === 'multiple'">
            <div class="el-form--label-top">
                <inputText
                    v-model="editItem.multi_field.settings.label"
                    :listItem="{type: 'text', label: 'Label'}">
                </inputText>

                <p><strong>{{ listItem.label }}</strong></p>
                
                <div class="address-field-option" v-for="(field, i) in editItem.multi_field?.fields" :key="i">
                    
                    <el-checkbox v-model="field.settings.visible"  :disabled="field.settings.disabled === true" >{{ field.settings.label }}</el-checkbox>
                    
                    <div class="address-field-option__settings">
                        <fieldOptionSettings 
                            v-if="field.settings.disabled != true"
                            :field="field"
                        />
                        <multiDateYearSettings
                            v-if="field.settings.start_year"
                            :start_year="field.settings.start_year"
                            :end_year="field.settings.end_year"
                        />
                    </div>
                </div>

                <radioButton 
                    :listItem="{label: 'Labels Placement', options: editItem.multi_field?.editor_elements?.label_placement?.options, help_text: editItem.multi_field?.editor_elements?.label_placement?.help_text}"
                    v-model="editItem.multi_field.settings.label_placement">
                </radioButton>

                <customSelect
                    v-model="editItem.multi_field.settings.date_format"
                    :listItem="{
                        label: editItem.multi_field?.editor_elements?.date_format?.label,
                        help_text: editItem.multi_field?.editor_elements?.date_format?.help_text,
                        options: editItem.multi_field?.editor_elements?.date_format?.options
                    }">
                </customSelect>
            </div>
        </template>
    </div>
</template>

<script>
import fieldOptionSettings from './fieldOptionSettings.vue';
import singleDateSettings from './singleDateSettings.vue';
import multiDateYearSettings from './multiDateYearSettings.vue';
import customSelect from './select.vue';
import inputText from './inputText.vue';
import radioButton from './radioButton.vue';

export default {
    name: 'dateFields',
    props: ['listItem', 'editItem'],
    components: {
        fieldOptionSettings,
        singleDateSettings,
        multiDateYearSettings,
        customSelect,
        inputText,
        radioButton
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

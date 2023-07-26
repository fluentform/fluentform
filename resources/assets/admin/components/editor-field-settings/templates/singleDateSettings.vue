<template>
    <div>

        <inputText :listItem="{type: 'text', label: 'Label'}" v-model="field.settings.label"></inputText>

        <radioButton 
            :listItem="{label: label_placement.label, options: label_placement.options, help_text: label_placement.help_text}"
            v-model="field.settings.label_placement">
        </radioButton>

        <inputDefaultValue v-model="field.attributes.value" :listItem="{label: 'Default'}" :editItem="field"></inputDefaultValue>

        <inputText :listItem="{type: 'text', label: 'Placeholder'}" v-model="field.attributes.placeholder"></inputText>

        <inputText :listItem="{type: 'text', label: 'Help Message'}" v-model="field.settings.help_message"></inputText>

        <advancedOptions
                class="ff_full_width_child"
                v-if="field.settings.advanced_options  != undefined "
                :editItem="field" :list-item="{ label: 'Options', help_text: 'Provide Field Options'}"
                :hasCalValue="true"
        />

        <validationRules :editItem="field"></validationRules>

        <customSelect
            :listItem="{label: date_format.label, options: date_format.options}" v-model="field.settings.date_format">
        </customSelect>

        <inputText 
            v-model="field.settings.start_year"
            :listItem="{type: start_year.type, label: start_year.label, help_text: start_year.help_text}">
        </inputText>

        <inputText 
            v-model="field.settings.end_year"
            :listItem="{type: end_year.type, label: end_year.label, help_text: end_year.help_text}">
        </inputText>
    </div>
</template>

<script type="text/babel">

import inputText from './inputText.vue';
import customSelect from './select.vue';
import radioButton from './radioButton.vue';
import inputDefaultValue from './inputValue.vue';
import validationRules from './validationRules.vue';
import advancedOptions from './advanced-options';

export default {
    name: 'singleDateSettings',
    props: {
        field: {
            type: Object,
            required: true
        },
        label_placement: {
            type: Object,
        },
        date_format: {
            type: Object,
            required: true
        },
        start_year: {
            type: Object,
            required: true
        },
        end_year: {
            type: Object,
            required: true
        }
    },
    components: {
        inputText,
        customSelect,
        radioButton,
        validationRules,
        inputDefaultValue,
        advancedOptions
    }
}
</script>


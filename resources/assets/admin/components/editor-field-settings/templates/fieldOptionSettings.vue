<template>
    <div>
        <el-form labelWidth="130px" labelPosition="left" class="el-form-nested">
            <inputText v-if="childFields.indexOf('label') != -1" :listItem="{type: 'text', label: 'Label'}" v-model="field.settings.label"></inputText>

            <inputDefaultValue v-if="childFields.indexOf('value') != -1" v-model="field.attributes.value" :listItem="{label: 'Default'}" :editItem="field"></inputDefaultValue>

            <inputText v-if="childFields.indexOf('placeholder') != -1" :listItem="{type: 'text', label: 'Placeholder'}" v-model="field.attributes.placeholder"></inputText>

            <inputText v-if="childFields.indexOf('help_message') != -1" :listItem="{type: 'text', label: 'Help Message'}" v-model="field.settings.help_message"></inputText>

            <inputText v-if="childFields.indexOf('maxlength') != -1 && field.attributes.maxlength  " :listItem="{type: 'number', label: 'Max text length'}" v-model="field.attributes.maxlength"></inputText>
            <advanced-options
                    class="ff_full_width_child"
                    v-if="childFields.indexOf('advanced_options') != -1 ||field.settings.advanced_options  != undefined "
                    :editItem="field" :list-item="{ label: 'Options', help_text: 'Provide Field Options'}"
                    :hasCalValue="true"
            ></advanced-options>

        </el-form>

        <validationRules labelPosition="left" :editItem="field"></validationRules>
    </div>
</template>

<script type="text/babel">
import { mapGetters } from 'vuex';

import inputText from './inputText.vue'
import inputDefaultValue from './inputValue.vue'
import inputPopover from '../../input-popover.vue'
import validationRules from './validationRules.vue'
import advancedOptions from './advanced-options'

export default {
    name: 'fieldOptionSettings',
    props: {
        field: {
            type: Object
        },
        childFields: {
            default() {
                return [
                    'label',
                    'value',
                    'placeholder',
                    'help_message',
                    'maxlength'
                ]
            }
        }
    },
    components: {
        inputText,
        inputPopover,
        validationRules,
        inputDefaultValue,
        advancedOptions,

    },
    computed: {
        ...mapGetters(['editorShortcodes']),
    },
}
</script>


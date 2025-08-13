<template>
    <div class="el-form--label-top">
        <p>
            <strong>{{ listItem.label }}</strong>
        </p>

        <div class="address-field-option" v-for="(field, i) in editItem.fields" :key="i">
            <el-icon @click="toggleAddressFieldInputs" class="el-icon-clickable pull-right"><CaretBottom /></el-icon>

            <el-checkbox v-model="field.settings.visible" :disabled="field.settings.disabled">
                {{ field.settings.label }}
            </el-checkbox>

            <fieldOptionSettings
                class="address-field-option__settings"
                :field="field"
                v-if="!field.settings.disabled"
            ></fieldOptionSettings>
        </div>
    </div>
</template>

<script>
import { CaretBottom } from '@element-plus/icons-vue';
import { ElIcon } from 'element-plus';
import fieldOptionSettings from './fieldOptionSettings.vue';

export default {
    name: 'nameFields',
    props: ['listItem', 'editItem'],
    components: {
        CaretBottom,
        ElIcon,
        fieldOptionSettings,
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
    },
};
</script>

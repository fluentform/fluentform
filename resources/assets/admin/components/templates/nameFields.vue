<template>
<div :class="wrapperClasses">
    <label v-if="item.settings.label" class="label-block" :class="item.settings.required ? 'is-required' : ''">{{ item.settings.label }}</label>

    <el-row :gutter="30">
        <template v-for="(field, key) in item.fields">
            <el-col :key="key" :md="is_conversion_form ? 24 : 24 / columns" v-if="field.settings.visible" :class="'ff-el-form-'+item.settings.label_placement" class="address-field-wrapper">
                <component :is="guessElTemplate(field)" :item="getPreviewField(field)"></component>
            </el-col>
        </template>
    </el-row>
</div>
</template>

<script type="text/babel">
import inputText from './inputText.vue'

export default {
    name: 'nameFields',
    props: ['item'],
    components: {
        'ff_inputText': inputText
    },
    computed: {
        columns() {
            let count = 0;
            _ff.each(this.item.fields, (element) => {
                if (element.settings.visible) {
                    count++;
                }
            });
            return count;
        },
        wrapperClasses() {
            return {
                'ff-composite-preview': true,
                'ff-composite-floating-outlined': this.item.settings.label &&
                    this.item.settings.enable_floating_label === 'yes' &&
                    this.item.settings.floating_label_style === 'outlined'
            };
        }
    },
    methods: {
        getPreviewField(field) {
            return {
                ...field,
                settings: {
                    ...field.settings,
                    enable_floating_label: this.item.settings.enable_floating_label || 'no',
                    floating_label_style: this.item.settings.floating_label_style || 'inline'
                }
            };
        }
    }
}
</script>

<template>
    <div>
        <template v-if="item.settings.date_type === 'single'">
            <component :is="guessElTemplate(item.single_field)" :item="item.single_field"></component>
        </template>
        <template v-if="item.settings.date_type === 'multiple'">
            <label v-if="item.multi_field?.settings?.label" class="label-block">{{ item.multi_field?.settings?.label }}</label>
            <el-row :gutter="30">
                <template v-for="(field, key) in item.multi_field?.fields">
                    <el-col :key="key" :md="24 / columns" v-if="field.settings.visible" :class="'ff-el-form-'+item.multi_field?.settings.label_placement" class="address-field-wrapper">
                        <component :is="guessElTemplate(field)" :item="field"></component>
                    </el-col>
                </template>
            </el-row>
        </template>
    </div>
    </template>
    
    <script type="text/babel">
    import inputText from './inputText.vue';
    import select from './select.vue';
    
    export default {
        name: 'dateFields',
        props: ['item'],
        components: {
            'ff_inputText': inputText,
            'ff_select': select
        },
        computed: {
            columns() {
                let count = 0;
                _ff.each(this.item.multi_field?.fields, (element) => {
                    if (element.settings.visible) {
                        count++;
                    }
                });
                return count;
            }
        }
    }
    </script>
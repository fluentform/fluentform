<template>
<div>
    <label v-if="item.settings.label" class="label-block" :class="item.settings.required ? 'is-required' : ''" v-html="item.settings.label"></label>

    <el-row :gutter="20">
        <el-col v-for="field, i in item.fields" :key="i" :md="12" v-if="field.settings.visible" class="address-field-wrapper">
            <component :is="guessElTemplate(field)" :item="field"></component>
        </el-col>
    </el-row>
</div>
</template>

<script>
import inputText from './inputText.vue'
import select from './select.vue'
import selectCountry from './selectCountry.vue'

export default {
    name: 'address_fields',
    props: ['item'],
    components: {
        'ff_inputText': inputText,
        'ff_select': select,
        'ff_selectCountry': selectCountry,
    }
}
</script>

<style lang="scss">
    .address-field-wrapper {
        margin-top: 10px;
    }
</style>
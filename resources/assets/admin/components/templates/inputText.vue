<template>
    <withLabel :item="item">
        <el-input 
            :type="item.attributes.type"
            :value="item.attributes.value"
            :disabled="disabled"
            :placeholder="placeholder">
        </el-input>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'inputText',
    props: ['item'],
    components: {
        withLabel
    },
    computed: {
        disabled() {
            return this.item.attributes.type == 'number' &&
                this.item.settings.calculation_settings &&
                this.item.settings.calculation_settings.status;
        },
        placeholder() {
            if (this.disabled) {
                return this.item.settings.calculation_settings.formula;
            }
            return this.item.attributes.placeholder;
        }
    }
}
</script>
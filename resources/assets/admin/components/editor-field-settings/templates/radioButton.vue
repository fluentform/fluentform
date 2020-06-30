<template>
<el-form-item>
    <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
    <el-radio-group size="mini" v-model="model">
        <el-radio-button v-for="opt, i in listItem.options" :key="opt.value" :label="opt.value">{{ opt.label }}</el-radio-button>
    </el-radio-group>
</el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'radioButton',
    props: ['listItem', 'value'],
    components: { elLabel },
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    data() {
        return {
            model: this.value
        }
    }
}
</script>
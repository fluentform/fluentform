<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        <el-input v-model="editModel" type="text"></el-input>
    </el-form-item>
</template>

<script type="text/babel">
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'inputRequiredFieldText',
    props: ['listItem', 'editItem'],
    data() {
        return {
            editModel: this.editItem.settings.validation_rules.required.message
        }
    },
    watch: {
        editModel() {
            this.editItem.settings.validation_rules.required.message = this.editModel;
        }
    },
    components: {
        elLabel
    }
}
</script>
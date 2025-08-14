<template>
    <validationRules :editItem="editItem"></validationRules>
</template>

<script>
import elLabel from '../../includes/el-label.vue'
import validationRules from './validationRules.vue'

export default {
    name: 'validationRulesForm',
    props: {
        editItem: Object
    },
    components: {
        elLabel,
        validationRules
    }
}
</script>
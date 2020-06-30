<template>
    <el-form-item>
        <elLabel slot="label" :label="fieldOpt.label" :helpText="fieldOpt.help_text"></elLabel>
        <slot></slot>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'withLabel',
    props: ['fieldOpt'],
    components: {
        elLabel
    }
}
</script>

<template>
    <el-form-item>
        <template #label>
            <el-label :label="fieldOpt.label" :helpText="fieldOpt.help_text"></el-label>
        </template>
        <slot></slot>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'withLabel',
    props: ['fieldOpt'],
    components: {
        elLabel,
    },
};
</script>

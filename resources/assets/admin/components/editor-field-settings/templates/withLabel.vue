<template>
    <el-form-item>
        <template #label>
            <ff-label :label="fieldOpt.label" :helpText="fieldOpt.help_text"></ff-label>
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
        'ff-label': elLabel,
    },
};
</script>

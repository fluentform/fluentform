<template>
    <el-form-item>
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
        <el-switch
            v-model="model"
            active-value="yes"
            inactive-value="no"
            active-color="#409EFF"
            inactive-color="#dcdfe6"
        />
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'inputSwitch',
    props: ['listItem', 'value'],
    components: {
        elLabel
    },
    computed: {
        model: {
            get() {
                return this.value;
            },
            set(value) {
                this.$emit('input', value);
            }
        }
    }
};
</script>

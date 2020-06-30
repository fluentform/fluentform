<template>
    <el-form-item>
        <elLabel
            slot="label"
            v-if="listItem.label"
            :label="listItem.label"
            :helpText="listItem.help_text"
        ></elLabel>

        <el-checkbox-group class="el-fluid el-checkbox-horizontal" v-model="model">
            <el-checkbox
                v-for="opt, i in listItem.options"
                :label="opt.value"
                :key="i"
            >{{ opt.label }}</el-checkbox>
        </el-checkbox-group>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'inputCheckbox',
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
};
</script>

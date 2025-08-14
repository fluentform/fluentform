<template>
    <el-form-item v-if="show">
        <template #label>
            <el-label :label="listItem.label" :helpText="listItem.help_text"></el-label>
        </template>
        <el-radio-group class="el-radio-button-group" size="small" v-model="model">
            <el-radio-button v-for="(opt, index) in listItem.options" :value="opt.value" :key="index"
                >{{ opt.label }}
            </el-radio-button>
        </el-radio-group>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'radioButton',
    props: ['listItem', 'modelValue'],
    components: { elLabel },
    data() {
        return {
            show: true,
            model: this.modelValue,
        };
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
        '$attrs.editItem.settings.label': function (newVal, oldVal) {
            if (newVal === '') {
                this.show = false;
                this.$emit('input', '');
            } else {
                this.show = true;
                this.$emit('input', this.model);
            }
        },
    },
    mounted() {
        if (this.$attrs.editItem) {
            if ('label' in this.$attrs.editItem.settings && !this.$attrs.editItem.settings.label) {
                this.show = false;
                this.$emit('update:modelValue', '');
            }
        }
    },
};
</script>

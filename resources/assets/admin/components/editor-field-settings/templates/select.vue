<template>
    <el-form-item>
        <template #label>
            <el-label slot="label" :label="listItem.label" :helpText="listItem.help_text"></el-label>
        </template>

        <el-select
            class="el-fluid"
            :multiple="isMultiple"
            v-model="model"
            :filterable="listItem.filterable"
            :allow-create="listItem.creatable"
            :placeholder="listItem.placeholder"
        >
            <el-option v-for="item in listItem.options" :key="item.value" :label="item.label" :value="item.value">
            </el-option>
        </el-select>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue';

export default {
    name: 'customSelect',
    props: ['listItem', 'modelValue'],
    components: {
        elLabel,
    },
    data() {
        return {
            model: this.modelValue,
        };
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
        },
    },
    computed: {
        isMultiple() {
            return this.listItem?.is_multiple || false;
        },
    },
};
</script>

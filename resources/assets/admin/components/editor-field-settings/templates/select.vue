<template>
    <el-form-item v-if="shouldShowSelectField">
        <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>

        <el-select class="el-fluid" :multiple="isMultiple" v-model="model" :filterable="listItem.filterable" :allow-create="listItem.creatable" :placeholder="listItem.placeholder">
            <el-option
                v-for="item in listItem.options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
            </el-option>
        </el-select>
    </el-form-item>
</template>

<script>
import elLabel from '../../includes/el-label.vue'

export default {
    name: 'customSelect',
    props: ['listItem', 'value', 'editItem', 'prop'],
    components: {
        elLabel
    },
    data() {
        return {
            model: this.value
        }
    },
    watch: {
        model() {
            this.$emit('input', this.model);
        }
    },
    computed: {
        isMultiple() {
            return this.listItem?.is_multiple || false;
        },
        // @todo remove this special handling after adding proper chained dependency support to editor settings
        shouldShowSelectField() {
            if (this.prop !== 'crop_ratio') {
                return true;
            }

            return this.editItem?.settings?.enable_crop === 'yes' && this.editItem?.settings?.crop_mode === 'ratio';
        }
    }
}
</script>

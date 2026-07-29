<template>
    <div>
        <el-form-item :label="$t('Field Type')">
            <el-select value='' v-model="editItem.settings.product_type">
                <el-option
                    v-for="(item, key) in fieldTypes"
                    :value="item.value"
                    :label="item.label"
                    :key="key"
                />
            </el-select>
        </el-form-item>

        <el-form-item v-if="editItem.settings.product_type == 'single'">
            <el-label :label="$t('Price')" />
            <el-input v-model="editItem.settings.product_price" type="text" class="el-form-item" />
            <el-checkbox v-model="editItem.settings.disable_quantity_field">
                {{ $t('Disable Quantity') }}
            </el-checkbox>
        </el-form-item>

        <el-form-item v-if="['dropdown', 'radio'].includes(editItem.settings.product_type)">
            <gridRowCols
                :editItem="editItem"
                :listItem="listItem"
                :value="editItem.settings.grid_columns"
                prop="grid_columns"
                @input="handleOptions"
                valuesAlwaysVisible
            />
        </el-form-item>
    </div>
</template>

<script>
import elLabel from '../../includes/el-label';
import gridRowCols from './gridRowCols';

export default {
    name: 'productFieldTypes',
    props: ['editItem', 'listItem'],
    components: {elLabel, gridRowCols},
    methods: {
        handleOptions(options) {
            this.editItem.settings.grid_columns = options;
        }
    },
    computed: {
        fieldTypes() {
            return this.editItem.settings.field_types;
        }
    }
};
</script>

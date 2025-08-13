<template>
    <div>
        <p>
            <strong>
                <ff-label :label="item.settings.label"></ff-label>
            </strong>
        </p>

        <template v-if="fieldType === 'single'">
            <p>
                <ff-label :label="$t('Price: $') + item.settings.product_price"></ff-label>
                <el-input type="text" value="" v-if="!isQuantityDisabled"></el-input>
            </p>
        </template>

        <template v-else-if="fieldType === 'dropdown'">
            <p>
                <el-form-item label="">
                    <el-select :value="defaultSelectedOption" placeholder="" class="el-fluid">
                        <el-option value="" label=""></el-option>
                    </el-select>
                </el-form-item>
            </p>
        </template>

        <template v-else-if="fieldType === 'radio'" v-for="(text, value, i) in radioOptions" :key="i">
            <p>
                <el-radio v-model="defaultSelectedOption" :value="text" :key="value">{{ text }} </el-radio>
            </p>
        </template>

        <p>
            <ff-label :label="item.settings.description"></ff-label>
        </p>
    </div>
</template>

<script>
import elLabel from '../includes/el-label.vue';

export default {
    name: 'product',
    components: { 'ff-label': elLabel },
    props: ['item'],
    computed: {
        radioOptions() {
            return this.item.settings.grid_columns;
        },
        fieldType() {
            return this.item.settings.product_type;
        },
        defaultSelectedOption() {
            return this.item.settings.grid_columns[Object.values(this.item.settings.selected_grids)[0]];
        },
        isQuantityDisabled() {
            return this.item.settings.disable_quantity_field;
        },
    },
};
</script>

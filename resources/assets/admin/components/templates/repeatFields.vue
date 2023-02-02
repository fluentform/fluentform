<template>
<el-form-item class="ff_repeat_field" :class="{ 'is-required': !isMultiCol && required, ['ff-el-form-'+item.settings.label_placement]: item.settings.label_placement }">
    <elLabel slot="label" :label="item.settings.label"></elLabel>
    <div class="ff_repeat_field_item">
        <el-form-item v-for="(field, key, i) in item.fields" :key="i" :class="{ 'is-required' : field.settings.validation_rules.required.value }">
            <elLabel v-if="isMultiCol" slot="label" :label="field.settings.label"></elLabel>
            <el-input v-if="field.element != 'select'" :value="field.attributes.value" :placeholder="field.attributes.placeholder"></el-input>
            <div v-else>
                <el-select :placeholder="field.attributes.placeholder"></el-select>
            </div>
        </el-form-item>
        <ul class="ff_icon_group" :class="{'repeat-field-actions': isMultiCol }">
            <li>
                <div class="ff_icon_btn xs dark ff_icon_btn_clickable">
                    <i class="el-icon el-icon-plus"></i>
                </div>
            </li>
            <li>
                <div class="ff_icon_btn xs dark ff_icon_btn_clickable">
                    <i class="el-icon el-icon-minus"></i>
                </div>
            </li>
        </ul>
    </div>
</el-form-item>
</template>

<script>
import elLabel from '../includes/el-label.vue'

export default {
    name: 'repeat_fields',
    props: ['item'],
    components: {
        elLabel
    },
    computed: {
        firstField() {
            return this.item.fields[0];
        },
        isMultiCol() {
            return this.item.fields.length > 1;
        },
        required() {
            return this.firstField.settings.validation_rules.required.value;
        }
    },
}
</script>

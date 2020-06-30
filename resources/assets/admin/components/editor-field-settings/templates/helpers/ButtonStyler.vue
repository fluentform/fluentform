<template>
    <div class="button_styler_wrapper">
        <div class="styler_row styler_row_3">
            <el-form-item>
                <elLabel slot="label" label="Background Color" helpText="Button Background Color"></elLabel>
                <ninja-color-picker v-model="model.backgroundColor"></ninja-color-picker>
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" label="Text Color" helpText="Button Text Color"></elLabel>
                <el-color-picker v-model="model.color"></el-color-picker>
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" label="Border Color" helpText="Button Border Color"></elLabel>
                <ninja-color-picker v-model="model.borderColor"></ninja-color-picker>
            </el-form-item>
        </div>
        <div class="styler_row">
            <el-form-item>
                <elLabel slot="label" label="Border Radius (px)" helpText="Button Border Radius"></elLabel>
                <input type="number" v-model="model.borderRadius" />
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" label="Min-Width" helpText="Button Min-Width (Keep blank/0 for auto)"></elLabel>
                <input placeholder="ex: 100%" type="text" v-model="model.minWidth" />
            </el-form-item>
        </div>
    </div>
</template>

<script type="text/babel">
    import elLabel from '../../../includes/el-label.vue'
    import ninjaColorPicker from './ColorPicker';
    export default {
        name: 'ButtonStyler',
        props: ['value'],
        data() {
          return {
              model: this.value
          }
        },
        watch: {
            value() {
                this.$emit('input', this.model);
            }
        },
        components: {
            elLabel,
            ninjaColorPicker
        }
    }
</script>

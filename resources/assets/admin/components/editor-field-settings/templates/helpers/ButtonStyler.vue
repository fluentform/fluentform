<template>
    <div class="button_styler_wrapper">
        <div class="styler_row">
            <el-form-item>
                <elLabel slot="label" :label="$t('Background Color')" :helpText="$t('Button Background Color')"></elLabel>
                <ninja-color-picker v-model="model.backgroundColor"></ninja-color-picker>
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" :label="$t('Text Color')" :helpText="$t('Button Text Color')"></elLabel>
                <el-color-picker v-model="model.color"></el-color-picker>
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" :label="$t('Border Color')" :helpText="$t('Button Border Color')"></elLabel>
                <ninja-color-picker v-model="model.borderColor"></ninja-color-picker>
            </el-form-item>
        </div>
        <div class="styler_row">
            <el-form-item>
                <elLabel slot="label" :label="$t('Border Radius (px)')" :helpText="$t('Button Border Radius')"></elLabel>
                <input class="w-100" :placeholder="$t('ex: 4')" type="number" v-model="model.borderRadius" />
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" :label="$t('Min-Width')" :helpText="$t('Button Min-Width (Keep blank/0 for auto)')"></elLabel>
                <input class="w-100" :placeholder="$t('ex: 100%')" type="text" v-model="model.minWidth" />
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

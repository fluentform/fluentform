<template>
    <div class="button_styler_wrapper">
        <div class="styler_row">
            <el-form-item>
                <elLabel slot="label" :label="$t('Background Color')" :helpText="$t('Button Background Color')"></elLabel>
                <ninja-color-picker v-model="sanitizedBackgroundColor"></ninja-color-picker>
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" :label="$t('Text Color')" :helpText="$t('Button Text Color')"></elLabel>
                <ninja-color-picker v-model="sanitizedColor"></ninja-color-picker>
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" :label="$t('Border Color')" :helpText="$t('Button Border Color')"></elLabel>
                <ninja-color-picker v-model="sanitizedBorderColor"></ninja-color-picker>
            </el-form-item>
        </div>
        <div class="styler_row">
            <el-form-item>
                <elLabel slot="label" :label="$t('Border Radius (px)')" :helpText="$t('Button Border Radius')"></elLabel>
                <input class="w-100" :placeholder="$t('ex: 4')" type="number" v-model="sanitizedBorderRadius" />
            </el-form-item>
            <el-form-item>
                <elLabel slot="label" :label="$t('Min-Width')" :helpText="$t('Button Min-Width (Keep blank/0 for auto)')"></elLabel>
                <input class="w-100" :placeholder="$t('ex: 100%')" type="text" v-model="sanitizedMinWidth" />
            </el-form-item>
        </div>
    </div>
</template>

<script type="text/babel">
    import elLabel from '../../../includes/el-label.vue'
    import ninjaColorPicker from './ColorPicker.vue';
    import DOMPurify from "dompurify";
    export default {
        name: 'ButtonStyler',
        props: ['value'],
        data() {
          return {
              model: this.value
          }
        },
        computed: {
            sanitizedBackgroundColor: {
                get() {
                    return this.model.backgroundColor;
                },
                set(newValue) {
                    this.model.backgroundColor = DOMPurify.sanitize(newValue);
                    this.$emit('input', this.model);
                }
            },
            sanitizedColor: {
                get() {
                    return this.model.color;
                },
                set(newValue) {
                    this.model.color = DOMPurify.sanitize(newValue);
                    this.$emit('input', this.model);
                }
            },
            sanitizedBorderColor: {
                get() {
                    return this.model.borderColor;
                },
                set(newValue) {
                    this.model.borderColor = DOMPurify.sanitize(newValue);
                    this.$emit('input', this.model);
                }
            },
            sanitizedBorderRadius: {
                get() {
                    return this.model.borderRadius;
                },
                set(newValue) {
                    this.model.borderRadius = DOMPurify.sanitize(newValue);
                    this.$emit('input', this.model);
                }
            },
            sanitizedMinWidth: {
                get() {
                    return this.model.minWidth;
                },
                set(newValue) {
                    this.model.minWidth = DOMPurify.sanitize(newValue);
                    this.$emit('input', this.model);
                }
            }
        },
        components: {
            elLabel,
            ninjaColorPicker
        }
    }
</script>

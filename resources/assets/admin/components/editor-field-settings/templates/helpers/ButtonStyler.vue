<template>
    <div class="button_styler_wrapper">
        <div class="styler_row">
            <el-form-item>
                <template #label>
                    <el-label :label="$t('Background Color')" :helpText="$t('Button Background Color')"></el-label>
                </template>
                <ninja-color-picker v-model="model.backgroundColor"></ninja-color-picker>
            </el-form-item>
            <el-form-item>
                <template #label>
                    <el-label :label="$t('Text Color')" :helpText="$t('Button Text Color')"></el-label>
                </template>
                <ninja-color-picker v-model="model.color"></ninja-color-picker>
            </el-form-item>
            <el-form-item>
                <template #label>
                    <el-label :label="$t('Border Color')" :helpText="$t('Button Border Color')"></el-label>
                </template>
                <ninja-color-picker v-model="model.borderColor"></ninja-color-picker>
            </el-form-item>
        </div>
        <div class="styler_row">
            <el-form-item>
                <template #label>
                    <el-label :label="$t('Border Radius (px)')" :helpText="$t('Button Border Radius')"></el-label>
                </template>
                <input class="w-100" :placeholder="$t('ex: 4')" type="number" v-model="model.borderRadius" />
            </el-form-item>
            <el-form-item>
                <template #label>
                    <el-label
                        :label="$t('Min-Width')"
                        :helpText="$t('Button Min-Width (Keep blank/0 for auto)')"
                    ></el-label>
                </template>
                <input class="w-100" :placeholder="$t('ex: 100%')" type="text" v-model="model.minWidth" />
            </el-form-item>
        </div>
    </div>
</template>

<script type="text/babel">
import elLabel from '../../../includes/el-label.vue';
import ninjaColorPicker from './ColorPicker.vue';

export default {
    name: 'ButtonStyler',
    props: ['value'],
    data() {
        return {
            model: this.value,
        };
    },
    watch: {
        value() {
            this.$emit('input', this.model);
        },
    },
    components: {
        elLabel,
        ninjaColorPicker,
    },
};
</script>

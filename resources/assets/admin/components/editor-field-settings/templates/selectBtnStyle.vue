<template>
    <div class="button_styler">
        <el-form-item>
            <template #label>
                <ff-label :label="listItem.label" :helpText="listItem.help_text"></ff-label>
            </template>
            <el-select size="small" v-model="model">
                <el-option v-for="(item, key) in btnStyles" :key="key" :label="item.name" :value="key"></el-option>
            </el-select>
        </el-form-item>
        <div
            v-if="model === '' && editItem.settings.normal_styles"
            style="margin-bottom: 20px; margin-top: -10px"
            class="button_styler_customizer"
        >
            <el-tabs @tab-click="handleClick" type="border-card" v-model="activeName">
                <el-tab-pane :label="$t('Normal State')" name="normal_styles">
                    <button-styler v-model="editItem.settings.normal_styles"></button-styler>
                </el-tab-pane>
                <el-tab-pane :label="$t('Hover State')" name="hover_styles">
                    <button-styler v-model="editItem.settings.hover_styles"></button-styler>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>
<script>
import elLabel from '../../includes/el-label.vue';
import ButtonStyler from './helpers/ButtonStyler.vue';

export default {
    name: 'selectBtnStyle',
    props: ['listItem', 'editItem', 'modelValue'],
    components: {
        'ff-label': elLabel,
        ButtonStyler,
    },
    data() {
        return {
            model: this.modelValue,
            btnStyles: {
                default: {
                    name: 'Default',
                    backgroundColor: '#1a7efb',
                    color: '#ffffff',
                },
                no_style: {
                    name: 'No Style',
                    backgroundColor: '##1a7efb',
                    color: '#ffffff',
                },
                red: {
                    name: 'Red',
                    backgroundColor: '#F56C6C',
                    color: '#ffffff',
                },
                green: {
                    name: 'Green',
                    backgroundColor: '#67C23A',
                    color: '#ffffff',
                },
                orange: {
                    name: 'Orange',
                    backgroundColor: '#E6A23C',
                    color: '#ffffff',
                },
                gray: {
                    name: 'Gray',
                    backgroundColor: '#909399',
                    color: '#ffffff',
                },
                '': {
                    name: 'Custom',
                    backgroundColor: '',
                    color: '',
                },
            },
            activeName: 'normal_styles',
        };
    },
    watch: {
        model() {
            this.$emit('update:modelValue', this.model);
            this.editItem.settings.background_color = this.btnStyles[this.model].backgroundColor;
            this.editItem.settings.color = this.btnStyles[this.model].color;
        },
    },
    methods: {
        handleClick() {
            this.editItem.settings.current_state = this.activeName;
        },
    },
    created() {
        if (!this.editItem.settings.normal_styles) {
            this.editItem.settings.normal_styles = {
                backgroundColor: '#1a7efb',
                borderColor: '#1a7efb',
                color: '#ffffff',
                borderRadius: '',
                minWidth: '',
            };
        }
        if (!this.editItem.settings.hover_styles) {
            this.editItem.settings.hover_styles = {
                backgroundColor: '#ffffff',
                borderColor: '#1a7efb',
                color: '#1a7efb',
                borderRadius: '',
                minWidth: '',
            };
        }
        this.editItem.settings.current_state = this.activeName;
    },
    beforeUnmount() {
        this.editItem.settings.current_state = 'normal_styles';
    },
};
</script>

<template>
    <div class="button_styler">
        <el-form-item>
            <elLabel slot="label" :label="listItem.label" :helpText="listItem.help_text"></elLabel>
            <el-select class="el-fluid" v-model="model" placeholder="Select Date Format">
                <el-option
                    v-for="(item, key) in btnStyles"
                    :key="key"
                    :label="item.name"
                    :value="key">
                </el-option>
            </el-select>
        </el-form-item>
        <div v-if="model == '' && editItem.settings.normal_styles" style="margin-bottom: 20px" class="button_styler_customizer">
            <el-tabs  @tab-click="handleClick" type="border-card" v-model="activeName">
                <el-tab-pane label="Normal State" name="normal_styles">
                    <button-styler v-model="editItem.settings.normal_styles"></button-styler>
                </el-tab-pane>
                <el-tab-pane label="Hover State" name="hover_styles">
                    <button-styler v-model="editItem.settings.hover_styles"></button-styler>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>

</template>
<script>
import elLabel from '../../includes/el-label.vue'
import ButtonStyler from './helpers/ButtonStyler'

export default {
    name: 'selectBtnStyle',
    props: ['listItem', 'editItem', 'value'],
    components: {
        elLabel,
        ButtonStyler
    },
    data() {
        return {
            model: this.value,
            btnStyles: {
                default: {
                    name: 'Default',
                    backgroundColor: '#409EFF',
                    color: '#ffffff'
                },
                no_style: {
                    name: 'No Style',
                    backgroundColor: '#409EFF',
                    color: '#ffffff'
                },
                red: {
                    name: 'Red',
                    backgroundColor: '#F56C6C',
                    color: '#ffffff'
                },
                green: {
                    name: 'Green',
                    backgroundColor: '#67C23A',
                    color: '#ffffff'
                },
                orange: {
                    name: 'Orange',
                    backgroundColor: '#E6A23C',
                    color: '#ffffff'
                },
                gray: {
                    name: 'Gray',
                    backgroundColor: '#909399',
                    color: '#ffffff'
                },
                '': {
                    name: 'Custom',
                    backgroundColor: '',
                    color: ''
                }
            },
            activeName: 'normal_styles'
        }
    },
    watch: {
        model() {
            this.$emit('input', this.model);
            this.editItem.settings.background_color = this.btnStyles[this.model].backgroundColor;
            this.editItem.settings.color = this.btnStyles[this.model].color;
        }
    },
    methods: {
        handleClick() {
            this.editItem.settings.current_state = this.activeName;
        }
    },
    created() {
        if(!this.editItem.settings.normal_styles) {
            this.$set(this.editItem.settings, 'normal_styles', {
                'backgroundColor' : '#409EFF',
                'borderColor'     : '#409EFF',
                'color'           : '#ffffff',
                'borderRadius'    : '',
                'minWidth'        : ''
            });
        }
        if(!this.editItem.settings.hover_styles) {
            this.$set(this.editItem.settings, 'hover_styles', {
                'backgroundColor' : '#ffffff',
                'borderColor'     : '#409EFF',
                'color'           : '#409EFF',
                'borderRadius'    : '',
                'minWidth'        : ''
            });
        }
        this.editItem.settings.current_state = this.activeName;
    },
    beforeDestroy() {
        this.editItem.settings.current_state = 'normal_styles';
    }
}
</script>

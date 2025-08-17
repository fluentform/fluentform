<template>
    <el-dialog
        :model-value="visibility"
        @update:model-value="$emit('update:visibility', $event)"
        :show-close="false"
        width="60%"
    >
        <template #header>
            <h4>{{ $t('Design Your Button') }}</h4>
        </template>

        <div class="wpns_preview_mce mt-4">
            <el-row :gutter="20">
                <el-col :span="14">
                    <el-form label-position="top">
                        <el-col :span="12" v-for="(control, controlName) in controls" :key="controlName">
                            <el-form-item :label="control.label">
                                <template v-if="control.type === 'text' || control.type === 'url'">
                                    <el-input :type="control.type" v-model="control.value"></el-input>
                                </template>
                                <template v-else-if="control.type === 'color_picker'">
                                    <el-color-picker
                                        v-model="control.value"
                                        @active-change="(color) => { control.value = color}"
                                    ></el-color-picker>
                                </template>
                                <div v-else-if="control.type === 'slider'">
                                    <el-slider
                                        v-model="control.value"
                                        :min="control.min"
                                        :max="control.max"
                                    ></el-slider>
                                </div>
                                <template v-else-if="control.type === 'checkboxes'">
                                    <el-checkbox-group v-model="control.value" class="ff_checkbox_group_col_2">
                                        <el-checkbox
                                            v-for="(optionLabel, optionValue) in control.options"
                                            :key="optionValue"
                                            :label="optionValue">{{ optionLabel }}
                                        </el-checkbox>
                                    </el-checkbox-group>
                                </template>
                            </el-form-item>
                        </el-col>
                    </el-form>
                </el-col>
                <el-col :span="10">
                    <div class="wpns_button_preview">
                        <div class="preview_header">
                            {{ $t('Button Preview:') }}
                        </div>
                        <div class="preview_body">
                            <a @click="insert()" :style="style" href="#">{{ controls.button_text.value }}</a>
                        </div>
                    </div>
                </el-col>
            </el-row>
        </div>
        <template #footer class="dialog-footer mt-4">
            <el-button @click="close()" type="info" class="el-button--soft">{{ $t('Cancel') }}</el-button>
            <el-button type="primary" @click="insert()">{{ $t('Insert') }}</el-button>
        </template>
    </el-dialog>
</template>

<script>
export default {
    name: 'tinyButtonDesigner',
    emits: ['update:visibility'],
    props: ['visibility'],
    data() {
        return {
            controls: {
                button_text: {
                    type: 'text',
                    label: 'Button Text',
                    value: 'Click Here'
                },
                button_url: {
                    label: 'Button URL',
                    type: 'url',
                    value: ''
                },
                backgroundColor: {
                    label: 'Background Color',
                    type: 'color_picker',
                    value: '#0072ff'
                },
                textColor: {
                    label: 'Text Color',
                    type: 'color_picker',
                    value: '#ffffff'
                },
                borderRadius: {
                    label: 'Border Radius',
                    type: 'slider',
                    value: 5,
                    max: 50,
                    min: 0
                },
                fontSize: {
                    label: 'Font Size',
                    type: 'slider',
                    value: 16,
                    min: 8,
                    max: 40
                },
                fontStyle: {
                    label: 'Font Style',
                    type: 'checkboxes',
                    value: [],
                    options: {
                        bold: 'Bold',
                        italic: 'Italic',
                        underline: 'Underline'
                    }
                }
            },
            style: ''
        }
    },
    watch: {
        controls: {
            handler() {
                this.generateStyle();
            },
            deep: true
        }
    },
    methods: {
        close() {
            this.$emit('close');
        },
        insert() {
            if (!this.controls.button_url.value || !this.controls.button_text.value) {
                this.$notify.error('Button Text and URL is required');
                return;
            }
            const html = `<a  style="${this.style}" href="${this.controls.button_url.value}">${this.controls.button_text.value}</a>`;
            this.$emit('insert', html);
            this.close();
        },
        generateStyle() {
            const fontStyles = this.controls.fontStyle.value;
            const textDecoration = (fontStyles.indexOf('underline') === -1) ? 'none' : 'underline';
            const fontWeight = (fontStyles.indexOf('bold') === -1) ? 'normal' : 'bold';
            const fontStyle = (fontStyles.indexOf('italic') === -1) ? 'normal' : 'italic';
            this.style = `color:${this.controls.textColor.value};` +
                `background-color:${this.controls.backgroundColor.value};` +
                `font-size:${this.controls.fontSize.value}px;` +
                `border-radius:${this.controls.borderRadius.value}px;` +
                `text-decoration:${textDecoration};` +
                `font-weight:${fontWeight};` +
                `font-style:${fontStyle};` +
                'padding:0.8rem 1rem;border-color:#0072ff;';
        }
    },
    mounted() {
        this.generateStyle();
    }
}
</script>

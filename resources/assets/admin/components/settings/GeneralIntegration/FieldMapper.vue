<template>
    <div class="ff_field_manager">
        <el-form-item class="ff-form-item" :required="field.required">
            <template #label>
                {{ field.label }}
                <el-tooltip
                    v-if="field.tips"
                    class="item"
                    placement="bottom-start"
                    popper-class="ff_tooltip_wrap"
                >
                    <template #content>
                        <p v-html="field.tips"></p>
                    </template>
                    <i class="ff-icon ff-icon-info-filled text-primary"></i>
                </el-tooltip>
            </template>

            <template v-if="field.component === 'text'">
                <el-input :placeholder="field.placeholder" v-model="model" :readonly="field.readonly" />
            </template>

            <template v-else-if="field.component === 'wp-editor'">
                <wp-editor :height="150" :editor-shortcodes="htmlBodyEditorShortcodes" v-model="model"/>
            </template>

            <template v-else-if="field.component === 'value_text'">
                <filed-general :editorShortcodes="editorShortcodes" v-model="model"/>
            </template>

            <template v-else-if="field.component === 'value_textarea'">
                <filed-general field_type="textarea" :editorShortcodes="editorShortcodes" v-model="model"/>
            </template>

            <template v-else-if="field.component === 'number'">
                <el-input-number v-model="model" />
            </template>

            <template v-else-if="field.component === 'radio_choice'">
                <el-radio-group v-model="model">
                    <el-radio
                        v-for="(fieldLabel, fieldValue) in field.options"
                        :key="fieldValue"
                        :value="fieldValue"
                    >{{ fieldLabel }}
                    </el-radio>
                </el-radio-group>
            </template>

            <template v-else-if="field.component === 'dropdown'">
                <el-select v-model="model" :placeholder="field.placeholder">
                    <el-option
                        v-for="(item,itemValue) in field.options"
                        :key="itemValue"
                        :label="item"
                        :value="itemValue">
                    </el-option>
                </el-select>
            </template>

            <template v-else-if="field.component === 'dropdown-group'">
                <el-select v-model="model" :placeholder="field.placeholder">
                    <el-option-group
                        v-for="(group,groupLabel) in field.options"
                        :key="groupLabel"
                        :label="groupLabel">
                        <el-option
                            v-for="(item,itemValue) in group"
                            :key="itemValue"
                            :label="item"
                            :value="itemValue">
                        </el-option>
                    </el-option-group>
                </el-select>
            </template>

            <template v-else-if="field.component === 'color_picker'">
                <el-color-picker v-model="model"/>
            </template>

            <template v-else-if="field.component === 'checkbox-single'">
                <el-checkbox v-model="model">
                    {{ field.checkbox_label }}
                </el-checkbox>
            </template>

            <template v-else-if="field.component === 'checkbox-multiple'">
                <el-checkbox-group v-model="model">
                    <el-checkbox
                        v-for="(fieldLabel, fieldValue) in field.options"
                        :key="fieldValue"
                        :value="fieldValue"
                    >{{ fieldLabel }}
                    </el-checkbox>
                </el-checkbox-group>
            </template>

            <template v-else-if="field.component === 'image_widget'">
                <photo-uploader design_mode="horizontal" enable_clear="yes" v-model="model" />
            </template>

            <template v-else>
                <p>Invalid Vue Element</p>
                <pre>{{ field }}</pre>
            </template>

            <p class="mt-2 text-note" v-if="field.inline_tip" v-html="field.inline_tip"></p>
            <error-view :field="field.key" :errors="errors"></error-view>
        </el-form-item>
    </div>
</template>

<script type="text/babel">
import ErrorView from '@/common/errorView.vue';
import wpEditor from '@/common/_wp_editor.vue';
import FiledGeneral from './_FieldGeneral.vue';
import PhotoUploader from "@/common/PhotoUploader.vue";

export default {
    name: 'FieldManager',
    props: ['field', 'modelValue', 'errors', 'editorShortcodes'],
    emits: ['update:modelValue'],
    components: {
        ErrorView,
        wpEditor,
        FiledGeneral,
        PhotoUploader
    },
    data() {
        return {
            model: this.modelValue
        }
    },
    watch: {
        model(newValue) {
            this.$emit('update:modelValue', newValue);
        }
    },
    computed: {
        htmlBodyEditorShortcodes() {
            const freshCopy = _ff.cloneDeep(this.editorShortcodes);
            if (freshCopy && freshCopy.length) {
                freshCopy[0].shortcodes = {
                    ...freshCopy[0].shortcodes,
                    '{all_data}': 'All Data',
                    '{all_data_without_hidden_fields}': 'All Data Without Hidden Fields'
                };
            }
            return freshCopy;
        }
    },
}
</script>

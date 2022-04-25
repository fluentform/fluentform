<template>
    <div class="ff_field_manager">
        <el-form-item :required="field.required">
            <template slot="label">
                {{field.label}}
                <el-tooltip
                        v-if="field.tips"
                        class="item"
                        effect="light"
                        placement="bottom-start"
                >
                    <div slot="content">
                        <p v-html="field.tips"></p>
                    </div>
                    <i class="el-icon-info el-text-info"></i>
                </el-tooltip>
            </template>

            <template v-if="field.component == 'text'" >
                <el-input
                        size="small"
                        :placeholder="field.placeholder"
                        v-model="model"
                ></el-input>
            </template>

            <template v-else-if="field.component == 'wp-editor'" >
                <wp-editor :height="150" :editor-shortcodes="htmlBodyeditorShortcodes" v-model="model" />
            </template>

            <template v-else-if="field.component == 'value_text'">
                <filed-general
                        :editorShortcodes="editorShortcodes"
                        v-model="model"
                />
            </template>

            <template v-else-if="field.component == 'value_textarea'">
                <filed-general
                        field_type="textarea"
                        :editorShortcodes="editorShortcodes"
                        v-model="model"
                />
            </template>

            <template v-else-if="field.component == 'number'">
                <el-input-number v-model="model"></el-input-number>
            </template>

            <template v-else-if="field.component == 'radio_choice'">
                <el-radio-group v-model="model">
                    <el-radio
                            v-for="(fieldLabel, fieldValue) in field.options"
                            :key="fieldValue"
                            :label="fieldValue"
                    >{{fieldLabel}}</el-radio>
                </el-radio-group>
            </template>

            <template v-else-if="field.component == 'dropdown'">
                <el-select v-model="model" :placeholder="field.placeholder">
                    <el-option
                            v-for="(item,itemValue) in field.options"
                            :key="itemValue"
                            :label="item"
                            :value="itemValue">
                    </el-option>
                </el-select>
            </template>

            <template v-else-if="field.component == 'dropdown-group'">
                <el-select v-model="model" :placeholder="field.placeholder">
                    <el-option-group v-for="(group,groupLabel) in field.options"
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

            <template v-else-if="field.component == 'color_picker'">
                <el-color-picker v-model="model" />
            </template>

            <template v-else-if="field.component == 'checkbox-single'">
                <el-checkbox v-model="model">
                    {{field.checkbox_label}}
                </el-checkbox>
            </template>

            <template v-else-if="field.component == 'checkbox-multiple'">
                <el-checkbox-group v-model="model">
                    <el-checkbox
                            v-for="(fieldLabel, fieldValue) in field.options"
                            :key="fieldValue"
                            :label="fieldValue"
                    >{{fieldLabel}}</el-checkbox>
                </el-checkbox-group>
            </template>

            <template v-else-if="field.component == 'image_widget'">
                <photo-uploader design_mode="horizontal" enable_clear="yes" v-model="model" />
            </template>
            <template v-else>
                <p>Invalid Vue Element</p>
                <pre>{{field}}</pre>
            </template>

            <p v-if="field.inline_tip" v-html="field.inline_tip"></p>
            <error-view :field="field.key" :errors="errors"></error-view>
        </el-form-item>
    </div>
</template>

<script type="text/babel">
    import ErrorView from '../../../../common/errorView';
    import wpEditor from '../../../../common/_wp_editor.vue';
    import FiledGeneral from './_FieldGeneral';
    import PhotoUploader from "../../../../common/PhotoUploader";

    export default {
        name: 'FieldManager',
        props: ['field', 'value', 'errors', 'editorShortcodes'],
        components: {
            ErrorView,
            wpEditor,
            FiledGeneral,
            PhotoUploader
        },
        data() {
            return {
                model: this.value
            }
        },
        watch: {
            model() {
                this.$emit('input', this.model);
            }
        },
        computed: {
            htmlBodyeditorShortcodes() {
                const freshCopy = _ff.cloneDeep(this.editorShortcodes);
                if (freshCopy && freshCopy.length) {
                    freshCopy[0].shortcodes = {
                        ...freshCopy[0].shortcodes,
                        '{all_data}': 'All Data',
                        '{all_data_without_hidden_fields}' : 'All Data Without Hidden Fields'
                    };
                }
                return freshCopy;
            }
        }
    }
</script>

<template>
    <div v-loading="loading" class="styler_wrapper">
        <el-button @click="saveSettings()" type="primary" size="mini" class="ffs_save_settings">{{ $t('Save Settings') }}
        </el-button>
        <el-tabs type="border-card">
            <el-tab-pane :label="$t('General')">
                <div class="ff_form_style_selector">
                    <div class="ff_form_style_selector_head">
                        <div>{{ $t('Form Style Template') }}</div>
                        <div>
                            <el-button v-if="preset_name == 'ffs_custom'" @click="resetStyle()" type="default" size="mini">
                                {{ $t('Reset') }}
                            </el-button>
                            <el-button v-if="preset_name == 'ffs_custom'" @click="exportStyle()" type="info" size="mini">
                                {{ $t('Export') }}
                            </el-button>
                        </div>
                    </div>

                    <el-select @change="changePreset" :placeholder="$t('Select Preset Styles')" v-model="preset_name">
                        <el-option v-for="(preset,presetKey) in presets" :key="presetKey" :value="presetKey"
                                   :label="preset.label">{{ preset.label }}
                        </el-option>
                    </el-select>
                    <div class="ff_form_style_selector_footer">
                        <el-checkbox v-if="maybeEnableCustomization && preset_name != 'ffs_custom' "
                                     v-model="customize_preset">
                            {{ $t('Customize Selected Preset') }}
                        </el-checkbox>
                    </div>


                </div>

                <template v-if="showCustomizer || customize_preset">
                    <el-collapse v-model="activeName" accordion>
                        <el-collapse-item :title="$t('Label Styles')" name="label_styles">
                            <style-editor :editor_styles="label_styles"></style-editor>
                        </el-collapse-item>
                        <el-collapse-item :title="$t('Input & Textarea')" name="input_styles">
                            <style-editor :editor_styles="input_styles"></style-editor>
                        </el-collapse-item>
                        <el-collapse-item :title="$t('Placeholder')" name="placeholder_styles">
                            <style-editor :editor_styles="placeholder_styles"></style-editor>
                        </el-collapse-item>
                        <el-collapse-item v-if="has_section_break" :title="$t('Custom Html & Section Break Style')"  name="sectionbreak_styles">
                            <style-editor :editor_styles="sectionbreak_styles"></style-editor>
                        </el-collapse-item>
                        <el-collapse-item v-if="has_tabular_grid" :title="$t('Grid Table Style')" name="gridtable_style">
                            <style-editor :editor_styles="gridtable_style"></style-editor>
                        </el-collapse-item>
                        <el-collapse-item :title="$t('Radio & Checkbox Style')" name="radio_checkbox_style">
                            <style-editor :editor_styles="radio_checkbox_style"></style-editor>
                        </el-collapse-item>

                        <el-collapse-item v-if="has_range_slider" :title="$t('Range Slider Style')" name="range_slider_style">
                            <style-editor :editor_styles="range_slider_style"></style-editor>
                        </el-collapse-item>

                        <el-collapse-item v-if="has_net_promoter" :title="$t('Net Promoter Style')"name="net_promoter_style">
                            <style-editor :editor_styles="net_promoter_style"></style-editor>
                        </el-collapse-item>

                        <el-collapse-item v-if="has_payment_summary" :title="$t('Payment Summary Style')" name="payment_summary_style">
                            <style-editor :editor_styles="payment_summary_style"></style-editor>
                        </el-collapse-item>

                        <el-collapse-item v-if="has_payment_coupon" :title="$t('Payment Coupon Style')" name="payment_coupon_style">
                            <style-editor :editor_styles="payment_coupon_style"></style-editor>
                        </el-collapse-item>

                        <template v-if="is_multipage">

                            <el-collapse-item :title="$t('Multi Page - Header Style')" name="step_header_style">
                                <style-editor :editor_styles="step_header_style"></style-editor>
                            </el-collapse-item>

                            <el-collapse-item :title="$t('Multi Page - Next Button Style')" name="next_button_style">
                                <style-editor :editor_styles="next_button_style"></style-editor>
                            </el-collapse-item>

                            <el-collapse-item :title="$t('Multi Page - Previous Button Style')" name="prev_button_style">
                                <style-editor :editor_styles="prev_button_style"></style-editor>
                            </el-collapse-item>
                        </template>

	                    <el-collapse-item v-if="has_image_or_file_button" :title="$t('Image or File Button Style')" name="image_or_file_button_style">
		                    <style-editor :editor_styles="image_or_file_button_style"></style-editor>
	                    </el-collapse-item>

                        <el-collapse-item :title="$t('Submit Button Style')" name="submit_button_style">
                            <style-editor :editor_styles="submit_button_style"></style-editor>
                        </el-collapse-item>
                    </el-collapse>
                </template>

            </el-tab-pane>
            <el-tab-pane :label="$t('Misc')">
                <el-collapse v-model="activeName" accordion>
                    <el-collapse-item :title="$t('Container Styles')" name="container_styles">
                        <style-editor :editor_styles="container_styles"></style-editor>
                    </el-collapse-item>
                    <el-collapse-item :title="$t('Asterisk Styles')" name="asterisk_styles">
                        <style-editor :editor_styles="asterisk_styles"></style-editor>
                    </el-collapse-item>
                    <el-collapse-item :title="$t('Inline Error Message Styles')" name="help_msg_style">
                        <style-editor :editor_styles="inline_error_msg_style"></style-editor>
                    </el-collapse-item>
                    <el-collapse-item :title="$t('After Submit Success Message Styles')" name="success_msg_style">
                        <style-editor :editor_styles="success_msg_style"></style-editor>
                    </el-collapse-item>
                    <el-collapse-item :title="$t('After Submit Error Message Styles')" name="error_msg_style">
                        <style-editor :editor_styles="error_msg_style"></style-editor>
                    </el-collapse-item>
                </el-collapse>
            </el-tab-pane>
            <el-tab-pane :label="$t('Import')">
                <h4>{{ $t('Import Styles From Another Form') }}</h4>
                <hr />
                <div class="ff_form_style_selector">
                    <label>{{ $t('Select an Existing Form to Apply Style') }}</label>
                    <el-select
                        @change="importStyle()"
                        v-model="selected_import"
                        value-key="form_id"
                        :placeholder="$t('Select Form To Apply')"
                    >
                        <el-option-group
                            key="Custom_Styles"
                            :label="$t('Custom Styles')">
                            <el-option
                                v-for="item in existing_form_styles.custom"
                                :key="item.form_id"
                                :label="item.form_title"
                                :value="{form_id: item.form_id, type: 'custom'}">
                            </el-option>
                        </el-option-group>
                        <el-option-group
                            key="general_styles"
                            :label="$t('General Styles')">
                            <el-option
                                v-for="item in existing_form_styles.predefined"
                                :key="item.form_id"
                                :label="item.form_title"
                                :value="{form_id: item.form_id, type: 'predefined'}">
                            </el-option>
                        </el-option-group>
                    </el-select>
                    <div class="overline-title-sep">
                        <span>or</span>
                    </div><!-- .overline-title -->
                    <div class="ff_form_style_import_wrap">
                        <label>{{ $t('Import Fluent Form Style') }}</label>
                        <div class="ff_form_style_import">
                            <input type="file" id="fileUpload" class="file-input" @click="clear">
                            <el-button type="primary" icon="el-icon-success" @click="importStyleJson" :loading="loading">
                                {{ $t('Import') }}
                            </el-button>
                        </div>
                    </div><!-- ff_form_style_import_wrap -->
                </div>
            </el-tab-pane>
        </el-tabs>
        <div id="ff_container_styles"></div>
        <div id="ff_label_styles"></div>
        <div id="ff_input_styles"></div>
        <div id="ff_placeholder_styles"></div>
        <div id="ff_sectionbreak_styles"></div>
        <div id="ff_gridtable_style"></div>
        <div id="ff_radio_checkbox"></div>
        <div id="ff_submit_button_style"></div>
        <div id="ff_asterisk_styles"></div>
        <div id="ff_inline_error_msg_style"></div>
        <div id="ff_success_msg_styles"></div>
        <div id="ff_error_msg_styles"></div>
        <div id="ff_next_button_style"></div>
        <div id="ff_prev_button_style"></div>
        <div id="ff_step_header_style"></div>
        <div id="ff_range_slider_style"></div>
        <div id="ff_net_promoter_score"></div>
        <div id="ff_payment_summary"></div>
        <div id="ff_payment_coupon"></div>
        <div id="image_or_file_button_style"></div>
    </div>
</template>
<script type="text/babel">
    import initialStyle from './initialStyle.js';
    import each from "lodash/each";

    export default {
        name: 'form_styler',
        mixins: [initialStyle],
        methods: {
            saveSettings() {
                this.loading = true;

                let form_styles = this.generateStyle();
                let stylerName = (this.customize_preset == true || this.preset_name == 'ffs_custom') ? 'ffs_custom' : this.preset_name;
                FluentFormsGlobal.$post({
                    action: 'fluentform_save_form_styler',
                    form_id: this.form_vars.form_id,
                    style_name: stylerName,
                    form_styles: JSON.stringify(form_styles)
                })
                    .then(response => {
                        this.$notify.success(response.data.message);

                        this.preset_name = stylerName;
                        this.saved_custom_styles = form_styles;
                    })
                    .fail(error => {

                    })
                    .always(() => {
                        this.loading = false;
                    })
            },
            exportStyle() {
                let form_styles = this.generateStyle();

                FluentFormsGlobal.$post({
                    action: 'fluentform_save_form_styler',
                    form_id: this.form_vars.form_id,
                    style_name: this.preset_name,
                    form_styles: form_styles
                })
                    .then(response => {
                        if (response.success == true){
                            let data = {
                                format: 'json',
                                form_id : this.form_vars.form_id,
                                action: 'fluentform_export_form_style',
                                style_name: this.preset_name,
                                nonce: window.fluent_forms_global_var.fluent_forms_admin_nonce,
                            };
                            location.href = window.fluent_forms_global_var.ajaxurl + '?' + jQuery.param(data);
                        }

                    })
                    .fail(error => {

                    })
                    .always(() => {
                    })

            },
            importStyle() {
                const styles = this.existing_form_styles[this.selected_import.type][this.selected_import.form_id].styles;
                const type = this.existing_form_styles[this.selected_import.type][this.selected_import.form_id].type;
                each(styles, (styleSettings, styleKey) => {
                    this[styleKey] = styleSettings;
                });
                this.preset_name = type;
            },
            handleElmSelection(e) {
                const type = e.detail.type || '';
                if (type == 'label') {
                    this.activeName = 'label_styles';
                } else if (type == 'input') {
                    this.activeName = 'input_styles';
                } else if (type == 'checkable') {
                    this.activeName = 'radio_checkbox_style';
                } else if (type == 'submitBtn') {
                    this.activeName = 'submit_button_style';
                } else if (type == 'sectionBrk') {
                    this.activeName = 'sectionbreak_styles';
                }
            },
            importStyleJson() {
                this.loading = true;
                var file = jQuery('#fileUpload')[0].files[0];

                if (!file) {
                    this.loading = false;
                    return;
                }

                let data = new FormData();
                data.append('form_id', this.form_vars.form_id);
                data.append('format', 'json');
                data.append('file', file);
                data.append('action', 'fluentform_import_form_style');
                data.append('fluent_forms_admin_nonce', window.fluent_forms_global_var.fluent_forms_admin_nonce);

                jQuery
                    .ajax({
                        url: window.fluent_forms_global_var.ajaxurl,
                        type: 'POST',
                        data: data,
                        contentType: false,
                        processData: false,
                        success: (response) => {
                            if (response.success == true){
                                location.reload();
                            }

                            this.loading = false;

                        },
                        error: (error) => {
                            this.loading = false;
                            this.clear();
                            const errorMessage = error?.message || error?.responseJSON?.message;
                            errorMessage && this.$fail(errorMessage);
                        }
                    });
            },
            clear() {
                this.loading = false;
                jQuery('#fileUpload').val('');
            },
        }
    }
</script>

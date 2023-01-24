<template>
    <div class="ff_export_forms">
        <div class="ff_card">
            <div class="ff_card_head">
                <h5 class="title">{{ $t('Export Forms') }}</h5>
                <p class="text" style="max-width: 660px;">{{
                    $t('Select the forms you would like to export. When you click the download button below, Fluent Forms will create a JSON file for you to save to your computer. Once you have saved the downloaded file, you can use the Import tool to import the forms.')}}
                </p>
            </div><!-- ff_card_head -->
            <div class="ff_card_body">
                <el-form>
                    <div class="ff_block_item">
                        <div class="ff_block_title_group mb-3">
                            <h6 class="ff_block_title">{{ $t('Select Forms') }}</h6>
                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_popper">
                                <div slot="content">
                                    <p>{{ $t('Select the forms you would like to export.') }}</p>
                                </div>
                                <i class="ff-icon ff-icon-info-filled ml-1 text-primary"></i>
                            </el-tooltip>
                        </div><!-- .ff_block_title_group -->
                        <div class="ff_block_item_body">
                            <el-select class="ff_input_width" v-model="selected" multiple filterable>
                                <el-option 
                                    v-for="(form, index) in forms" :key="index"
                                    :label="'#'+ form.id +' - ' +form.title" 
                                    :value="form.id"
                                ></el-option>
                            </el-select>
                        </div><!-- .ff_block_item_body -->
                    </div><!-- .ff_block_item -->
                    <div class="ff_block_item">
                        <el-button type="primary" icon="el-icon-success" @click="exportForms">
                            {{ $t('Export Forms') }}
                        </el-button>
                    </div><!-- .ff_block_item -->
                </el-form>
            </div><!-- .ff_card_body -->
        </div><!-- .ff_card -->
    </div>
</template>

<script>
    export default {
        name: "ExportForms",
        props: ['app'],
        data() {
            return {
                forms: this.app.forms,
                selected: [],
            }
        },
        methods: {
            exportForms() {
                if (this.selected.length) {
                    const data = {
                        action: 'fluentform-export-forms',
                        forms: this.selected,
                        format: 'json',
                        fluent_forms_admin_nonce: window.fluent_forms_global_var.fluent_forms_admin_nonce
                    };
                    location.href = ajaxurl + '?' + jQuery.param(data);
                }
            }
        }
    }
</script>

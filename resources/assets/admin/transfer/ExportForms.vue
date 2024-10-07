<template>
    <div class="ff_export_forms">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Export Forms') }}</h5>
                <p class="text" style="max-width: 700px;">
                    {{
                        $t('Select the forms you would like to export. When you click the download button below, Fluent Forms will create a JSON file for you to save to your computer. Once you\'ve saved the downloaded file, you can use the Import tool to import the forms.')
                    }}
                </p>
            </card-head>
            <card-body>
                <el-form label-position="top">
                    <!--Select Forms-->
                    <el-form-item class="ff-form-item">
                        <template #label>
                            {{ $t('Select Forms') }}

                            <el-tooltip class="item" placement="bottom-start" popper-class="ff_tooltip_wrap">
                                <template #content>
                                    <p>
                                        {{ $t('Select the forms you would like to export.') }}
                                    </p>
                                </template>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <el-select class="ff_input_width" v-model="selected" multiple filterable>
                            <el-option v-for="(form, index) in forms" :key="index"
                                    :label="'#'+ form.id +' - ' +form.title" :value="form.id"
                            ></el-option>
                        </el-select>
                    </el-form-item>

                    <el-button type="primary" icon="el-icon-success" @click="exportForms">
                        {{ $t('Export Forms') }}
                    </el-button>
                </el-form>
            </card-body>
        </card>
    </div>
</template>

<script>
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';

    export default {
        name: "ExportForms",
        props: ['app'],
        components: {
            Card, 
            CardHead, 
            CardBody 
        },
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

<template>
    <div class="chained-select-settings">
        <el-form-item>
            <div slot="label">
                {{ listItem.label }}
                <el-tooltip popper-class="ff_tooltip_wrap" :content="listItem.help_text" placement="top">
                    <i class="tooltip-icon el-icon-info"></i>
                </el-tooltip>
            </div>
            <el-radio-group v-model="dataSourceType">
              <el-radio label="file">{{ $t('File Upload') }}</el-radio>
              <el-radio label="url">{{ $t('Remote URL') }}</el-radio>
            </el-radio-group>

            <div class="uploader" v-if="dataSourceType === 'file'">
                <el-upload
                    drag
                    :data="dataSourceInfo"
                    accept=".csv"
                    class="dragndrop"
                    :limit="1"
                    :multiple="false"
                    :action="uploadAction"
                    :file-list="fileList"
                    :on-success="onSuccess"
                    :on-remove="onRemove"
                >
                    <i class="el-icon-upload"></i>
                    <div class="el-upload__text" v-html="$t('Drop file here or %sclick to upload%s', '<em>', '</em>')"></div>
                </el-upload>
            </div>

            <div v-else style="margin-top: 10px;">
                <el-input class="chain-select-upload-button" :placeholder="$t('Please input a remote csv url...')" v-model="dataSourceUrl">
                    <template slot="append">
                        <el-button
                            size="medium"
                            type="primary"
                            icon="el-icon-download"
                            @click="fetchRemoteFile"
                            :loading="fetching"
                        >{{ $t('Fetch') }}
                        </el-button>
                    </template>
                </el-input>

                <div v-if="urlFileList.length > 0" style="margin-top: 15px;">
                    <div class="el-upload-list el-upload-list--text">
                        <div class="el-upload-list__item is-success">
                            <a class="el-upload-list__item-name" :href="urlFileList[0].url" target="_blank">
                                <i class="el-icon-document"></i>
                                {{ urlFileList[0].name }}
                            </a>
                            <label class="el-upload-list__item-status-label">
                                <i class="el-icon-upload-success el-icon-circle-check"></i>
                            </label>
                            <i class="el-icon-close" @click="onRemove"></i>
                        </div>
                    </div>
                </div>

                <el-button
                    v-if="dataSourceUrl && urlFileList.length > 0"
                    type="text"
                    class="pull-right btn-danger"
                    style="margin-top: 10px;"
                    :loading="removing"
                    @click="deleteDataSource"
                >{{ $t('Clear Data Source') }}
                </el-button>
            </div>
        </el-form-item>
        <p>
            <small><a :href="sample_csv_url" target="_blank">{{ $t('Download Sample CSV') }}</a></small>
        </p>
    </div>
</template>

<script>
    export default {
        name: 'chainSelectDataSource',
        props: ['listItem', 'value'],
        data() {
            return {
                sample_csv_url: window.FluentFormApp.plugin_public_url + 'img/sample.csv',
                editItem: null,
                fetching: false,
                removing: false,
                uploadAction: `${window.ajaxurl}?action=fluentform_chained_select_file_upload`
            };
        },
        methods: {
            fetchRemoteFile() {
                if (!this.dataSourceUrl) return;

                this.fetching = true;
                
                FluentFormsGlobal.$post({
                    action: 'fluentform_chained_select_file_upload',
                    ...this.dataSourceInfo,
                    url: this.dataSourceUrl,
                }).then(response => {
                    if (response.data.headers) {
                        this.editItem.settings.data_source = response.data;
                        this.$notify.success({
                            offset: 32,
                            title: 'Success',
                            message: this.$t('CSV file fetched and loaded successfully.')
                        });
                    }
                }).fail(response => {
                    this.$notify.error({
                        offset: 32,
                        title: 'Error',
                        message: response.responseJSON.data.message
                    });
                }).always(() => {
                    this.fetching = false;
                });
            },
            onSuccess(response, file, fileList) {
                this.editItem.settings.data_source = response.data;
            },
            onRemove(file, fileList) {
                this.deleteDataSource();
            },
            getFileNameFromUrl(url) {
                if (!url) return '';
                try {
                    const urlObj = new URL(url);
                    const pathname = urlObj.pathname;
                    const fileName = pathname.split('/').pop();
                    if (fileName && fileName.includes('.')) {
                        return fileName;
                    }
                    if (urlObj.searchParams.get('output') === 'csv' || urlObj.searchParams.get('format') === 'csv') {
                        return 'data.csv';
                    }
                    return 'remote-file.csv';
                } catch (e) {
                    return 'remote-file.csv';
                }
            },
            deleteDataSource() {
                if (this.dataSourceType === 'url' && !this.dataSourceUrl) return;

                this.removing = true;

                const data = Object.assign(
                    {}, 
                    this.dataSourceInfo, 
                    {action: 'fluentform_chained_select_remove_ds'}
                )

                FluentFormsGlobal.$post(data).then(response => {
                    this.editItem.settings.data_source.url = '';
                    this.editItem.settings.data_source.name = '';
                    this.editItem.settings.data_source.meta_key = null;
                    this.editItem.settings.data_source.headers = response.data.headers;
                    this.dataSourceUrl = '';
                    this.$notify.success({
                        offset: 32,
                        title: 'Success',
                        message: response.data.message
                    });
                }).fail(response => {
                    // ...
                }).always(() => {
                    this.removing = false;
                });
            }
        },
        computed: {
            dataSourceInfo() {
                const formId = window.FluentFormApp?.form_id || window.FluentFormApp.form.id;
                return {
                    type: this.dataSourceType,
                    meta_key: this.fieldMetaKey,
                    name: this.editItem.attributes.name,
                    form_id: formId,
                    fluent_forms_admin_nonce: window.fluent_forms_global_var?.fluent_forms_admin_nonce
                };
            },
            fileList() {
                let fileList = [];

                if (this.editItem.settings.data_source.name) {
                    fileList = [{
                        url: this.editItem.settings.data_source.url,
                        name: this.editItem.settings.data_source.name
                    }];
                }

                return fileList;
            },
            urlFileList() {
                let fileList = [];

                if (this.dataSourceType === 'url' && this.dataSourceUrl) {
                    const fileName = this.getFileNameFromUrl(this.dataSourceUrl);
                    fileList = [{
                        url: this.dataSourceUrl,
                        name: fileName || this.$t('CSV File'),
                        status: 'success'
                    }];
                }

                return fileList;
            },
            dataSourceType: {
                get() {
                    return this.editItem.settings.data_source.type;
                },
                set(type) {
                    this.editItem.settings.data_source.type = type;
                }
            },
            dataSourceUrl: {
                get() {
                    return this.editItem.settings.data_source.url;
                },
                set(url) {
                    this.editItem.settings.data_source.url = url;
                }
            },
            fieldMetaKey: {
                get() {
                    return `chained_select_${this.editItem.attributes.name}`;
                },
                set(val) {
                    // ...
                }
            }
        },
        created() {
            this.editItem = this.$attrs.editItem;
        }
    };
</script>

<template>
    <div class="fluentform-wrapper">
        <div class="entry_header">
            <router-link class="pull-right" :to="{ name: 'form-entries' }">
                <el-button icon="el-icon-back" size="small">Back to Entries</el-button>
            </router-link>

            <el-button class="pull-right" size="small" @click="changeEntry('+')" :disabled="!nextId">
                Next <i class="el-icon-arrow-right"/>
            </el-button>
            <el-button class="pull-right" size="small" @click="changeEntry('-')" :disabled="!prevId">
                <i class="el-icon-arrow-left"/> Previous
            </el-button>

            <h3>Entry Details #{{entry.serial_number}}</h3>
        </div>

        <el-row v-loading="loading" :gutter="20" style="min-height: 260px;">
            <el-col :xs="24" :sm="18" :md="18" :lg="18">
                <div class="entry_info_box entry_input_data">
                    <div class="entry_info_header">
                        <div class="info_box_header">
                            <span @click="view_as_json = !view_as_json"
                                  class="dashicons dashicons-editor-code json_action"></span>
                            Form Entry Data
                        </div>
                        <div class="info_box_header_actions">
                            <span @click="changeFavorite()"
                                  title="Remove from Favorites" v-if="entry.is_favourite != '0' || entry.is_favourite == '1'"
                                  class="el-icon-star-on star_big action_button"></span>
                            <span @click="changeFavorite()"
                                  title="Mark as Favorite" v-else
                                  class="el-icon-star-off star_big action_button"></span>

                            <el-checkbox true-label="yes" false-label="no" v-model="show_empty">Show empty fields</el-checkbox>
                        </div>
                    </div>
                    <div v-if="entry.serial_number" class="entry_info_body">
                        <div v-show="!view_as_json" class="wpf_entry_details">
                            <div v-for="(label, label_index) in labels"
                                 :key="label_index"
                                 v-show="show_empty == 'yes' || entry.user_inputs[label_index]"
                                 class="wpf_each_entry">

                                <div class="wpf_entry_label">
                                    {{label}}
                                </div>

                                <template v-if="formFields[label_index]['element'] == 'input_email'">
                                    <div v-show="entry.user_inputs[label_index]" class="wpf_entry_value">
                                        <a :href="'mailto:'+entry.user_inputs[label_index]">{{
                                            entry.user_inputs[label_index] }}</a>
                                    </div>
                                </template>
                                <template v-else-if="formFields[label_index]['element'] == 'input_file'">
                                    <entry-file-list :itemKey="label_index" :dataItems="original_data"></entry-file-list>
                                </template>
                                <template
                                    v-else-if="['input_image', 'signature'].indexOf(formFields[label_index]['element']) != -1">
                                    <entry-image-list :itemKey="label_index" :dataItems="original_data"></entry-image-list>
                                </template>
                                <template
                                    v-else-if="['input_checkbox', 'select'].indexOf(formFields[label_index]['element']) != -1">
                                    <div class="wpf_entry_value" v-html="maybeExtractCommaArrayInfo(entry.user_inputs[label_index], formFields[label_index]['raw'])"></div>
                                </template>
                                <template v-else>
                                    <div class="wpf_entry_value" v-html="entry.user_inputs[label_index]"></div>
                                </template>
                            </div>
                        </div>
                        <div v-show="view_as_json">
                            <textarea class="show_code" readonly>{{ prettifyJson(entry) }}</textarea>
                        </div>
                    </div>
                </div>

                <payment-summary @reload_payments="getEntry()" v-if="order_data" :submission="entry" :order_data="order_data"></payment-summary>

                <entry_notes :entry_id="entry_id" :form_id="form_id"/>

                <submission_logs  :entry_id="entry_id" />

                <email-resend :form_id="form_id" :entry_id="entry_id" />
                <manual-entry-actions :form_id="form_id" :entry_id="entry_id" />

            </el-col>
            <el-col :xs="24" :sm="6" :md="6" :lg="6">
                <div class="entry_info_box postbox">
                    <div class="entry_info_header">
                        <b>Submission Info</b>
                    </div>
                    <div class="entry_info_body narrow_items">
                        <div class="wpf_entry_details">
                            <div class="wpf_each_entry">
                                <p>Entity ID: #{{entry.id}}</p>
                            </div>
                            <div class="wpf_each_entry">
                                <p>User IP : <a target="_blank" rel="noopener" :href="'https://ipinfo.io/'+entry.ip">{{
                                    entry.ip }}</a></p>
                            </div>
                            <div class="wpf_each_entry">
                                <p style="word-break: break-all;">Source URL : <a target="_blank" :href="entry.source_url">{{ entry.source_url }}</a>
                                </p>
                            </div>
                            <div class="wpf_each_entry">
                                <p>Browser : {{ entry.browser }}</p>
                            </div>
                            <div class="wpf_each_entry">
                                <p>Device : {{ entry.device }}</p>
                            </div>
                            <div class="wpf_each_entry">

                                <p v-if="entry.user">User : <a target="_blank" rel="noopener"
                                                               :href="entry.user.permalink">{{ entry.user.name }}</a>
                                </p>
                                <p v-else>User : Guest</p>
                            </div>
                            <div class="wpf_each_entry">
                                <p>Status : {{ entry_statuses[entry.status] || entry.status }}</p>
                            </div>
                            <div class="wpf_each_entry">
                                <p>Submitted On : {{ entry.created_at }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="entry-footer">
                        <el-button @click="editTable = true" size="mini" type="primary" icon="el-icon-edit"> Edit
                        </el-button>

                        <el-dropdown @command="handleStatusChange" type="info">
                            <el-button size="mini" type="info">
                                Change status to <i class="el-icon-arrow-down el-icon--right"></i>
                            </el-button>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item v-for="(statusName, statusKey) in entry_statuses" :command="statusKey" :key="statusKey">{{statusName}}</el-dropdown-item>
                            </el-dropdown-menu>
                        </el-dropdown>
                    </div>
                </div>
                <div v-for="(widget, widgetKey) in widgets" class="entry_info_box postbox">
                    <div class="entry_info_header">
                        <b>{{widget.title}}</b>
                    </div>
                    <div class="entry_info_body narrow_items">
                        <div v-html="widget.content"></div>
                    </div>
                </div>

            </el-col>
        </el-row>

        <el-dialog
            title="Edit Entry Data"
            top="42px"
            :append-to-body="true"
            :visible.sync="editTable"
            width="60%">
            <edit-entry @reloadData="getEntry()" :form_id="form_id" :entry_id="entry_id" @close="editTable = false"
                        v-if="editTable" :labels="labels" :submission="entry"
                        :fields="formFields"></edit-entry>
        </el-dialog>
    </div>
</template>

<script type="text/babel">
    import remove from '../components/confirmRemove'
    import entry_notes from './EntryNotes'
    import submission_logs from './SubmissionLogs'
    import editEntry from './EditEntry'
    import each from 'lodash/each';
    import EntryFileList from './Helpers/FilesList.vue';
    import EntryImageList from './Helpers/ImageList.vue';
    import EmailResend from './Helpers/_ResentEmailNotification'
    import ManualEntryActions from './Helpers/_ManualEntryActions'
    import PaymentSummary from './Payments/PaymentSummary'

    export default {
        name: 'Entry',
        props: ['has_pdf'],
        components: {
            remove: remove,
            entry_notes: entry_notes,
            submission_logs,
            editEntry,
            EntryFileList,
            EntryImageList,
            EmailResend,
            PaymentSummary,
            ManualEntryActions
        },
        data() {
            return {
                loading: true,
                editTable: false,
                entry: false,
                view_as_json: false,
                entry_type: this.$route.query.type || 'all',
                developer_mode: true,
                form_id: window.fluent_form_entries_vars.form_id,
                entry_id: this.$route.params.entry_id,
                nextId: null,
                prevId: null,
                order_data: null,
                sort_by: this.$route.query.sort_by,
                paginate: {
                    total: null,
                    current_page: this.$route.query.current_page
                },
                entry_statuses: window.fluent_form_entries_vars.entry_statuses,
                entry_position: this.$route.query.pos,
                operator: null,
                currentSerialNo: null,
                formFields: {},
                original_data: {},
                show_empty: 'no',
                widgets: {},
                labels: {}
            }
        },
        methods: {
            getEntry() {
                let data = {
                    action: 'fluentform-get-entry',
                    current_page: this.paginate.current_page,
                    form_id: this.form_id,
                    entry_id: this.entry_id,
                    entry_type: this.entry_type,
                    search: this.search_string,
                    sort_by: this.sort_by,
                };
                this.loading = true;
                FluentFormsGlobal.$get(data)
                    .then((res) => {
                        if (res.data.submission && res.data.submission.id) {
                            this.entry = res.data.submission;
                            this.original_data = JSON.parse(res.data.submission.response);
                            this.labels = res.data.labels;
                            this.formFields = res.data.fields;
                            this.currentSerialNo = this.entry.myRowSerial;
                            this.entry_id = this.entry.id;
                            this.order_data = res.data.order_data;
                            this.widgets = res.data.widgets;

                            this.nextId = res.data.next && res.data.next.id;
                            this.prevId = res.data.prev && res.data.prev.id;

                            this.$router.push({
                                name: 'form-entry', params: {entry_id: this.entry.id},
                                query: this.$route.query
                            });

                            ffEntriesEvents.$emit(
                                'change-title',
                                `Entry ${ this.entry.serial_number || '' }`
                            );

                        } else {
                            this.$notify.warning({
                                message: 'No entry found.',
                                offset: 30
                            });
                        }
                    })
                    .fail((error) => {
                        console.log(error);
                        this.$notify.warning({
                            message: error.responseJSON.data.message,
                            offset: 30
                        });
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            changeFavorite() {
                let newStatus = this.entry.is_favourite;
                if(newStatus == '0' || newStatus === 0) {
                    newStatus = 1;
                } else {
                    newStatus = '0';
                }

                let data = {
                    action: 'fluentform-change-entry-favorites',
                    form_id: this.form_id,
                    entry_id: this.entry_id,
                    is_favourite: newStatus
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.entry.is_favourite = newStatus;
                    })
                    .fail(error => {
                        console.log(error);
                    });
            },
            handleStatusChange(status) {
                let data = {
                    action: 'fluentform-change-entry-status',
                    form_id: this.form_id,
                    entry_id: this.entry_id,
                    status: status
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.entry.status = status;
                        this.$notify({
                            title: 'Success',
                            message: response.data.message,
                            type: 'success',
                            offset: 30
                        });
                    })
                    .fail(error => {
                        console.log(error);
                    });
            },
            changeEntry(operator) {
                let entryId = (operator === '+' && this.nextId) || (operator === '-' && this.prevId);

                if (entryId) {
                    this.entry_id = entryId;

                    this.getEntry();
                }
            },
            explodeFileUrls(value, chunkSize = 4) {
                return value ? _ff.chunk(value.split(', '), chunkSize) : [];
            },
            maybeExtractCommaArrayInfo(dataValue, field) {

                if (typeof dataValue == 'string' && field.element == 'input_checkbox') {
                    return dataValue;
                }

                if(field.element == 'select' && field.attributes && !field.attributes.multiple) {
                    return dataValue;
                }
                if (!dataValue) {
                    return;
                }

                let itemArray = [];

                if(typeof dataValue == 'string') {
                    itemArray = dataValue.split(',');
                }


                let options = field.options;

                if(!options) {
                    let advancedOptions = field.settings.advanced_options;
                    if(advancedOptions) {
                        options = {};
                        each(advancedOptions, (optionItem) => {
                            options[optionItem.value] = optionItem.label;
                        });
                    }
                }

                if (!options) {
                    return dataValue;
                }


                if(itemArray.length == 1) {
                    return `<div class="wpf_entry_value">${options[dataValue] || dataValue}</div>`;
                }

                let itemHtml = '<ul class="entry_item_list">';
                each(itemArray, (item) => {
                    item = item.trim();
                    itemHtml += `<li>${options[item] || item}</li>`;
                });
                itemHtml += '</ul>';
                return itemHtml;
            },
            dataType(data) {
                return typeof data;
            },
            prettifyJson(entry) {
                let data = {
                    id: entry.id,
                    form_id: entry.form_id,
                    original: this.original_data,
                    formatted: entry.user_inputs
                };

                return JSON.stringify(data, null, 8);
            }
        },
        mounted() {
            this.getEntry();
        }
    };
</script>

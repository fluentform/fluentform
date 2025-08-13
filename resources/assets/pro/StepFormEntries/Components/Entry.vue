<template>
    <div class="fluentform-wrapper">
        <section-head class="ff_section_head_between items-center" size="sm">
            <section-head-content>
                <h3>{{$t('Entry Details - Partial')}} #{{entry.id}}</h3>
            </section-head-content>
            <section-head-content>
                <btn-group>
                    <btn-group-item>
                        <el-button size="medium" @click="changeEntry('-')" :disabled="!prevId">
                            <i class="ff-icon ff-icon-arrow-left"/> <span>{{$t('Previous')}}</span>
                        </el-button>
                    </btn-group-item>
                    <btn-group-item>
                        <el-button size="medium" @click="changeEntry('+')" :disabled="!nextId">
                            <span>{{$t('Next')}}</span> <i class="ff-icon ff-icon-arrow-right"/>
                        </el-button>
                    </btn-group-item>
                    <btn-group-item>
                        <router-link :to="{ name: 'form-entries' }">
                            <span class="el-button el-button--default el-button--medium">
                                <i class="ff-icon ff-icon-eye fs-15"></i>
                                <span>{{$t('View All')}}</span>
                            </span>
                        </router-link>
                    </btn-group-item>
                </btn-group>
            </section-head-content>
        </section-head>

        <el-row v-loading="loading" :gutter="20" style="min-height: 260px;">
            <el-col :xs="24" :sm="18" :md="18" :lg="18">
                <card class="entry_info_box entry_input_data">
                    <card-head>
                        <card-head-group class="justify-between">
                            <div class="entry_info_box_title">
                                <span title="json code" @click="view_as_json = !view_as_json" class="dashicons dashicons-editor-code json_action"></span>
                                {{$t('Form Entry Data')}}
                            </div>
                            <div class="entry_info_box_actions">
                                <el-checkbox true-label="yes" false-label="no" v-model="show_empty">
                                    {{$t('Show empty fields')}}
                                </el-checkbox>
                            </div>
                        </card-head-group>
                    </card-head>
                    <card-body>
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
                                <template v-else-if="formFields[label_index]['element'] == 'signature'">
                                  <div v-show="original_data[label_index]" style="width:200px;border:1px solid #e3e8ee;max-width: 100%;height: auto;min-height: 100px;">
                                    <img  style="width: 100%; height: auto" :alt="label" :src="original_data[label_index]" />
                                  </div>
                                </template>
                                <template
                                    v-else-if="['input_image'].indexOf(formFields[label_index]['element']) != -1">
                                    <entry-image-list :itemKey="label_index" :dataItems="original_data"></entry-image-list>
                                </template>
                                <template
                                    v-else-if="['input_checkbox', 'select'].indexOf(formFields[label_index]['element']) != -1">
                                    <div
                                        v-html="maybeExtractCommaArrayInfo(entry.user_inputs[label_index], formFields[label_index]['raw'])"></div>
                                </template>
                                <template v-else>
                                    <div class="wpf_entry_value" v-html="entry.user_inputs[label_index]"></div>
                                </template>
                            </div>
                        </div>
                        <div v-show="view_as_json">
                            <textarea class="show_code" readonly :value="prettifyJson(entry)"></textarea>
                        </div>
                    </card-body>
                </card>

                <payment-summary
                    v-if="order_data"
                    :submission="entry"
                    :order_data="order_data"
                />
                <template v-if="hasPermission('fluentform_manage_entries')">
                    <entry-notes :entry_id="entry_id" :form_id="form_id"/>
                </template>
            </el-col>

            <el-col :xs="24" :sm="6" :md="6" :lg="6">
                <card class="entry_info_box">
                    <card-head>
                        <div class="entry_info_box_title">
                            {{$t('Submission Info')}}
                        </div>
                    </card-head>
                    <card-body>
                        <ul class="ff_submission_info_list ff_list_border_bottom">
                            <li>
                                <div class="lead-title" style="display: inline-block; width: 80px;">{{$t('Entity ID')}}:</div>
                                <div class="lead-text fs-14" style="display: inline-block;">#{{ entry.id }}</div>
                            </li>
                            <li>
                                <div class="lead-title" style="display: inline-block; width: 80px;"> {{$t('User IP')}}:</div>
                                <a class="lead-text fs-14" style="display: inline-block;" target="_blank" rel="noopener" :href="'https://ipinfo.io/' + entry.ip">
                                    {{ entry.ip }}
                                </a>
                            </li>
                            <li>
                                <div class="lead-title mb-1" style="display: inline-block; width: 100px;">{{$t('Source URL')}}:</div>
                                <a class="lead-text fs-14 text-primary" style="display: inline-block;"  target="_blank" :href="entry.source_url">
                                    {{ entry.source_url }}
                                </a>
                            </li>
                            <li>
                                <div class="lead-title" style="display: inline-block; width: 80px;">{{$t('Browser')}}:</div>
                                <div class="lead-text fs-14" style="display: inline-block;">{{ entry.browser }}</div>
                            </li>
                            <li>
                                <div class="lead-title" style="display: inline-block; width: 80px;">{{$t('Device')}}:</div>
                                <div class="lead-text fs-14" style="display: inline-block;"> {{ entry.device }}</div>
                            </li>
                            <li>
                                <template v-if="entry.user">
                                    <div class="lead-title" style="display: inline-block; width: 80px;">{{$t('User')}}:</div>
                                    <a class="lead-text fs-14 text-primary" style="display: inline-block;" target="_blank" rel="noopener" :href="entry.user.permalink">{{ entry.user.name }}</a>
                                </template>

                                <template v-else>
                                    <div class="lead-title" style="display: inline-block; width: 80px;">{{$t('User')}}:</div>
                                    <div class="lead-text fs-14" style="display: inline-block;">{{$t('Guest')}}</div>
                                </template>
                            </li>
                            <li>
                                <div class="lead-title" style="display: inline-block; width: 120px;">{{$t('Submitted On')}}:</div>
                                <div class="lead-text fs-14" style="display: inline-block;">{{ dateFormat(entry.created_at) }}</div>
                            </li>
                        </ul>
                    </card-body>
                </card>

                <card v-for="(widget, widgetKey) in widgets" class="entry_info_box" :key="widgetKey">
                    <card-head>
                        <div class="entry_info_box_title">
                            {{widget.title}}
                        </div>
                    </card-head>
                    <card-body>
                        <div v-html="widget.content"></div>
                    </card-body>
                </card>

            </el-col>
        </el-row>

        <el-dialog
            top="42px"
            :append-to-body="true"
            :visible.sync="editTable"
            width="60%"
        >
            <template slot="title">
                <h4>{{$t('Edit Entry Data')}}</h4>
            </template>
            <edit-entry
                @reloadData="getEntry()"
                :form_id="form_id"
                :entry_id="entry_id"
                @close="editTable = false"
                v-if="editTable"
                :labels="labels"
                :entry_data="entry.response"
                :fields="formFields"
            />
        </el-dialog>

    </div>
</template>

<script type="text/babel">
    import moment from 'moment';
    import each from 'lodash/each';
    import remove from '@fluentform/admin/components/confirmRemove';
    import PaymentSummary from '@fluentform/admin/views/Payments/PaymentSummary';
    import BtnGroup from '@fluentform/admin/components/BtnGroup/BtnGroup.vue';
    import BtnGroupItem from '@fluentform/admin/components/BtnGroup/BtnGroupItem.vue';
    import SectionHead from '@fluentform/admin/components/SectionHead/SectionHead.vue';
    import SectionHeadContent from '@fluentform/admin/components/SectionHead/SectionHeadContent.vue';
    import Card from '@fluentform/admin/components/Card/Card.vue';
    import CardHead from '@fluentform/admin/components/Card/CardHead.vue';
    import CardHeadGroup from '@fluentform/admin/components/Card/CardHeadGroup.vue';
    import CardBody from '@fluentform/admin/components/Card/CardBody.vue';
    import EntryFileList from '@fluentform/admin/views/Helpers/FilesList.vue';
    import EntryImageList from '@fluentform/admin/views/Helpers/ImageList.vue';
    import EntryNotes from '@fluentform/admin/views/EntryNotes';

    export default {
        name: 'StepFormEntry',
        props: ['has_pdf'],
        components: {
            remove: remove,
            PaymentSummary,
            BtnGroup,
            BtnGroupItem,
            SectionHead,
            SectionHeadContent,
            Card,
            CardHead,
            CardHeadGroup,
            CardBody,
            EntryFileList,
            EntryImageList,
            EntryNotes
        },
        data() {
            return {
                loading: true,
                labels: [],
                editTable: false,
                entry: false,
                view_as_json: false,
                entry_type: this.$route.query.type || 'all',
                developer_mode: true,
                form_id: window.fluentform_step_form_entry_vars.form_id,
                entry_id: this.$route.params.entry_id,
                nextId: null,
                prevId: null,
                order_data: null,
                sort_by: this.$route.query.sort_by,
                paginate: {
                    total: null,
                    current_page: this.$route.query.current_page
                },
                entry_position: this.$route.query.pos,
                operator: null,
                formFields: {},
                original_data: {},
                show_empty: 'no',
                widgets: {}
            }
        },
        methods: {
            getEntry() {
                let data = {
                    action: 'fluentform-step-form-get-entry',
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
                            this.entry_id = this.entry.id;
                            this.order_data = res.data.order_data;
                            this.widgets = res.data.widgets;

                            this.nextId = res.data.next && res.data.next.id;
                            this.prevId = res.data.prev && res.data.prev.id;

                            this.$router.push({
                                name: 'form-entry', params: {entry_id: this.entry.id},
                                query: this.$route.query
                            });

                            ffmsEntriesEvents.$emit(
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
                        this.$notify.warning({
                            message: error.responseJSON.data.message,
                            offset: 30
                        });
                    })
                    .always(() => {
                        this.loading = false;
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
                if(field.element == 'select' && field.attributes && !field.attributes.multiple) {
                    return dataValue;
                }
                if (!dataValue) {
                    return;
                }
                let itemArray = dataValue.split(',');


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
            dateFormat(date, format) {
                if (!format) {
                    format = 'MMM DD, YYYY';
                }
                let dateString = (date === undefined) ? null : date;
                let dateObj = moment(dateString);
                return dateObj.isValid() ? dateObj.format(format) : null;
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

<template>
    <div class="ff_activity_logs">
        <card>
            <card-head>
                <h5 class="title">{{ $t('Activity Logs') }}</h5>
                <p class="text">
                    {{ ('All the form submission & General internal logs. You can see and track if there has any issue with any of your Form.') }}
                </p>
            </card-head>
            <card-body>
                <el-row :gutter="24">
                    <el-col :span="8">
                        <div class="ff_form_group">
                            <h6 class="mb-3 fs-15">Form</h6>
                            <el-select class="w-100" @change="getLogs()" clearable v-model="selected_form" :placeholder="$t('Select Form')">
                                <el-option
                                    v-for="item in available_forms"
                                    :key="item.id"
                                    :label="item.title"
                                    :value="item.id">
                                </el-option>
                            </el-select>
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="ff_form_group">
                            <h6 class="mb-3 fs-15">{{ $t('Source') }}</h6>
                            <el-select class="w-100" @change="getLogs()" clearable v-model="selected_component" :placeholder="$t('Select Component')">
                                <el-option
                                    v-for="item in available_components"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value">
                                </el-option>
                            </el-select>
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="ff_form_group">
                            <h6 class="mb-3 fs-15">{{ $t('Status') }}</h6>
                            <el-select class="w-100" @change="getLogs()" clearable v-model="selected_status" :placeholder="$t('Select Status')">
                                <el-option
                                    v-for="item in available_statuses"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value">
                                </el-option>
                            </el-select>
                        </div>
                    </el-col>
                </el-row>

                <div v-loading="loading" class="ff_activity_logs_body mt-4">
                    <div v-if="multipleSelection.length" class="logs_actions mb-3">
                        <remove icon="el-icon-delete" @on-confirm="deleteItems()">
                            <button type="button" class="el-button el-button--danger el-button--mini">
                                <i class="el-icon-delete"></i>
                                <span>{{ $t('Delete Selected Logs') }}</span>
                            </button>
                        </remove>
                    </div>

                    <el-table
                        :data="logs"
                        stripe
                        class="entry_submission_log ff_table_s2"
                        @selection-change="handleSelectionChange"
                    >
                        <el-table-column type="selection" width="50"></el-table-column>
                        <el-table-column type="expand">
                            <template slot-scope="props">
                                <p v-html="props.row.description"></p>
                            </template>
                        </el-table-column>
                        <el-table-column width="50px" :label="$t('ID')">
                            <template slot-scope="props">
                                <a v-if="props.row.submission_url" :href="props.row.submission_url">#{{props.row.source_id}}</a>
                                <span v-else>n/a</span>
                            </template>
                        </el-table-column>
                        <el-table-column :label="$t('Form')">
                            <template slot-scope="props">
                                <span v-if="props.row.form_title">{{props.row.form_title}}</span>
                                <span v-else>{{ $t('General Log') }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column prop="title" :label="$t('Title')"></el-table-column>
                        <el-table-column prop="status" :label="$t('Status')" width="100">
                            <template slot-scope="props">
                                <el-tag :type="`${props.row.status == 'failed' ? 'danger' : props.row.status == 'success' ? 'success' : 'info'}`" size="small" class="el-tag--pill text-capitalize">
                                    {{props.row.status}}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column width="120" :label="$t('Component')">
                            <template slot-scope="props">
                                <div>{{ props.row.component }}</div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="created_at" :label="$t('Date')" width="180"></el-table-column>
                        <el-table-column width="70" :label="$t('Action')">
                            <template slot-scope="props">
                                <remove :plain="true" @on-confirm="deleteItems(props.row.id)">
                                    <el-button
                                        class="el-button--soft el-button--icon"
                                        size="mini"
                                        type="danger"
                                        icon="el-icon-delete"
                                    />
                                </remove>
                            </template>
                        </el-table-column>
                    </el-table>

                    <div class="ff_pagination_wrap text-right mt-4">
                        <el-pagination
                            background
                            @current-change="getLogs"
                            :hide-on-single-page="true"
                            :page-size="per_page"
                            :current-page.sync="page_number"
                            layout="prev, pager, next"
                            :total="total">
                        </el-pagination>
                    </div>
                </div>
            </card-body>
        </card>
    </div>
</template>

<script type="text/babel">
    import each from 'lodash/each';
    import remove from "../components/confirmRemove";
    import Card from '@/admin/components/Card/Card.vue';
    import CardBody from '@/admin/components/Card/CardBody.vue';
    import CardHead from '@/admin/components/Card/CardHead.vue';

    export default {
        name: 'ActivityLogs',
        components:{
            remove,
            Card, 
            CardHead, 
            CardBody 
        },
        data() {
            return {
                logs: [],
                loading: false,
                page_number: 1,
                per_page: 3,
                total: 0,
                available_statuses: [],
                available_components: [],
                available_forms: [],
                selected_form: '',
                selected_status: '',
                selected_component: '',
                multipleSelection: []
            }
        },
        methods: {
            getLogs() {
                this.loading = true;

                const url = FluentFormsGlobal.$rest.route('getLogs');

                FluentFormsGlobal.$rest.get(url, {
                    page: this.page_number,
                    per_page: this.per_page,
                    form_id: this.selected_form,
                    status: this.selected_status,
                    component: this.selected_component
                })
                    .then(response => {
                        this.logs = response.data;
                        this.total = response.total;
                    })
                    .catch(error => {
                        console.log(error);
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            deleteItems(singlelogId = false) {
                this.loading = true;
                let logIds = [];

                if (singlelogId) {
                    logIds = [singlelogId]
                } else {
                    each(this.multipleSelection, (item) => {
                    logIds.push(item.id);
                    });
                }

                const url = FluentFormsGlobal.$rest.route('deleteLogs');

                FluentFormsGlobal.$rest.delete(url, {log_ids: logIds})
                    .then(response => {
                        this.page_number = 1;
                        this.getLogs();
                        this.multipleSelection = [];
                        this.$success(response.message);

                    })
                    .catch(error => {
                        this.$fail(error.message);
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            getAvailableFilters() {
                const url = FluentFormsGlobal.$rest.route('getLogFilters');

                FluentFormsGlobal.$rest.get(url)
                    .then(response => {
                        this.available_statuses = response.statuses;
                        this.available_forms = response.forms;
                        this.available_components = response.components;
                    })
            },
        },
        mounted() {
            this.getLogs();
            this.getAvailableFilters();
        }
    }
</script>

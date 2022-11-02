<template>
    <div class="ff_activity_logs">
        <el-row class="admin_menu_header">
            <el-col :md="24">
                <h3>{{ $t('Activity Logs') }}</h3>
                <p>
                    {{ ('All the form submission & General internal logs.You can see and track if there has any issue with any of your Form.') }}
                </p>
            </el-col>
        </el-row>

        <el-col class="ff_filter_wrapper" :md="24">
            <div class="ff_form_group ff_inline">
                Form
                <el-select @change="getLogs()" size="mini" clearable v-model="selected_form" :placeholder="$t('Select Form')">
                    <el-option
                        v-for="item in available_forms"
                        :key="item.form_id"
                        :label="item.title"
                        :value="item.form_id">
                    </el-option>
                </el-select>
            </div>
            <div class="ff_form_group ff_inline">
                {{ $t('Source') }}
                <el-select @change="getLogs()" size="mini" clearable v-model="selected_component" :placeholder="$t('Select Component')">
                    <el-option
                        v-for="item in available_components"
                        :key="item"
                        :label="item"
                        :value="item">
                    </el-option>
                </el-select>
            </div>
            <div class="ff_form_group ff_inline">
                {{ $t('Status') }}
                <el-select @change="getLogs()" size="mini" clearable v-model="selected_status" :placeholder="$t('Select Status')">
                    <el-option
                        v-for="item in available_statuses"
                        :key="item"
                        :label="item"
                        :value="item">
                    </el-option>
                </el-select>
            </div>
        </el-col>

        <div v-loading="loading" class="ff_activity_logs_body">
            <div v-if="multipleSelection.length" class="logs_actions">
              <remove size="mini" icon="el-icon-delete" @on-confirm="deleteItems()">{{ $t('Delete Selected Logs') }}</remove>
              <p></p>
            </div>

            <el-table
                :data="logs"
                stripe
                class="entry_submission_log"
                style="width: 100%"
                @selection-change="handleSelectionChange">
                <el-table-column
                    type="selection"
                    width="50">
                </el-table-column>
                <el-table-column type="expand">
                    <template slot-scope="props">
                        <p v-html="props.row.description"></p>
                    </template>
                </el-table-column>
                <el-table-column
                        width="120px"
                        :label="$t('Source ID')">
                    <template slot-scope="props">
                        <a v-if="props.row.submission_url" :href="props.row.submission_url">#{{props.row.source_id}}</a>
                        <span v-else>n/a</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="$t('Form/Source')">
                    <template slot-scope="props">
                        <span v-if="props.row.form_title">{{props.row.form_title}}</span>
                        <span v-else>{{ $t('General Log') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="title"
                    :label="$t('Title')">
                </el-table-column>
                <el-table-column
                    prop="status"
                    :label="$t('Status')"
                    width="100">
                  <template slot-scope="props">
                    <span style="font-size: 12px;" class="ff_tag" :class="'log_status_'+props.row.status">{{props.row.status}}</span>
                  </template>
                </el-table-column>
                <el-table-column
                    width="120"
                    :label="$t('Component')">
                    <template slot-scope="props">
                        <div style="text-transform: capitalize">{{ props.row.component }}</div>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="created_at"
                    :label="$t('Date')"
                    width="180">
                </el-table-column>
                <el-table-column width="70" :label="$t('Action')">
                    <template slot-scope="props">
                        <remove :plain="true" size="mini" class="pull-right" icon="el-icon-delete" @on-confirm="deleteItems(props.row.id)"></remove>
                    </template>
                </el-table-column>
            </el-table>
            <br/>

            <el-pagination
                background
                @current-change="getLogs"
                :hide-on-single-page="true"
                small
                :page-size="per_page"
                :current-page.sync="page_number"
                layout="prev, pager, next"
                :total="total">
            </el-pagination>

            <div v-if="multipleSelection.length" class="logs_actions">
                <p></p>
              <remove size="mini" icon="el-icon-delete" @on-confirm="deleteItems()">{{ $t('Delete Selected Logs') }}</remove>
            </div>
        </div>
    </div>
</template>

<script type="text/babel">
    import each from 'lodash/each';
    import remove from "../components/confirmRemove";


    export default {
        name: 'ActivityLogs',
        components:{
          remove
        },
        data() {
            return {
                logs: [],
                loading: false,
                page_number: 1,
                per_page: 20,
                total: 0,
                available_statuses: ['pending', 'processing', 'success', 'failed'],
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
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_all_logs',
                    page_number: this.page_number,
                    per_page: this.per_page,
                    form_id: this.selected_form,
                    status: this.selected_status,
                    component: this.selected_component
                })
                    .then(response => {
                        this.logs = response.data.logs;
                        this.total = response.data.total;
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(() => {
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

                FluentFormsGlobal.$post({
                    action: 'fluentform_delete_logs_by_ids',
                    log_ids: logIds,
                })
                    .then(response => {
                        this.page_number = 1;
                        this.getLogs();
                        this.multipleSelection = [];
                        this.$success(response.data.message);

                    })
                    .fail(error => {
                        this.$fail(error.responseJSON.message);
                    })
                    .always(() => {
                        this.loading = false;
                    });
            },
            handleSelectionChange(val) {
                this.multipleSelection = val;
            },
            getAvailableFilters() {
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_activity_log_filters'
                })
                    .then(response => {
                        this.available_statuses = response.data.available_statuses;
                        this.available_forms = response.data.available_forms;
                        this.available_components = response.data.available_components;
                    })
                    .fail(error => {
                        console.log(error);
                    });
            },
        },
        mounted() {
            this.getLogs();
            this.getAvailableFilters();
        }
    }
</script>

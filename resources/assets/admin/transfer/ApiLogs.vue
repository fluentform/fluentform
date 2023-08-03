  <template>
    <div class="ff_api_logs">
        <div class="ff_card">
            <div class="ff_card_head">
                <h5 class="title">{{$t('Api Logs')}}</h5>
                <p class="text" style="max-width: 700px;">
                    {{ $t('All the external CRM / API call logs and you can see and track if there has any issue with any of your API configuration. (Last 2 months data only)') }}
                </p>
            </div><!-- .ff_card_head -->
            <div class="ff_card_body">
                <el-row :gutter="24">
                    <el-col :span="8">
                        <div class="ff_form_group">
                            <h6 class="fs-15 mb-3">Form</h6>
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
                            <h6 class="fs-15 mb-3">Source</h6>
                            <el-select class="w-100"  @change="getLogs()" clearable v-model="selected_component" :placeholder="$t('Select Component')">
                                <el-option
                                    v-for="item in available_components"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                    style="text-transform:capitalize;"
                                >
                                </el-option>
                            </el-select>
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="ff_form_group">
                            <h6 class="fs-15 mb-3">Status</h6>
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

                <div class="ff_activity_logs_body mt-4">
                    <el-skeleton :loading="loading" animated :rows="10">
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
                            class="entry_submission_log ff_table_s2"
                            stripe
                            @selection-change="handleSelectionChange"
                        >
                            <el-table-column type="selection" width="50"></el-table-column>
                            <el-table-column type="expand">
                                <template slot-scope="props">
                                    <p v-html="props.row.note"></p>
                                </template>
                            </el-table-column>
                            <el-table-column width="100px" :label="$t('ID')">
                                <template slot-scope="props">
                                    <a :href="props.row.submission_url">#{{props.row.submission_id}}</a>
                                </template>
                            </el-table-column>
                            <el-table-column prop="form_title" :label="$t('Form')"></el-table-column>
                            <el-table-column prop="status" :label="$t('Status')" width="140">
                                <template slot-scope="props">
                                    <el-tag :type="`${props.row.status == 'failed' ? 'danger' : props.row.status == 'success' ? 'success' : 'info'}`" size="small" class="el-tag--pill text-capitalize">
                                        {{props.row.status}}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column :label="$t('Component')">
                                <template slot-scope="props">
                                    <div>{{getReadableName(props.row.component)}}</div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="created_at" :label="$t('Date')" width="180"></el-table-column>
                            <el-table-column width="70" :label="$t('Action')">
                                <template slot-scope="props">
                                    <remove :plain="true" @on-confirm="deleteItems(props.row.id)">
                                        <el-button
                                            class="el-button--icon"
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
                                class="ff_pagination"
                                background
                                @size-change="handleSizeChange"
                                @current-change="goToPage"
                                :current-page.sync="paginate.current_page"
                                :page-sizes="[5, 10, 20, 50, 100]"
                                :page-size="parseInt(paginate.per_page)"
                                layout="total, sizes, prev, pager, next"
                                :total="paginate.total">
                            </el-pagination>
                        </div>
                    </el-skeleton>
                </div>
            </div><!-- .ff_card_body -->

        </div><!-- .ff_card -->

    </div>
</template>

<script type="text/babel">
  import each from 'lodash/each';
  import remove from "../components/confirmRemove";
  import { scrollTop } from '@/admin/helpers';

  export default {
        name: 'ApiLogs',
        props: ['app'],
        components:{
          remove
        },
        data() {
            return {
                logs: [],
                loading: false,
                available_statuses: [],
                available_components: [],
                available_forms: [],
                selected_form: '',
                selected_status: '',
                selected_component: '',
                multipleSelection: [],
                paginate: {
                    total: 0,
                    current_page: 1,
                    last_page: 1,
                    per_page: localStorage.getItem('apiLogsPerPage') || 10
                },
            }
        },
        methods: {
            getLogs() {
                this.loading = true;

                const url = FluentFormsGlobal.$rest.route('getLogs');
                FluentFormsGlobal.$rest.get(url, {
                    page: this.paginate.current_page,
                    per_page: this.paginate.per_page,
                    form_id: this.selected_form,
                    status: this.selected_status,
                    component: this.selected_component,
                    type: 'api',
                })
                    .then(response => {
                        this.logs = response.data;
                        this.total = response.total;
                        this.setPaginate(response);
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

                FluentFormsGlobal.$rest.delete(url, {log_ids: logIds, type: 'api'})
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

                FluentFormsGlobal.$rest.get(url, {type: 'api'})
                    .then(response => {
                        this.available_statuses = response.statuses;
                        this.available_forms = response.forms;
                        this.available_components = response.components;
                    })
            },
            getReadableName(actionName) {
                if(!actionName) {
                    return 'n/a';
                }
                let newName = actionName.replace('fluentform_integration_notify_', '')
                    .replace('fluentform_', '')
                    .replace('_notification_feed', '')
                    .replace('_', ' ');
                return newName;
            },
            goToPage(value) {
                scrollTop().then(_ => {
                    this.paginate.current_page = value;
                    this.getLogs();
                })
            },
            handleSizeChange(value) {
                scrollTop().then(_ => {
                    localStorage.setItem('apiLogsPerPage', value);
                    this.paginate.per_page = value;
                    this.getLogs();
                })
            },
            setPaginate(data = {}) {
                this.paginate = {
                    total: data.total || 0,
                    current_page: data.current_page || 1,
                    last_page: data.last_page || 1,
                    per_page: data.per_page || localStorage.getItem('apiLogsPerPage') || 10,
                }
            },
        },
        mounted() {
            this.getLogs();
            this.getAvailableFilters();
        },
        created() {
            if (this.app.status_query != ''){
                this.selected_status = this.app.status_query;
            }
            if (this.app.source_query != ''){
                this.selected_component = this.app.source_query;
            }
        }
  }
</script>

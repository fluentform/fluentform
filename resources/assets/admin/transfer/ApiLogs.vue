  <template>
    <div class="ff_activity_logs">
        <el-row class="admin_menu_header">
            <el-col :md="24">
                <h3>{{$t('Api Logs')}}</h3>
                <p>
                    All the external CRM/API call logs and you can see and track if there has any issue with any of your API configuration. (Last 2 months data only)
                </p>
            </el-col>
        </el-row>

        <el-col class="ff_filter_wrapper" :md="24">
            <div class="ff_form_group ff_inline">
                Form
                <el-select @change="getLogs()" size="mini" clearable v-model="selected_form" placeholder="Select Form">
                    <el-option
                        v-for="item in available_forms"
                        :key="item.form_id"
                        :label="item.title"
                        :value="item.form_id">
                    </el-option>
                </el-select>
            </div>
            <div class="ff_form_group ff_inline">
                Source
                <el-select  @change="getLogs()" size="mini" clearable v-model="selected_component" placeholder="Select Component">
                    <el-option
                        v-for="item in available_components"
                        :key="item"
                        :label="getReadableName(item)"
                        :value="item"
                        style="text-transform:capitalize;"
                    >
                    </el-option>
                </el-select>
            </div>
            <div class="ff_form_group ff_inline">
                Status
                <el-select @change="getLogs()" size="mini" clearable v-model="selected_status" placeholder="Select Status">
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
              <remove size="mini" icon="el-icon-delete" @on-confirm="deleteItems()">Delete Selected Logs</remove>
              <p></p>
            </div>

            <el-table
                :data="logs"
                class="entry_submission_log"
                stripe
                style="width: 100%"
                @selection-change="handleSelectionChange">
                <el-table-column
                    type="selection"
                    width="50">
                </el-table-column>
                <el-table-column type="expand">
                    <template slot-scope="props">
                        <p v-html="props.row.note"></p>
                    </template>
                </el-table-column>
                <el-table-column
                        width="120px"
                        label="Submission Id">
                    <template slot-scope="props">
                        <a :href="props.row.submission_url">#{{props.row.origin_id}}</a>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="form_title"
                    label="Form">
                </el-table-column>
                <el-table-column
                    prop="status"
                    label="Status"
                    width="100">
                    <template slot-scope="props">
                      <span style="font-size: 12px;" class="ff_tag" :class="'log_status_'+props.row.status">{{props.row.status}}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    label="Component">
                    <template slot-scope="props">
                        <div style="text-transform: capitalize">{{getReadableName(props.row.action)}}</div>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="created_at"
                    label="Date"
                    width="180">
                </el-table-column>
                <el-table-column width="70" label="Action">
                    <template slot-scope="props">
                        <remove :plain="true"  size="mini" class="pull-right" icon="el-icon-delete" @on-confirm="deleteItems(props.row.id)"></remove>
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
                <remove size="mini" icon="el-icon-delete" @on-confirm="deleteItems()">Delete Selected Logs</remove>
            </div>
        </div>
    </div>
</template>

<script type="text/babel">
  import each from 'lodash/each';
  import remove from "../components/confirmRemove";

  export default {
        name: 'ApiLogs',
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
                    action: 'fluentform_get_api_logs',
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
                    action: 'fluentform_delete_api_logs_by_ids',
                    log_ids: logIds,
                })
                    .then(response => {
                        this.page_number = 1;
                        this.getLogs();
                        this.multipleSelection = [];
                        this.$notify.success({
                            title: 'Success',
                            message: response.data.message,
                            offset: 30
                        });
                    })
                    .fail(error => {
                        console.log(error);
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
                    action: 'fluentform_get_activity_api_log_filters'
                })
                    .then(response => {
                        this.available_statuses = response.data.api_statuses;
                        this.available_forms = response.data.available_forms;
                        this.available_components = response.data.available_components;
                    })
                    .fail(error => {
                        console.log(error);
                    });
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
        },
        mounted() {
            this.getLogs();
            this.getAvailableFilters();
        }
    }
</script>

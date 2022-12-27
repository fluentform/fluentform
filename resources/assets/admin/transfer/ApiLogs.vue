  <template>
    <div class="ff_activity_logs">
        <el-row class="admin_menu_header">
            <el-col :md="24">
                <h3>{{$t('Api Logs')}}</h3>
                <p>
                    {{ $t('All the external CRM / API call logs and you can see and track if there has any issue with any of your API configuration.(Last 2 months data only)') }}
                </p>
            </el-col>
        </el-row>

        <el-col class="ff_filter_wrapper" :md="24">
            <div class="ff_form_group ff_inline">
                Form
                <el-select @change="getLogs()" size="mini" clearable v-model="selected_form" :placeholder="$t('Select Form')">
                    <el-option
                        v-for="item in available_forms"
                        :key="item.id"
                        :label="item.title"
                        :value="item.id">
                    </el-option>
                </el-select>
            </div>
            <div class="ff_form_group ff_inline">
                Source
                <el-select  @change="getLogs()" size="mini" clearable v-model="selected_component" :placeholder="$t('Select Component')">
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
            <div class="ff_form_group ff_inline">
                Status
                <el-select @change="getLogs()" size="mini" clearable v-model="selected_status" :placeholder="$t('Select Status')">
                    <el-option
                        v-for="item in available_statuses"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value">
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
                        :label="$t('Submission Id')">
                    <template slot-scope="props">
                        <a :href="props.row.submission_url">#{{props.row.submission_id}}</a>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="form_title"
                    :label="$t('Form')">
                </el-table-column>
                <el-table-column
                    prop="status"
                    :label="$t('Status')"
                    width="140">
                    <template slot-scope="props">
                      <span style="font-size: 12px;" class="ff_tag" :class="'log_status_'+props.row.status">{{props.row.status}}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="$t('Component')">
                    <template slot-scope="props">
                        <div style="text-transform: capitalize">{{props.row.component}}</div>
                    </template>
                </el-table-column>
                <el-table-column
                    prop="created_at"
                    :label="$t('Date')"
                    width="180">
                </el-table-column>
                <el-table-column width="70" :label="$t('Action')">
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
                <remove size="mini" icon="el-icon-delete" @on-confirm="deleteItems()">{{ $t('Delete Selected Logs') }}</remove>
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
                    component: this.selected_component,
                    type: 'api',
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
        },
        mounted() {
            this.getLogs();
            this.getAvailableFilters();
        }
    }
</script>

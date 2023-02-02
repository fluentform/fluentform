  <template>
    <div class="ff_activity_logs">
        <div class="ff_card">
            <div class="ff_card_head">
                <h5 class="title">{{$t('Api Logs')}}</h5>
                <p class="text" style="max-width: 660px;">
                    {{ $t('All the external CRM / API call logs and you can see and track if there has any issue with any of your API configuration. (Last 2 months data only)') }}
                </p>
            </div><!-- ff_card_head -->
            <div class="ff_card_body">
                <el-row :gutter="24" class="mb-4">
                    <el-col :span="8">
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title"> {{ $t('Form') }}</h6>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-select 
                                    class="w-100"
                                    @change="getLogs()"
                                    clearable 
                                    v-model="selected_form" 
                                    :placeholder="$t('Select Form')"
                                >
                                    <el-option
                                        v-for="item in available_forms"
                                        :key="item.form_id"
                                        :label="item.title"
                                        :value="item.form_id">
                                    </el-option>
                                </el-select>
                            </div>
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title"> {{ $t('Source') }}</h6>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-select  
                                    class="w-100"
                                    @change="getLogs()" 
                                    clearable 
                                    v-model="selected_component" 
                                    :placeholder="$t('Select Component')"
                                >
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
                        </div>
                    </el-col>
                    <el-col :span="8">
                        <div class="ff_block_item">
                            <div class="ff_block_title_group mb-3">
                                <h6 class="ff_block_title"> {{ $t('Status') }}</h6>
                            </div><!-- .ff_block_title_group -->
                            <div class="ff_block_item_body">
                                <el-select 
                                    class="w-100"
                                    @change="getLogs()" 
                                    clearable 
                                    v-model="selected_status" 
                                    :placeholder="$t('Select Status')"
                                >
                                    <el-option
                                        class="text-capitalize"
                                        v-for="item in available_statuses"
                                        :key="item"
                                        :label="item"
                                        :value="item"
                                    ></el-option>
                                </el-select>
                            </div>
                        </div>
                    </el-col>
                </el-row>
                <div v-loading="loading" class="ff_activity_logs_body">
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
                        <el-table-column width="50px" :label="$t('ID')">
                            <template slot-scope="props">
                                <a :href="props.row.submission_url">#{{props.row.origin_id}}</a>
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
                                <div>{{getReadableName(props.row.action)}}</div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="created_at" :label="$t('Date')" width="180"></el-table-column>
                        <el-table-column width="70" :label="$t('Action')">
                            <template slot-scope="props">
                                <remove :plain="true" @on-confirm="deleteItems(props.row.id)">
                                    <el-button
                                        class="el-button--soft-2 el-button--icon"
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
            </div><!-- ff_card_body -->
        </div><!-- .ff_card -->
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
                per_page: 5,
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

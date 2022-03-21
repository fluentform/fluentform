<template>
    <div>
        <el-row class="setting_header">
            <el-col :md="12"><h2>All Form Integrations</h2></el-col>
            <!--Add Feed-->
            <el-col v-if="!isEmpty(available_integrations)" :md="12" class="action-buttons mb15 clearfix">
                <el-dropdown type="primary" class="pull-right" @command="add" :hide-on-click="false" >
                    <el-button size="small" type="primary">
                        Add New Integration<i class="el-icon-arrow-down el-icon--right"></i>
                    </el-button>
                    <el-dropdown-menu slot="dropdown" style="max-height: 400px;overflow: auto">
                        <el-dropdown-item>
                            <el-input @click.prevent autofocus v-model="search" :placeholder="$t('Search Integration')"></el-input>
                        </el-dropdown-item>
                        <el-dropdown-item v-for="(integration,integration_name) in filteredList" :key="integration_name" :command="integration_name">{{integration.title}}</el-dropdown-item>
                    </el-dropdown-menu>
                </el-dropdown>
            </el-col>
        </el-row>

        <div v-if="isEmpty(available_integrations) && !loading">
            <p style="font-size: 18px; text-align: center;">You don't have any integration module enabled. Please go to integration modules and enable and configured from 30+ available modules</p>
            <p style="text-align: center;"><a class="el-button el-button--primary el-button--small el-dropdown-selfdefine" :href="all_module_config_url">Configure Modules</a></p>
        </div>

        <!-- GetResponse Feeds Table: 1 -->
        <el-table v-else stripe v-loading="loading" :data="integrations" class="el-fluid">
            <template slot="empty">
                <div class="getting_started_message">
                    <p>You don't have any form feed integration yet. Create new feed and connect your data to your favorite CRM/Marketing tool</p>
                </div>
            </template>
            <el-table-column label="Status" width="90">
                <template slot-scope="scope">
                    <el-switch active-color="#13ce66" @change="handleActive(scope.row)" v-model="scope.row.enabled"></el-switch>
                </template>
            </el-table-column>

            <el-table-column
                width="180"
                label="Integration">
                <template slot-scope="scope">
                    <img v-if="scope.row.provider_logo" class="general_integration_logo" :src="scope.row.provider_logo" :alt="scope.row.provider" />
                    <span class="general_integration_name" v-else>{{scope.row.provider}}</span>
                </template>
            </el-table-column>

            <el-table-column
                label="Title">
                <template slot-scope="scope">
                    {{scope.row.name}}
                </template>
            </el-table-column>

            <el-table-column width="160" label="Actions" class-name="action-buttons">
                <template slot-scope="scope">
                    <el-button
                        @click="edit(scope.row)"
                        type="primary"
                        icon="el-icon-setting"
                        size="mini"></el-button>
                    <remove @on-confirm="remove(scope.row.id, scope)"></remove>
                </template>
            </el-table-column>
        </el-table>

        <br />
        <p v-show="!integrations.length" style="text-align: right;">
            <a :href="all_module_config_url">Check Global Integration Settings</a>
            <a style="margin-left: 20px" target="_blank" rel="noopener" href="https://wpmanageninja.com/docs/fluent-form/integrations-available-in-wp-fluent-form/">View Documentations</a>
        </p>

    </div>
</template>

<script>
    import remove from '../../confirmRemove.vue';
    import isEmpty from 'lodash/isEmpty';
    export default {
        name: 'generalSettings',
        props: ['form_id', 'inputs', 'has_pro', 'editorShortcodes'],
        components: {
            remove
        },
        data() {
            return {
                search: '',
                loading: true,
                integrations: [],
                errors: new Errors,
                available_integrations: {},
                all_module_config_url: ''
            }
        },
        methods: {
            add(integration_name) {
                let integration = this.available_integrations[integration_name];

                if(!integration.is_active) {
                    // Handle Inactive state
                    this.$confirm(integration.configure_message, integration.configure_title, {
                        confirmButtonText: integration.configure_button_text,
                        cancelButtonText: 'Cancel',
                        type: 'warning'
                    }).then(() => {
                        window.location.href = integration.global_configure_url;
                        return;
                    }).catch(() => {

                    });
                    return;
                }

                this.$router.push({
                    name: 'edit_integration',
                    params: {
                        integration_id: 0,
                        integration_name: integration_name
                    }
                });
                return;

                console.log(integration);
                this.selectedIndex = this.integrations.length;
                this.selected_id = 0;
                this.editing_item = false;
                this.show_edit = true;
            },
            edit(integration) {
                this.$router.push({
                    name: 'edit_integration',
                    params: {
                        integration_id: integration.id,
                        integration_name: integration.provider
                    }
                });
            },
            handleActive(row) {
                let data = {
                    form_id: this.form_id,
                    status: row.enabled,
                    notification_id: row.id,
                    action: 'fluentform_post_update_form_integration_status'
                };
                FluentFormsGlobal.$post(data)
                    .then(response => {
                        console.log(response);
                        this.$notify.success({
                            offset: 30,
                            title: 'Success!',
                            message: response.data.message
                        });
                    })
                    .fail(error => {
                        this.$notify.error({
                            offset: 30,
                            title: 'Success!',
                            message: error.responseJSON.data.message
                        });
                    });
            },
            remove(id, scope) {
               let $index  = scope.$index;
                let data = {
                    action: 'fluentform-delete-general_integration_feed',
                    integration_id: id,
                    form_id: this.form_id
                };

                FluentFormsGlobal.$post(data)
                    .then(response => {
                        this.$notify.success({
                            offset: 30,
                            title: 'Success!',
                            message: response.data.message
                        });
                        this.integrations.splice($index, 1);
                    })
                    .fail(e => console.log(e));
            },
            getFeeds() {
                this.loading = true;
                FluentFormsGlobal.$get({
                    action: 'fluentform_get_all-general-integration-feeds',
                    form_id: this.form_id
                })
                    .then(response => {
                        this.integrations = response.data.feeds;
                        this.available_integrations = response.data.available_integrations;
                        this.all_module_config_url = response.data.all_module_config_url;
                    })
                    .fail(error => {
                        console.log(error);
                    })
                    .always(r => this.loading = false);
            },
            isEmpty
        },
        computed: {
            filteredList() {
                let filteredList = {};
                Object.keys(this.available_integrations).map(key => {
                    if (key.toLowerCase().includes(this.search.toLowerCase())) {
                        filteredList[key] = this.available_integrations[key];
                    }
                });
                return filteredList;
            }

        },
        beforeMount() {
            this.getFeeds();
        },
        beforeCreate() {
            jQuery('head title').text('Form Integrations - Fluent Forms');
        }
    }
</script>



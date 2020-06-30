<template>
    <div>
        <el-row class="setting_header">
            <el-col :md="12">
                <h2>Zapier Integration</h2>
            </el-col>

            <!--Save settings-->
            <el-col :md="12" class="action-buttons clearfix mb15 text-right">
                <el-button v-if="selected" @click="discard"
                           class="pull-right" icon="el-icon-arrow-left" size="small"
                >Back
                </el-button>

                <el-button v-else @click="add" type="primary"
                           size="small" icon="plus"
                >Add Webhook
                </el-button>
            </el-col>
        </el-row>

        <!-- Notification Table: 1 -->
        <el-table v-loading="loading"
                  element-loading-text="Fetching Settings..."
                  v-if="!selected"
                  :data="notifications"
                  stripe
                  class="el-fluid">

            <el-table-column width="100">
                <template slot-scope="scope">
                    <el-switch active-color="#13ce66" @change="handleActive(scope.$index)"
                       active-value="true"
                       inactive-value="false"
                       v-model="scope.row.value.enabled"
                    ></el-switch>
                </template>
            </el-table-column>

            <el-table-column width="300" prop="value.name" label="Name"></el-table-column>

            <el-table-column prop="value.url" label="Webhook Url"></el-table-column>

            <el-table-column width="160" label="Actions" class-name="action-buttons">
                <template slot-scope="scope">
                    <el-button @click="edit(scope.$index)" type="primary"
                               icon="el-icon-setting" size="mini"
                    ></el-button>

                    <remove @on-confirm="remove(scope.$index, scope.row.id)" :plain="false"></remove>
                </template>
            </el-table-column>
        </el-table>

        <!-- Notification Editor -->
        <el-form v-else label-width="205px" label-position="left">

            <!--Notification name-->
            <el-form-item label="Name">
                <el-input v-model="selected.value.name"></el-input>
                <ErrorView field="name" :errors="errors"/>

            </el-form-item>

            <!--Notification Url-->
            <el-form-item label="Webhook Url">
                <el-input v-model="selected.value.url"></el-input>
                <ErrorView field="url" :errors="errors"/>
            </el-form-item>

            <!-- FilterFields -->
            <el-form-item>
                <template slot="label">
                    Conditional Logics

                    <el-tooltip class="item" placement="bottom-start" effect="light">
                        <div slot="content">
                            <h3>Conditional Logics</h3>
                            <p>Allow zapier webhook conditionally</p>
                        </div>

                        <i class="el-icon-info el-text-info"></i>
                    </el-tooltip>
                </template>

                <FilterFields
                :fields="inputs"
                :disabled="!has_pro"
                :conditionals="selected.value.conditionals"></FilterFields>

            </el-form-item>

            <div class="text-right">

                <el-button
                    v-if="selected.id"
                    :loading="verifying"
                    @click="verifyEndpoint" 
                    size="medium" 
                    type="default"
                >
                    Send Data Sample
                </el-button>

                <el-button 
                    :loading="loading"
                    @click="store" 
                    size="medium" 
                    type="primary"
                >
                    {{loading ? 'Saving' : 'Save' }} Notification
                </el-button>
            </div>
        </el-form>
    </div>
</template>

<script>
    import remove from '../confirmRemove.vue';
    import inputPopover from '../input-popover.vue';
    import FilterFields from './Includes/FilterFields.vue';
    import ErrorView from '../../../common/errorView.vue';

    export default {
        name: 'Zapier',
        props: ['form_id', 'inputs', 'has_pro', 'editorShortcodes'],
        components: {
            remove,
            inputPopover,
            FilterFields,
            ErrorView,
        },
        data() {
            return {
                loading: true,
                verifying: false,
                selected: null,
                selectedIndex: null,
                notifications: [],
                mock: {
                    value: {
                        name: 'Zapier Feed',
                        url: '',
                        conditionals: {
                            status: false,
                            type: 'all',
                            conditions: [
                                {
                                    field: null,
                                    operator: '=',
                                    value: null
                                }
                            ]
                        },
                        enabled: 'true'
                    }
                },
                errors: new Errors
            }
        },
        methods: {
            add() {
                this.selectedIndex = this.notifications.length;
                this.selected = _ff.cloneDeep(this.mock);
                let count = this.selectedIndex + 1;
                this.selected.value.name = this.mock.value.name + ' ' + count;
            },
            edit(index) {
                this.selectedIndex = index;
                let notification = this.notifications[index];
                this.selected = _ff.cloneDeep(notification);
            },
            discard() {
                this.selected = null;
                this.selectedIndex = null;
                this.errors.clear();
            },

            handleActive(index) {
                let notification = this.notifications[index];

                let data = {
                    id: notification.id,
                    form_id: this.form_id,
                    value: notification.value,
                    action: 'fluentform-save-zapier-notification'
                };

                let enabled = notification.value.enabled == 'true' ? 'enabled' : 'disabled';

                jQuery.post(ajaxurl, data)
                    .done(response => {
                        this.$notify.success({
                            offset: 30,
                            title: 'Success',
                            message: `Notification ${enabled} successfully !`
                        });
                    })
                    .fail(e => console.log(e));
            },
            remove(index, id) {
                jQuery.post(ajaxurl, {
                    id: id,
                    action: 'fluentform-delete-zapier-notification'
                })
                .done(response => {
                    this.notifications.splice(index, 1);
                    this.$notify.success({
                        title: 'Success',
                        message: 'Successfully removed the notification.',
                        offset: 30
                    });
                })
                .fail(e => console.log(e));
            },
            fetchNotifications() {
                let data = {
                    form_id: this.form_id,
                    action: 'fluentform-get-zapier-notifications'
                };      

                jQuery.get(ajaxurl, data)
                .then(response => {
                    this.notifications = response.data.map((item) => {
                        let status = item.value.conditionals.status;
                        item.value.conditionals.status = status == 'true' ? true : false;
                        return item;
                    });
                })
                .fail(e => console.log(e))
                .always(_ => this.loading = false);
            },
            store() {
                this.loading = true;
                this.errors.clear();

                let data = {
                    id: this.selected.id,
                    form_id: this.form_id,
                    value: this.selected.value,
                    action: 'fluentform-save-zapier-notification',
                };

                jQuery.post(ajaxurl, data).done(response => {
                    this.selected.id = response.data.id;
                    this.notifications.splice(this.selectedIndex, 1, this.selected);
                    
                    this.$notify.success({
                        offset: 30,
                        title: 'Success',
                        message: 'Notification saved successfully!'
                    });

                    // this.selected = this.selectedIndex = null;
                })
                .fail(e => {
                    this.errors.record(e.responseJSON.data);
                })
                .always(response => this.loading = false);
            },
            verifyEndpoint() {
                this.verifying = true;
                jQuery.post(ajaxurl, {
                    form_id: this.form_id,
                    zapier_hook_id: this.selected.id,
                    action: 'fluentform-verify-endpoint-zapier'
                }).then(response => {
                    this.$notify.success({
                        offset: 30,
                        title: 'Success!',
                        message: response.data.message
                    });
                }).fail(error => {
                    this.$notify.error({
                        offset: 30,
                        title: 'Oops!',
                        message: error.responseJSON.data.message
                    });
                }).always(r => {
                    this.verifying = false;
                });
            }
        },
        beforeMount() {
            this.fetchNotifications();
            jQuery('head title').text('Zapier Feeds - Fluent Forms');
        }
    }
</script>

<style lang="scss">
    .inline-form-field {
        margin-top: 15px;
    }
    .el-collapse-item {
        margin-bottom: 1px;
    }
</style>
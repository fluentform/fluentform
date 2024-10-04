<template>
    <div class="ff_zapier_wrap">
        <card>
            <card-head>
                <card-head-group class="justify-between">
                    <h5 class="title">{{ $t('Zapier Integration') }}</h5>
                    <btn-group>
                        <btn-group-item>
                            <el-button
                                v-if="selected"
                                @click="discard"
                                type="info"
                                class="el-button--soft"
                                size="large"
                            >
                                <template #icon>
                                    <i class="ff-icon ff-icon-arrow-left"></i>
                                </template>
                                {{ $t('Back') }}
                            </el-button>
                            <el-button
                                v-else
                                @click="add"
                                type="info"
                                size="large"
                            >
                                <template #icon>
                                    <i class="ff-icon ff-icon-plus"></i>
                                </template>
                                {{ $t('Add Zapier Webhook') }}
                            </el-button>
                        </btn-group-item>
                    </btn-group>
                </card-head-group>
            </card-head>
            <card-body>
                <!-- Notification Table: 1 -->
                <div class="ff-table-wrap" v-if="!selected">
                    <el-skeleton :loading="loading" animated :rows="6">
                        <el-table class="ff_table_s2" :data="notifications">
                            <el-table-column width="100">
                                <template #default="scope">
                                    <el-switch
                                        active-color="#13ce66" @change="handleActive(scope.$index)"
                                        active-value="true"
                                        inactive-value="false"
                                        v-model="scope.row.value.enabled"
                                    />
                                </template>
                            </el-table-column>

                            <el-table-column width="300" prop="value.name" :label="$t('Name')"></el-table-column>

                            <el-table-column prop="value.url" :label="$t('Webhook Url')"></el-table-column>

                            <el-table-column width="160" :label="$t('Actions')" class-name="action-buttons">
                                <template #default="scope">
                                    <btn-group>
                                        <btn-group-item>
                                            <el-button
                                                class="el-button--icon"
                                                @click="edit(scope.$index)"
                                                type="primary"
                                                size="small"
                                            >
                                                <template #icon>
                                                    <i class="el-icon-setting"></i>
                                                </template>
                                            </el-button>
                                        </btn-group-item>
                                        <btn-group-item>
                                            <remove @on-confirm="remove(scope.$index, scope.row.id)" :plain="false">
                                                <el-button
                                                    class="el-button--icon"
                                                    size="small"
                                                    type="danger"
                                                >
                                                    <template #icon>
                                                        <i class="el-icon-delete"></i>
                                                    </template>
                                                </el-button>
                                            </remove>
                                        </btn-group-item>
                                    </btn-group>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-skeleton>
                </div>
                <!-- Notification Editor -->
                <el-form v-else label-position="top">

                    <!--Notification name-->
                    <el-form-item class="ff-form-item" :label="$t('Name')">
                        <el-input v-model="selected.value.name"></el-input>
                        <ErrorView field="name" :errors="errors"/>

                    </el-form-item>

                    <!--Notification Url-->
                    <el-form-item class="ff-form-item" :label="('Webhook Url')">
                        <el-input v-model="selected.value.url"></el-input>
                        <ErrorView field="url" :errors="errors"/>
                    </el-form-item>

                    <!-- FilterFields -->
                    <el-form-item class="ff-form-item">
                        <template #label>
                            {{ $t('Conditional Logics') }}

                            <el-tooltip class="item" placement="bottom-start">
                                <template #content>
                                    <p>{{ $t('Allow zapier webhook conditionally') }}</p>
                                </template>

                                <i class="ff-icon ff-icon-info-filled text-primary"></i>
                            </el-tooltip>
                        </template>

                        <FilterFields
                            :fields="inputs"
                            :hasPro="has_pro"
                            :conditionals="selected.value.conditionals"
                        />

                    </el-form-item>

                    <div class="mt-4">
                        <el-button
                            :loading="loading"
                            @click="store"
                            type="primary"
                            size="large"
                        >
                            <template #icon>
                                <i class="el-icon-success"></i>
                            </template>
                            {{ loading ? $t('Saving ') : $t('Save ') }} {{ $t('Feed') }}
                        </el-button>
                        <el-button
                            v-if="selected.id"
                            :loading="verifying"
                            @click="verifyEndpoint"
                            size="large"
                        >
                            {{ ('Send Data Sample') }}
                        </el-button>
                    </div>
                </el-form>
            </card-body>
        </card>
    </div>
</template>

<script>
import remove from '../confirmRemove.vue';
import inputPopover from '../input-popover.vue';
import FilterFields from './Includes/FilterFields.vue';
import ErrorView from '../../../common/errorView.vue';
import BtnGroup from '@/admin/components/BtnGroup/BtnGroup.vue';
import BtnGroupItem from '@/admin/components/BtnGroup/BtnGroupItem.vue';
import Card from '@/admin/components/Card/Card.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import CardHeadGroup from '@/admin/components/Card/CardHeadGroup.vue';

export default {
    name: 'Zapier',
    props: ['form_id', 'inputs', 'has_pro', 'editorShortcodes'],
    components: {
        remove,
        inputPopover,
        FilterFields,
        ErrorView,
        Card,
        CardHead,
        CardBody,
        CardHeadGroup,
        BtnGroup,
        BtnGroupItem
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

            FluentFormsGlobal.$post(data)
                .done(response => {
                    this.$success(this.$t('Notification ' + enabled + ' successfully!'));
                })
                .fail(e => console.log(e));
        },
        remove(index, id) {
            FluentFormsGlobal.$post({
                id: id,
                action: 'fluentform-delete-zapier-notification'
            })
                .done(response => {
                    this.notifications.splice(index, 1);
                    this.$success(this.$t('Successfully removed the notification.'));
                })
                .fail(e => console.log(e));
        },
        fetchNotifications() {
            let data = {
                form_id: this.form_id,
                action: 'fluentform-get-zapier-notifications'
            };

            FluentFormsGlobal.$get(data)
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

            FluentFormsGlobal.$post(data).done(response => {
                this.selected.id = response.data.id;
                this.notifications.splice(this.selectedIndex, 1, this.selected);

                this.$success(this.$t('Notification saved successfully!'));

                // this.selected = this.selectedIndex = null;
            })
                .fail(e => {
                    this.errors.record(e.responseJSON.data);
                })
                .always(response => this.loading = false);
        },
        verifyEndpoint() {
            this.verifying = true;
            FluentFormsGlobal.$post({
                form_id: this.form_id,
                zapier_hook_id: this.selected.id,
                action: 'fluentform-verify-endpoint-zapier'
            }).then(response => {
                this.$success(response.data.message);
            }).fail(error => {
                this.$fail(error.responseJSON.data.message);
            }).always(r => {
                this.verifying = false;
            });
        }
    },
    mounted() {
        this.fetchNotifications();
        jQuery('head title').text('Zapier Feeds - Fluent Forms');
    }
}
</script>


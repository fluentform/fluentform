<template>
    <div class="ff_block_item">
        <div class="ff_section_head sm">
            <el-row>
                <el-col :span="18">
                    <h6 class="ff_block_title mb-1">{{ $t('Advanced') }}</h6>
                    <p>{{$t('Administrators have full access to Fluent Forms . Add other managers giving specific permissions.') }}</p>
                </el-col>
                <el-col :span="6" class="text-right">
                    <el-button
                        type="primary"
                        icon="el-icon-plus"
                        @click="showForm()"
                    >
                        {{ $t('Add Manager') }}
                    </el-button>
                </el-col>
            </el-row>
        </div><!-- .ff_section_head -->
        <div class="ff_table_wrap">
            <el-table class="ff_table_s2" :data="managers">
                <el-table-column :label="$t('ID')" prop="id" width="70"/>
                <el-table-column :label="$t('Name')" width="180">
                    <template slot-scope="scope">
                        {{ scope.row.first_name }} {{ scope.row.last_name }}
                    </template>
                </el-table-column>

                <el-table-column :label="$t('Email')" prop="email" width="260" />

                <el-table-column :label="$t('Permissions')">
                    <template slot-scope="scope">
                        <el-tag
                            type="info"
                            size="mini"
                            v-for="permission in scope.row.permissions"
                            :key="permission"
                            class="mr-1"
                        >
                            {{ permissions[permission].title }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column :label="$t('Action')" width="120">
                    <template slot-scope="scope">
                        <el-button
                            class="el-button--soft-2 el-button--icon mr-1"
                            size="mini"
                            type="primary"
                            icon="el-icon-edit"
                            @click="edit(scope.row)"
                        />
                        <confirm @on-confirm="remove(scope.row)">
                            <el-button
                                class="el-button--soft-2 el-button--icon"
                                size="mini"
                                type="danger"
                                icon="el-icon-delete"
                            />
                        </confirm>
                    </template>
                </el-table-column>
            </el-table>
            <div class="ff_pagination_wrap text-right mt-4">
                <el-pagination
                    @current-change="goToPage"
                    background
                    :hide-on-single-page="true"
                    :page-size="pagination.per_page"
                    :current-page.sync="pagination.page_number"
                    layout="prev, pager, next"
                    :total="pagination.total"
                ></el-pagination>
            </div>
        </div>

        <el-dialog
            :visible.sync="modal"
            :append-to-body="true"
            width="45%"
        >
            <div slot="title">
                <h4>{{getModalTitle()}}</h4>
            </div>

            <el-form :data="manager" label-position="top" class="mt-3">
                <el-form-item :label="$t('User email')">
                    <el-input type="email" :placeholder="$t('User Email Address')" v-model="manager.email"/>
                    <error-view field="email" :errors="errors" />
                    <p v-show="!manager.id" class="mt-2 small">
                        {{ $t('Please provide email address of your existing user.') }}
                    </p>
                </el-form-item>

                <el-form-item :label="$t('Permissions')">
                    <el-checkbox-group v-model="manager.permissions" class="ff_checkbox_group_col_2">
                        <el-checkbox
                            v-for="(permission, permissionKey) in permissions"
                            :label="permissionKey"
                            :key="permissionKey"
                        >
                            {{ permission.title }}
                        </el-checkbox>
                    </el-checkbox-group>
                    <error-view field="permissions" :errors="errors" />
                </el-form-item>
            </el-form>

            <div class="dialog-footer mt-2 text-right">
                <el-button @click="modal = false" type="text" class="el-button--text-light">Cancel</el-button>
                <el-button type="primary" @click="store" icon="el-icon-success">
                    {{ $t('Save') }}
                </el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import ErrorView from "@/common/errorView.vue";
import Confirm from "@/admin/components/confirmRemove.vue";

export default {
    name: "Managers",
    components: {
        ErrorView,
        Confirm
    },
    data() {
        return {
            loading: false,
            managers: [],
            pagination: {
                total: 0,
                current_page: 1,
                per_page: 5
            },
            permissions: {},
            modal: false,
            manager: {},
            errors: new Errors()
        };
    },

    methods: {
        fetch() {
            this.loading = true;

            FluentFormsGlobal.$get({
                action: "fluentform_get_managers",
                per_page: this.pagination.per_page,
                page: this.pagination.current_page
            })
            .then(response => {
                this.permissions = response.permissions;
                this.managers = response.managers.data;
                this.pagination.total = response.managers.total;
            })
            .fail(e => {})
            .always(() => {
                this.loading = false;
            });
        },

        showForm() {
            this.manager = {
                email: "",
                permissions: []
            };
            this.modal = true;
            this.errors.clear();
        },

        getModalTitle() {
            return this.manager.id ? "Edit Manager" : "Add Manager";
        },

        store() {
            this.loading = true;

            FluentFormsGlobal.$post({
                action: "fluentform_set_managers",
                manager: this.manager
            })
                .then(response => {
                    this.modal = false;

                    this.fetch();

                    this.$success(response.message);
                })
                .fail(e => {
                    this.errors.record(e.responseJSON.errors);
                })
                .always(() => {
                    this.loading = false;
                });
        },

        edit(manager) {
            this.modal = true;
            this.manager = Object.assign({}, manager);
            this.errors.clear();
        },

        remove(manager) {
            FluentFormsGlobal.$post({
                action: "fluentform_del_managers",
                id: manager.id
            })
                .then(response => {
                    this.modal = false;

                    this.fetch();

                    this.$success(response.message);
                })
                .fail(error => {
                    this.$fail(error.responseJSON.message);
                })
                .always(() => {
                    this.loading = false;
                });
        },
    
        goToPage(value) {
            this.pagination.current_page = value;
            this.fetch();
        }
    },

    mounted() {
        this.fetch();
    }
};
</script>
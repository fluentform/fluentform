<template>
    <div>
        <el-row class="ff_manager_settings_header">
            <el-col :md="18">
                <h2>Managers</h2>
            </el-col>

            <el-col :md="6" class="action-buttons clearfix text-right">
                <el-button
                    type="primary"
                    size="small"
                    icon="el-icon-plus"
                    @click="showForm()"
                >
                    Add Manager
                </el-button>
            </el-col>
        </el-row>

        <p>
            Administrators have full access to Fluent Forms. Add other managers
            giving specific permissions.
        </p>

        <hr />

        <div class="ff_managers_list">
            <el-table stripe class="el-fluid" :data="managers">
                <el-table-column label="ID" prop="id" width="80" />

                <el-table-column label="Name" width="150">
                    <template slot-scope="scope">
                        {{ scope.row.first_name }} {{ scope.row.last_name }}
                    </template>
                </el-table-column>

                <el-table-column label="Email" prop="email" width="250" />

                <el-table-column label="Permissions">
                    <template slot-scope="scope">
                        <el-tag
                            type="info"
                            size="mini"
                            v-for="permission in scope.row.permissions"
                            :key="permission"
                        >
                            {{ permissions[permission].title }}
                        </el-tag>
                    </template>
                </el-table-column>

                <el-table-column label="Action" width="120">
                    <template slot-scope="scope">
                        <el-button
                            size="mini"
                            type="primary"
                            icon="el-icon-edit"
                            @click="edit(scope.row)"
                        />

                        <confirm @on-confirm="remove(scope.row)">
                            <el-button
                                size="mini"
                                type="danger"
                                slot="reference"
                                icon="el-icon-delete"
                            />
                        </confirm>
                    </template>
                </el-table-column>
            </el-table>
            <br/>
    
            <el-pagination
                @current-change="goToPage"
                background
                :hide-on-single-page="true"
                small
                :page-size="pagination.per_page"
                :current-page.sync="pagination.page_number"
                layout="prev, pager, next"
                :total="pagination.total">
            </el-pagination>
        </div>

        <el-dialog
            :title="getModalTitle()"
            :visible.sync="modal"
            :append-to-body="true"
            width="60%"
            class="ff_managers_form"
        >
            <el-form :data="manager" label-position="top">
                <el-form-item label="User Email">
                    <el-input
                        type="email"
                        placeholder="User Email Address"
                        v-model="manager.email"
                    />

                    <error-view field="email" :errors="errors" />

                    <p v-show="!manager.id">
                        Please provide email address of your existing user.
                    </p>
                </el-form-item>

                <el-form-item label="Permissions">
                    <el-checkbox-group v-model="manager.permissions">
                        <el-checkbox
                            style="min-width: 250px"
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

            <span slot="footer" class="dialog-footer">
                <el-button type="primary" size="small" @click="store">
                    Save
                </el-button>
            </span>
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
                per_page: 10
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

                    this.$notify.success({
                        title: "Great!",
                        message: response.message,
                        offset: 30
                    });
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

                    this.$notify.success({
                        title: "Success!",
                        message: response.message,
                        offset: 30
                    });
                })
                .fail(error => {
                    this.$notify.error({
                        title: "Error!",
                        message: error.responseJSON.message,
                        offset: 30
                    });
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
<template>
    <div>
        <el-row class="ff_manager_settings_header">
            <el-col :md="18">
                <h2>{{ $t('Managers') }}</h2>
            </el-col>

            <el-col :md="6" class="action-buttons clearfix text-right">
                <el-button
                    type="primary"
                    size="small"
                    icon="el-icon-plus"
                    @click="showForm()"
                >
                    {{ $t('Add Manager') }}
                </el-button>
            </el-col>
        </el-row>

        <p>
            {{ $t('Administrators have full access to Fluent Forms.Add other managers giving specific permissions.') }}
        </p>

        <hr/>

        <div class="ff_managers_list">
            <el-table stripe class="el-fluid" :data="managersData">
                <el-table-column :label="$t('ID')" prop="id" width="80"/>

                <el-table-column :label="$t('Name')" width="150">
                    <template slot-scope="scope">
                        {{ scope.row.first_name }} {{ scope.row.last_name }}
                    </template>
                </el-table-column>

                <el-table-column :label="$t('Email')" prop="email" width="250"/>

                <el-table-column :label="$t('Permissions')">
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

                <el-table-column :label="$t('Action')" width="120">
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
                <el-form-item :label="$t('User Email')">
                    <el-input
                        type="email"
                        :placeholder="$t('User Email Address')"
                        v-model="manager.email"
                    />

                    <error-view field="email" :errors="errors"/>

                    <p v-show="!manager.id">
                        {{ $t('Please provide email address of your existing user.') }}
                    </p>
                </el-form-item>

                <el-form-item :label="$t('Permissions')">
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

                    <error-view field="permissions" :errors="errors"/>
                </el-form-item>
            </el-form>

            <span slot="footer" class="dialog-footer">
                <el-button type="primary" size="small" @click="store" icon="el-icon-success">
                    {{ $t('Save') }}
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

    props: ['managers', 'pagination'],

    components: {
        ErrorView,
        Confirm
    },

    data() {
        return {
            loading: false,
            permissions: {},
            modal: false,
            manager: {},
            errors: new Errors(),
            managersData: []
        };
    },

    methods: {
        handleFetchedData() {
            this.managersData = this.managers.managers?.data;
            this.permissions = this.managers.permissions;
            this.pagination.total = this.managers.managers?.total;
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

            const url = FluentFormsGlobal.$rest.route('storeManager');
            let data = {
                manager: this.manager
            }

            FluentFormsGlobal.$rest.post(url, data)
                .then(response => {
                    this.modal = false;
                    this.$emit('add-manager', response.manager);
                    this.handleFetchedData();
                    this.$success(response.message);
                })
                .catch(e => {
                    this.errors.record(e.errors);
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        edit(manager) {
            this.modal = true;
            this.manager = Object.assign({}, manager);
            this.handleFetchedData();
            this.errors.clear();
        },

        remove(manager) {
            const url = FluentFormsGlobal.$rest.route('deleteManager');
            let data = {
                id: manager.id
            }

            FluentFormsGlobal.$rest.delete(url, data)
                .then(response => {
                    this.modal = false;
                    this.$emit('delete-manager', response.manager);
                    this.handleFetchedData();
                    this.$success(response.message);
                })
                .catch(e => {
                    this.errors.record(e.errors);
                })
                .finally(() => {
                    this.loading = false;
                });
        },

        goToPage(value) {
            this.$emit('current-page', value);
        }
    },

    updated() {
        this.handleFetchedData();
    }
};
</script>

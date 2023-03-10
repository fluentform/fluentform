<template>
    <div class="ff_block_item">
        <el-row :gutter="6">
            <el-col :md="18">
                <h6 class="ff_block_title mb-1">{{ $t('Advanced') }}</h6>
                <p class="ff_block_text">{{ $t('Administrators have full access to Fluent Forms.Add other managers giving specific permissions.') }}</p>
            </el-col>
            <el-col :md="6" class="text-right">
                <el-button
                    type="primary"
                    icon="ff-icon ff-icon-plus"
                    @click="showForm()"
                    size="medium"
                >
                    {{ $t('Add Manager') }}
                </el-button>
            </el-col>
        </el-row>

        <div class="ff_managers_list mt-4">
            <div class="ff_table_wrap">
                <el-table class="ff_table_s2" :data="managersData">
                    <el-table-column :label="$t('ID')" prop="id" width="70"/>
                    <el-table-column :label="$t('Name')" width="180">
                        <template slot-scope="scope">
                            {{ scope.row.first_name }} {{ scope.row.last_name }}
                        </template>
                    </el-table-column>


                    <el-table-column :label="$t('Email')" prop="email" width="240" />

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
                                class="el-button--soft el-button--icon"
                                size="mini"
                                type="primary"
                                icon="ff-icon ff-icon-edit"
                                @click="edit(scope.row)"
                            />
                            <confirm @on-confirm="remove(scope.row)">
                                <el-button
                                    class="el-button--soft el-button--icon"
                                    size="mini"
                                    type="danger"
                                    icon="ff-icon ff-icon-trash"
                                />
                            </confirm>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
    
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
            width="36%"
            class="ff_managers_form"
        >
            <div slot="title">
                <h5>{{getModalTitle()}}</h5>
            </div>

            <el-form :data="manager" label-position="top" class="mt-4">
                <el-form-item>
                    <template slot="label">
                        <h6>{{$t('User Email')}}</h6>
                    </template>
                    <el-input
                        type="email"
                        :placeholder="$t('User Email Address')"
                        v-model="manager.email"
                    />

                    <error-view field="email" :errors="errors"/>

                    <p class="text-note mt-2" v-show="!manager.id">
                        {{ $t('Please provide email address of your existing user.') }}
                    </p>
                </el-form-item>

                <el-form-item>
                    <template slot="label">
                        <h6>{{$t('Permissions')}}</h6>
                    </template>

                    <el-checkbox-group v-model="manager.permissions" class="ff_checkbox_group_col_2">
                        <el-checkbox
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

            <div slot="footer" class="dialog-footer">
                <btn-group class="ff_btn_group_half">
                    <btn-group-item>
                        <el-button @click="modal = false" type="info" class="el-button--soft">
                            {{$t('Cancel')}}
                        </el-button>
                    </btn-group-item>
                    <btn-group-item>
                        <el-button type="primary" @click="store">
                            {{ $t('Save') }}
                        </el-button>
                    </btn-group-item>
                </btn-group>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import ErrorView from "@/common/errorView.vue";
import Confirm from "@/admin/components/confirmRemove.vue";
import BtnGroup from '@/admin/components/BtnGroup/BtnGroup.vue';
import BtnGroupItem from '@/admin/components/BtnGroup/BtnGroupItem.vue';

export default {
    name: "Managers",

    props: ['managers', 'pagination'],

    components: {
        ErrorView,
        Confirm,
        BtnGroup,
        BtnGroupItem
    },

    data() {
        return {
            loading: false,
            // managers: [],
            // pagination: {
            //     total: 0,
            //     current_page: 1,
            //     per_page: 3
            // },
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

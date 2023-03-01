<template>
    <!-- <div v-loading="loading"> -->
    <div class="ff_managers_settings">
        <div class="ff_manager_settings_wrapper">
            <div class="ff_manager_settings_nav">
                <ul>
                    <li
                        :class="{ ff_active: currentPage == 'roleBased' }"
                        @click="currentPage = 'roleBased'"
                    >
                        {{ $t('Role Based') }}
                    </li>

                    <li
                        :class="{ ff_active: currentPage == 'advanced' }"
                        @click="currentPage = 'advanced'"
                    >
                        {{ $t('Advanced') }}
                    </li>
                </ul>
            </div>

            <privacy @filteredCapability="filteredCapability" :roles="roles" :capability="capability"
                     v-show="currentPage == 'roleBased'"/>

            <managers @add-manager="addManager" @delete-manager="deleteManager" @current-page="setCurrentPage"
                      :managers="managers" :pagination="pagination" v-show="currentPage == 'advanced'">
                {{ $t('Advanced form') }}
            </managers>
        </div>
    </div>
</template>

<script>
import Privacy from "./Managers/Privacy.vue";
import Managers from "./Managers/Managers.vue";

export default {
    name: "ManagersSettings",

    components: {
        Privacy,
        Managers
    },

    data() {
        return {
            loading: false,
            currentPage: "roleBased",
            roles: [],
            managers: [],
            capability: ["administrator"],
            pagination: {
                total: 0,
                current_page: 1,
                per_page: 10
            }
        };
    },
    methods: {
        fetch() {
            this.loading = true;

            const url = FluentFormsGlobal.$rest.route('getRolesAndManagers');
            let data = {
                per_page: this.pagination.per_page,
                page: this.pagination.current_page
            }

            FluentFormsGlobal.$rest.get(url, data)
                .then(response => {
                    this.roles = response.roles.roles;
                    this.capability = response.roles.capability;
                    this.managers = response.managers;
                })
                .catch(e => {

                })
                .finally(() => {
                    this.loading = false;
                });
        },
        filteredCapability(value) {
            this.capability = value;
        },
        addManager(value) {
            const existedIndex = this.managers.managers.data.findIndex(m => m.id === value.id);

            if (existedIndex >= 0) {
                this.managers.managers.data.splice(existedIndex, 1, value);
            } else {
                this.managers.managers.data.push(value);
            }
        },
        deleteManager(value) {
            const existedIndex = this.managers.managers.data.findIndex(m => m.id === value.id);

            if (existedIndex >= 0) {
                this.managers.managers.data.splice(existedIndex, 1);
            }
        },
        setCurrentPage(value) {
            this.pagination.current_page = value;
            this.fetch();
        }
    },
    mounted() {
        this.fetch();
    }
};
</script>

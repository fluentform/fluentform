<template>
    <!-- <div v-loading="loading"> -->

    <card class="ff_managers_settings">
        <card-head>
            <h5 class="title">{{ $t('Managers') }}</h5>
        </card-head>
        <card-body>

            <privacy @filteredCapability="filteredCapability" :roles="roles" :capability="capability"
                     v-show="currentPage == 'roleBased'"/>
            <hr class="mt-5 mb-4">

            <managers @add-manager="addManager" @delete-manager="deleteManager" @current-page="setCurrentPage"
                      :managers="managers" :pagination="pagination">
                {{ $t('Advanced form') }}
            </managers>

        </card-body>
    </card>
</template>

<script>
import Privacy from "./Managers/Privacy.vue";
import Managers from "./Managers/Managers.vue";
import Card from '@/admin/components/Card/Card.vue';
import CardHead from '@/admin/components/Card/CardHead.vue';
import CardBody from '@/admin/components/Card/CardBody.vue';

export default {
    name: "ManagersSettings",

    components: {
        Privacy,
        Managers,
        Card,
        CardHead,
        CardBody
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

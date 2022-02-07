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
                        Role Based
                    </li>

                    <li
                        :class="{ ff_active: currentPage == 'advanced' }"
                        @click="currentPage = 'advanced'"
                    >
                        Advanced
                    </li>
                </ul>
            </div>

            <privacy v-show="currentPage == 'roleBased'" />

            <managers v-show="currentPage == 'advanced'">
                Advanced form
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
            loading: true,
            currentPage: "roleBased",
        };
    }
};
</script>

<template>
    <card class="ff_managers_settings">
        <card-head>
            <h5 class="title">{{ $t('Permissions') }}</h5>
        </card-head>
        <card-body>
            <privacy/>
            <hr class="mt-5 mb-4">
            <managers>{{ $t('Advanced form') }}</managers>
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
    }
};
</script>

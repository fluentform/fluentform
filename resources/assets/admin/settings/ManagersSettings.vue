<template>
    <div class="ff_managers_settings ff_card">
        <div class="ff_card_head">
            <h5 class="title">{{ $t('Managers') }}</h5>
        </div>
        <div class="ff_card_body">
            <Privacy />
            <hr class="mt-5 mb-4">
            <Managers />
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
    mounted(){
        jQuery('body').addClass('ff_footer_none');
    }
};
</script>

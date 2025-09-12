<template>
    <withLabel :item="item">
        <div class="ff-el-form-captcha-img-wrapper">
            <img :src="plugin_url+'img/friendlycaptcha-placeholder.png'" :alt="$t('friendlycaptcha-placeholder')">
        </div>
    </withLabel>
</template>

<script>
import withLabel from './withLabel.vue';

export default {
    name: 'friendlycaptcha',
    props: ['item'],
    components: {
        withLabel
    },
    data() {
        return {
            plugin_url: window.FluentFormApp.plugin_public_url
        }
    }
}
</script>

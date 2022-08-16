<template>
    <el-form-item :label="item.settings.label" :class="{['ff-el-form-'+item.settings.label_placement]: item.settings.label_placement }">
        <img style="max-width: 60px;" :src="plugin_url+'img/recaptcha-placeholder.png'" alt="recaptcha-placeholder">
    </el-form-item>
</template>

<script>
export default {
    name: 'recaptcha',
    props: ['item'],
    data() {
        return {
            plugin_url: window.FluentFormApp.plugin_public_url
        }
    }
}
</script>

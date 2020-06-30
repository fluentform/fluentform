<template>
    <el-form-item :label="item.settings.label">
        <img :src="plugin_url+'img/recaptcha-placeholder.png'" alt="recaptcha-placeholder">
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
<style scoped>
    img {
        max-height: 60px;
    }
</style>
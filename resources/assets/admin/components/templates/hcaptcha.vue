<template>
    <el-form-item :label="item.settings.label">
        <img style="max-width: 60px;" :src="plugin_url+'img/hcaptcha-placeholder.png'" alt="hcaptcha-placeholder">
    </el-form-item>
</template>

<script>
export default {
    name: 'hcaptcha',
    props: ['item'],
    data() {
        return {
            plugin_url: window.FluentFormApp.plugin_public_url
        }
    }
}
</script>

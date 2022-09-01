<template>
    <el-form-item :label="item.settings.label" :class="{['ff-el-form-'+item.settings.label_placement]: item.settings.label_placement }">
      <div class="ff-el-form-img-wrapper">
        <img :src="plugin_url+'img/hcaptcha-placeholder.png'" alt="hcaptcha-placeholder">
      </div>
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

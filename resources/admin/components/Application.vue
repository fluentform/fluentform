<template>
    <div class="fl_app body">
        <router-view v-slot="{ Component, route }">
            <component :is="Component" :key="route.fullPath" />
        </router-view>
    </div>
</template>

<script>
    export default {
        name: 'Application',
        mounted() {
            jQuery('.notice-warning, .notice-error').remove();
        }
    };
</script>

<style scoped>
    .body {
        padding: 10px;
        font-size: 16px;
        background: white;
    }
</style>
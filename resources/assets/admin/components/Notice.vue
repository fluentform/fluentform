<template>
    <div class="ff_alert" :class="type">
        <slot />
    </div>
</template>

<script>
    export default {
        name: "Notice",
        props: ['type']
    }
</script>

<template>
    <a href="#" class="ff_tab_link" @click="$emit('click')"><slot/></a>
</template>

<script>
    export default {
        name: 'TabLink'
    }
</script>

<template>
    <a href="#" class="ff_tab_link" @click.prevent="$emit('click')"><slot/></a>
</template>

<script>
    export default {
        name: 'TabLink'
    }
</script>

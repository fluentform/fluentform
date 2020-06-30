<template>
    <div v-html="listItem.text"></div>
</template>
<script>
    export default {
        name: 'infoBlock',
        props: ['listItem']
    };
</script>

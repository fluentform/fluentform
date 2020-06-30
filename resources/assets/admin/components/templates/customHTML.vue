<template>
    <div class="ff_editor_html" v-html="item.settings.html_codes"></div>
</template>

<script>
export default {
    name: 'customHTML',
    props: ['item'],
}
</script>
<template>
    <div class="section-break" :class="'text-' + item.settings.align">
        <h4 class="section-break__title">{{ item.settings.label }}</h4>
        <div v-html="item.settings.description"></div>
        <hr>
    </div>
</template>

<script>
export default {
    name: 'section_break',
    props: ['item']
}
</script>


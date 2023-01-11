<template>
    <div class="ff_section_break" :class="'text-' + item.settings.align">
        <h4 class="ff_section_break_title">{{ item.settings.label }}</h4>
        <div class="ff_section_break_desc" v-html="item.settings.description"></div>
        <hr>
    </div>
</template>

<script>
export default {
    name: 'section_break',
    props: ['item']
}
</script>


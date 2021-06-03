<template>
    <div class="welcome_screen" :class="'text-' + item.settings.align">
        <h4 class="section-break__title">{{ item.settings.label }}</h4>
        <div v-html="item.settings.description"></div>
        <div class="ffc_btn_wrapper">
            <custom-button :item="item" />
            <div class="fcc_btn_help">press <strong>Enter ↵</strong></div>
        </div>
    </div>
</template>

<script>
import customButton from './customButton';
export default {
    name: 'section_break',
    props: ['item'],
    components: {
        customButton
    }
}
</script>


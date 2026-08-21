<template>
    <div class="section-break" :class="'text-' + item.settings.align">
        <h4 class="section-break__title">{{ item.settings.label }}</h4>
        <div class="ff_editor_html" v-html="html"></div>
        <hr>
    </div>
</template>

<script>
import sanitizeHtml from '../../../common/sanitizeHtml';
export default {
    name: 'section_break',
    props: ['item'],
	computed: {
		html() {
			return sanitizeHtml(this.item.settings.description);
		}
	}
}
</script>

<template>
    <div class="ff_editor_html" v-html="html"></div>
</template>

<script>
import sanitizeHtml from '../../../common/sanitizeHtml';
export default {
    name: 'customHTML',
    props: ['item'],
	computed: {
		html() {
			return sanitizeHtml(this.item.settings.html_codes);
		}
	}
}
</script>
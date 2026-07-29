<template>
	<div>
		<label>{{ listItem.label }}</label>
		<input type="text" v-model="editItem.attributes['data-name']"/>
	</div>
</template>

<script>
	export default {
		name: 'data-name',
		props: ['listItem', 'editItem'],
		data() {
			return {

			};
		}
	};
</script>

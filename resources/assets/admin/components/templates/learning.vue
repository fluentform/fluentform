<template>
	<div>
		<el-label :label="item.settings.label"></el-label>
		<el-input></el-input>
	</div>
</template>

<script>
	import elLabel from '../includes/el-label';

	export default {
		name: 'learning',
		components: {elLabel},
		props: ['item'],
		computed: {
	        required() {
	            return this.item.settings.validation_rules.required && this.item.settings.validation_rules.required.value;
	        }
	    }
	};
</script>

<style>
	
</style>
<template>
	<slider-with-unit
		:label="$t(item.label)"
		:config="{px_max: 1000, em_rem_max : 62}"
		:units="['%', 'px', 'em', 'ram', 'custom']"
		:item="item"
		@update:itemValue="value => item.value = value"
		@update:itemType="type => item.type = type"
	/>
</template>
<script type="text/babel">
    import SliderWithUnit from './SliderWithUnit';
    export default {
        name: 'ff_width',
	    components: { SliderWithUnit },
	    props: ['item']
    }
</script>
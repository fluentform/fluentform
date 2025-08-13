<template>
	<slider-with-unit
		:label="$t(item.label)"
		:config="item.config"
		:units="item.units"
		:item="valueItem"
		@update:itemValue="value => valueItem.value = value"
		@update:itemType="type => valueItem.type = type"
	/>
</template>

<script>
import SliderWithUnit from './SliderWithUnit';
export default {
	name: 'UnitValue',
	components: { SliderWithUnit },
	props: ['item', 'valueItem']
}
</script>
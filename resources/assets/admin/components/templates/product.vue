<template>
	<div>
		<p>
			<strong>
				<el-label :label="item.settings.label"></el-label>
			</strong>
		</p>

		<template v-if="fieldType == 'single'">
			<p>
				<el-label :label="$t('Price: $') + item.settings.product_price"></el-label>
				<el-input type="text" value="" v-if="!isQuantityDisabled"></el-input>
			</p>
		</template>

		<template v-else-if="fieldType == 'dropdown'">
			<p>
				<el-form-item label="">
		            <el-select :value="defaultSelectedOption" placeholder="" class="el-fluid">
		                <el-option value="" label=""></el-option>
		        	</el-select>
		        </el-form-item>
			</p>
		</template>

		<template v-else-if="fieldType == 'radio'"  v-for="(text, value, i) in radioOptions">
			<p :key="i">
	            <el-radio
	            v-model="defaultSelectedOption"
	            :label="text"
	            :key="value"
	            >{{text}}</el-radio>
			</p>
		</template>

		<p><el-label :label="item.settings.description"></el-label></p>
	</div>
</template>

<script>
	import elLabel from '../includes/el-label';

	export default {
		name: 'product',
		components: {elLabel},
		props: ['item'],
		computed: {
			radioOptions() {
	            return this.item.settings.grid_columns;
	        },
	        fieldType() {
	        	return this.item.settings.product_type;
	        },
	        defaultSelectedOption() {
	        	return this.item.settings.grid_columns[
	        		Object.values(this.item.settings.selected_grids)[0]
	        	];
	        },
	        isQuantityDisabled() {
	        	return this.item.settings.disable_quantity_field;
	        }
	    }
	};
</script>

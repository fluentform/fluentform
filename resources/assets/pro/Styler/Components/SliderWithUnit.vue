<template>
	<div class="ff-type-control ff-type-control-slider">
		<div class="">
			<label class="ff-control-title">
				{{ $t(label) }}
			</label>
			<div class="ff-type-value ff-control-input-wrapper">
				<el-select size="mini" v-model="itemType" :placeholder="$t('Unit')">
					<el-option
						v-for="option in options"
						:key="option"
						:label="option"
						:value="option"/>
				</el-select>
			</div>
		</div>
		<div class="ff-type-slider">
			<el-input type="text" class="ff-type-custom" size="mini" ref="customInputValue" v-if="isCustomType"
			          v-model="customValue"/>
			<el-slider
				v-else
				v-model="itemValue"
				show-input
				input-size="mini"
				:min="min"
				:max="max"
				:step="step"/>
		</div>
	</div>
</template>

<script>

export default {
	name: 'SliderWithUnit',
	props: ['label', 'item', 'config', 'units'],
	emits: ['update:itemValue', 'update:itemType'],
	data() {
		return {
			options: (this.units && this.units.length > 0 ) ? this.units : ['px', 'em', 'rem', 'custom'],
			min: 0,
			max: 100,
			step: 1
		}
	},
	methods: {
		setConfig(type) {
			type ||= this.item.type;
			let min, max, step;
			if ('px' === type) {
				max = this.config?.px_max || 100;
				min = this.config?.px_min || 0;
				step = this.config?.px_step || 1;
			} else if ('%' === type) {
				min = this.config?.percent_min || 0;
				max = this.config?.percent_max || 100;
				step = this.config?.percent_step || 1;
			} else if('em' === type || 'rem' === type) {
				min = this.config?.em_rem_min || 0;
				max = this.config?.em_rem_max || 10;
				step = this.config?.em_rem_step || 0.1;
			} else if('deg' === type) {
				min = this.config?.deg_min || 0;
				max = this.config?.deg_max || 360;
				step = this.config?.deg_step || 1;
			} else if('grad' === type) {
				min = this.config?.grad_min || 0;
				max = this.config?.grad_max || 400;
				step = this.config?.grad_step || 1;
			} else if('rad' === type) {
				min = this.config?.rad_min || -6.23;
				max = this.config?.rad_max || 6.23;
				step = this.config?.rad_step || 0.001;
			} else if('turn' === type) {
				min = this.config?.turn_min || -1;
				max = this.config?.turn_max || 1;
				step = this.config?.turn_step || 0.01;
			} else {
				min = this.config?.other_min || 0;
				max = this.config?.other_max || 100;
				step = this.config?.other_step || 1;
			}
			this.min = Number(min || 0);
			this.max = Number(max || 100);
			this.step = Number(step || 1);
		},
	},
	computed: {
		itemValue: {
			get() {
				return this.item.value ? (isNaN(this.item.value) ? undefined : +this.item.value) : undefined;
			},
			set(value) {
				if (value === undefined || (value === 0 && this.item.value === '') || (value === 0 && this.item.value === '0')) return;
				this.$emit('update:itemValue', value);
			}
		},
		itemType: {
			get() {
				return this.item.type || 'px';
			},
			set(type) {
				if (!type || type === this.itemType) return;
				this.$emit('update:itemType', type);
				if (this.isCustomType) {
					setTimeout(() => {
						this.$refs.customInputValue && this.$refs.customInputValue.focus();
					}, 100)
				} else {
					this.setConfig(type);
				}
				this.$emit('update:itemValue', '');
			}
		},
		customValue: {
			get() {
				return 'custom' === this.item.type ? (this.item.value || '') : '';
			},
			set(value) {
				if (value === this.customValue) return;
				this.itemValue = value;
			}
		},
		isCustomType () {
			return 'custom' === this.item.type;
		}
	},
	created() {
		this.setConfig()
	}
}
</script>
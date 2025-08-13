<template>
	<div class="ff-control-content ff-control-background">
		<div class="ff-control-background-head">
			<div class="ff-control-field">
				<label class="ff-control-title ff-control-title-auto">
					{{ $t(item.label) }}
				</label>
				<div class="ff-control-input-wrapper ff-control-input-wrapper-auto">
					<el-switch
						v-model="valueItem.type"
						active-value="gradient"
						inactive-value="classic"
						active-color="#1A7EFB"
						inactive-color="#1A7EFB"
						:active-text="$t('Gradient')"
						:inactive-text="$t('Classic')">
					</el-switch>
				</div>
			</div>
		</div>
		<div class="ff-control-background-body">
			<template v-if="!isGradient">
				<div class="ff-control-field">
					<photo-widget enable_clear="yes" v-model="valueItem.image.url" :for_advanced_option="false"/>
				</div>
				<template v-if="valueItem.image.url">
					<div class="ff-control-field">
						<label class="ff-control-title">
                            {{ $t('Position') }}
						</label>
						<div class="ff-control-input-wrapper">
							<el-select size="mini" v-model="valueItem.image.position.value" :placeholder="$t('Select')">
								<el-option
									v-for="(option, i) in positionOptions"
									:key="option.value + i"
									:label="$t(option.label)"
									:value="option.value">
								</el-option>
							</el-select>
						</div>
					</div>
					<div class="ff-control-field" v-if="valueItem.image.position.value === 'custom'" >
						<slider-with-unit
							:label="$t('X Position')"
							:item="valueItem.image.position.valueX"
							:config="{px_max: 800, px_min : -800, em_rem_max: 100, em_rem_min : -100}"
							@update:itemValue="value => valueItem.image.position.valueX.value = value"
							@update:itemType="type => valueItem.image.position.valueX.type = type"
						/>
						<slider-with-unit
							:label="$t('Y Position')"
							:item="valueItem.image.position.valueY"
							:config="{px_max: 800, px_min : -800, em_rem_max: 100, em_rem_min : -100}"
							@update:itemValue="value => valueItem.image.position.valueY.value = value"
							@update:itemType="type => valueItem.image.position.valueY.type = type"
						/>
					</div>
					<div class="ff-control-field">
						<label class="ff-control-title">
                            {{ $t('Attachment') }}
						</label>
						<div class="ff-control-input-wrapper">
							<el-select size="mini" v-model="valueItem.image.attachment" :placeholder="$t('Select')">
								<el-option
									v-for="(option, i) in attachmentOptions"
									:key="option.value + i"
									:label="$t(option.label)"
									:value="option.value">
								</el-option>
							</el-select>
						</div>
					</div>
					<div class="ff-control-field">
						<label class="ff-control-title">
                            {{ $t('Repeat') }}
						</label>
						<div class="ff-control-input-wrapper">
							<el-select size="mini" v-model="valueItem.image.repeat" :placeholder="$t('Select')">
								<el-option
									v-for="(option, i) in repeatOptions"
									:key="option.value + i"
									:label="$t(option.label)"
									:value="option.value">
								</el-option>
							</el-select>
						</div>
					</div>
					<div class="ff-control-field">
						<label class="ff-control-title">
                            {{ $t('Size') }}
						</label>
						<div class="ff-control-input-wrapper">
							<el-select size="mini" v-model="valueItem.image.size.value" :placeholder="$t('Select')">
								<el-option
									v-for="(option, i) in sizeOptions"
									:key="option.value + i"
									:label="$t(option.label)"
									:value="option.value">
								</el-option>
							</el-select>
						</div>
					</div>
					<div class="ff-control-field" v-if="valueItem.image.size.value === 'custom'">
						<slider-with-unit
							:label="$t('X Size')"
							:item="valueItem.image.size.valueX"
							:config="{px_max: 1000,em_rem_max: 100}"
							@update:itemValue="value => valueItem.image.size.valueX.value = value"
							@update:itemType="type => valueItem.image.size.valueX.type = type"
						/>
						<slider-with-unit
							:label="$t('Y Size')"
							:item="valueItem.image.size.valueY"
							:config="{px_max: 1000, em_rem_max: 100}"
							@update:itemValue="value => valueItem.image.size.valueY.value = value"
							@update:itemType="type => valueItem.image.size.valueY.type = type"
						/>
					</div>
				</template>
			</template>
			<template v-else>
				<div class="ff-control-field">
					<div class="ff-type-control">
						<label class="ff-control-title">
                            {{ $t('Primary Color') }}
						</label>
						<div class="ff-control-input-wrapper">
							<el-color-picker
								size="mini"
								@active-change="val => valueItem.gradient.primary.color = val" show-alpha
								v-model="valueItem.gradient.primary.color"/>
						</div>

					</div>
				</div>
				<div class="ff-control-field"
				     v-if="hasPrimaryColor"
				>
					<slider-with-unit
						:label="$t('Location')"
						:item="valueItem.gradient.primary.location"
						:config="{px_max: 1000, percent_max: 100}"
						:units="['%', 'px', 'custom']"
						@update:itemValue="value => valueItem.gradient.primary.location.value = value"
						@update:itemType="type => valueItem.gradient.primary.location.type = type"
					/>
				</div>
				<div class="ff-control-field">
					<div class="ff-type-control">
						<label class="ff-control-title">
                            {{ $t('Secondary Color') }}
						</label>
						<div class="ff-control-input-wrapper">
							<el-color-picker
								size="mini"
								@active-change="val => valueItem.gradient.secondary.color = val" show-alpha
								v-model="valueItem.gradient.secondary.color"/>
						</div>
					</div>
				</div>
				<div class="ff-control-field"
				     v-if="hasSecondaryColor"
				>
					<slider-with-unit
						:label="$t('Location')"
						:item="valueItem.gradient.secondary.location"
						:config="{px_max: 1000, percent_max: 100}"
						:units="['%', 'px', 'custom']"
						@update:itemValue="value => valueItem.gradient.secondary.location.value = value"
						@update:itemType="type => valueItem.gradient.secondary.location.type = type"
					/>
				</div>
				<div class="ff-control-field"
				     v-if="hasPrimaryColor && hasSecondaryColor"
				>
					<div class="ff-type-control">
						<label class="ff-control-title">
                            {{ $t('Type') }}
						</label>
						<div class="ff-control-input-wrapper">
							<el-select size="mini" v-model="valueItem.gradient.type" :placeholder="$t('Select')">
								<el-option
									v-for="(option, i) in [{label: 'Radial', value: 'radial'}, {label : 'Linear', value:'linear'}]"
									:key="option.value + i"
									:label="$t(option.label)"
									:value="option.value">
								</el-option>
							</el-select>
						</div>
					</div>
				</div>
				<div class="ff-control-field"
				     v-if="hasPrimaryColor && hasSecondaryColor"
				>
					<slider-with-unit
						v-if="valueItem.gradient.type === 'linear'"
						:label="$t('Angle')"
						:units="['deg', 'grad', 'rad', 'turn', 'custom']"
						:item="valueItem.gradient.angle"
						@update:itemValue="value => valueItem.gradient.angle.value = value"
						@update:itemType="type => valueItem.gradient.angle.type = type"
					/>
					<div v-else class="ff-type-control">
						<label class="ff-control-title">
                            {{ $t('Position') }}
						</label>
						<div class="ff-control-input-wrapper">
							<el-select size="mini" v-model="valueItem.gradient.position" :placeholder="$t('Select')">
								<el-option
									v-for="(option, i) in positionOptions.filter(o => o.value !== '' && o.value !== 'custom')"
									:key="option.value + i"
									:label="$t(option.label)"
									:value="option.value">
								</el-option>
							</el-select>
						</div>
					</div>
				</div>
			</template>
		</div>
	</div>
</template>
<script type="text/babel">
import PhotoWidget from '@fluentform/common/PhotoUploader';
import SliderWithUnit from './SliderWithUnit';

export default {
	name: 'ff_background_image',
	props: ['item', 'valueItem'],
	components: {
		SliderWithUnit,
		PhotoWidget
	},
	data() {
		return {
			image: '',
			positionOptions: [
				{
					label: 'Default',
					value: ''
				},
				{
					label: 'Center Center',
					value: 'center center'
				},
				{
					label: 'Center Left',
					value: 'center left'
				},
				{
					label: 'Center Right',
					value: 'center right'
				},
				{
					label: 'Top Center',
					value: 'top center'
				},
				{
					label: 'Top Left',
					value: 'top left'
				},
				{
					label: 'Top Right',
					value: 'top right'
				},
				{
					label: 'Bottom Center',
					value: 'bottom center'
				},
				{
					label: 'Bottom Left',
					value: 'bottom left'
				},
				{
					label: 'Bottom Right',
					value: 'bottom right'
				},
				{
					label: 'Custom',
					value: 'custom'
				}
			],
			sizeOptions: [
				{
					label: 'Default',
					value: ''
				},
				{
					label: 'Auto',
					value: 'auto'
				},
				{
					label: 'Cover',
					value: 'cover'
				},
				{
					label: 'Contain',
					value: 'contain'
				},
				{
					label: 'Custom',
					value: 'custom'
				}
			],
			attachmentOptions: [
				{
					label: 'Default',
					value: ''
				},
				{
					label: 'Scroll',
					value: 'scroll'
				},
				{
					label: 'Fixed',
					value: 'fixed'
				}
			],
			repeatOptions: [
				{
					label: 'Default',
					value: ''
				},
				{
					label: 'Repeat',
					value: 'repeat'
				},
				{
					label: 'No-repeat',
					value: 'no-repeat'
				},
				{
					label: 'Repeat-x',
					value: 'repeat-x'
				},
				{
					label: 'Repeat-y',
					value: 'repeat-y'
				}
			],
		}
	},
	watch: {
		'valueItem.image.url': function (value) {
			if (value === '') {
				this.resetImage();
			}
		}
	},
	methods: {
		handleChange(val) {
			this.valueItem.color = val;
		},
		resetImage() {
			this.valueItem.image.attachment = '';
			this.valueItem.image.repeat = '';
			this.valueItem.image.position.value = '';
			this.valueItem.image.position.valueX.value = '';
			this.valueItem.image.position.valueX.type = 'px';
			this.valueItem.image.position.valueY.value = '';
			this.valueItem.image.position.valueY.type = 'px';
			this.valueItem.image.size.value = '';
			this.valueItem.image.size.valueX.value = '';
			this.valueItem.image.size.valueX.type = 'px';
			this.valueItem.image.size.valueY.value = '';
			this.valueItem.image.size.valueY.type = 'px';
		}
	},
	computed: {
		isGradient() {
			return this.valueItem.type === 'gradient';
		},
		hasPrimaryColor() {
			return !!this.valueItem.gradient.primary.color
		},
		hasSecondaryColor() {
			return !!this.valueItem.gradient.secondary.color
		},
	}
}
</script>
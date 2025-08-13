<template>
    <div class="ff-control-content">
        <div class="ff-control-field">
            <label class="ff-control-title">
                {{ $t(item.label) }}
            </label>
            <div class="ff-control-input-wrapper">
                <el-popover
                    width="300"
                    v-model="visible">
                    <div class="ff_type_settings">
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t('Color') }}
                            </label>
                            <div class="ff-type-value" style="margin-left:200px;">
                                <el-color-picker size="mini" v-model="valueItem.color" @active-change="handleChange"
                                                 show-alpha></el-color-picker>
                            </div>
                        </div>

	                    <slider-with-unit
		                    :label="$t('Horizontal')"
		                    :item="valueItem.horizontal"
		                    :config="{px_max: 30, px_min : -30, em_rem_max: 4, em_rem_min : -4}"
		                    @update:itemValue="value => valueItem.horizontal.value = value"
		                    @update:itemType="type => valueItem.horizontal.type = type"
	                    />
	                    <slider-with-unit
		                    :label="$t('Vertical')"
		                    :item="valueItem.vertical"
		                    :config="{px_max: 30, px_min : -30, em_rem_max: 4, em_rem_min : -4}"
		                    @update:itemValue="value => valueItem.vertical.value = value"
		                    @update:itemType="type => valueItem.vertical.type = type"
	                    />
	                    <slider-with-unit
		                    :label="$t('Blur')"
		                    :item="valueItem.blur"
		                    :config="{px_max: 30, em_rem_max: 4}"
		                    @update:itemValue="value => valueItem.blur.value = value"
		                    @update:itemType="type => valueItem.blur.type = type"
	                    />
	                    <slider-with-unit
		                    :label="$t('Spread')"
		                    :item="valueItem.spread"
		                    :config="{px_max: 30, em_rem_max: 4}"
		                    @update:itemValue="value => valueItem.spread.value = value"
		                    @update:itemType="type => valueItem.spread.type = type"
	                    />
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t('Position') }}
                            </label>
                            <div class="ff-type-value">
                                <el-select size="mini" v-model="valueItem.position" :placeholder="$t('Select')">
                                    <el-option
                                        v-for="(item, key) in position"
                                        :key="key"
                                        :label="$t(item)"
                                        :value="key">
                                    </el-option>
                                </el-select>
                            </div>
                        </div>
                    </div>
                    <el-button type="mini" slot="reference" class="el-button--icon"><i class="el-icon-edit"></i></el-button>
                </el-popover>
                <el-button
                    class="el-button--icon"
                    type="mini"
                    icon="el-icon-refresh-right"
                    v-if="!isChanged"
                    @click="reset"></el-button>
            </div>
        </div>
    </div>
</template>
<script type="text/babel">
    import isEqual from 'lodash/isEqual';
    import SliderWithUnit from './SliderWithUnit';
    import { Boxshadow, resetWithDefault } from '../stylerHelper';

    export default {
        name: 'ff_boxshadow',
	    components: { SliderWithUnit },
	    props: ['item', 'valueItem'],
        data() {
            return {
                visible: false,
                position: {
                    'outline': 'Outline',
                    'inset': 'Inset',
                },
                boxshadowDefault: (new Boxshadow()).value
            }
        },
        computed: {
            isChanged() {
                return isEqual(this.boxshadowDefault, this.valueItem);
            }
        },
        methods: {
            handleChange(val) {
                this.valueItem.color = val;
            },
            reset() {
	            resetWithDefault(this.valueItem, this.boxshadowDefault);
            }
        }
    }
</script>
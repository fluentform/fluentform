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
	                    <slider-with-unit
		                    :label="$t('Font Size')"
		                    :item="valueItem.fontSize"
		                    @update:itemValue="value => valueItem.fontSize.value = value"
		                    @update:itemType="type => valueItem.fontSize.type = type"
	                    />
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t('Font Weight') }}
                            </label>
                            <div class="ff-type-value">
                                <el-select size="mini" v-model="valueItem.fontWeight" :placeholder="$t('Select')">
                                    <el-option
                                        v-for="(item, key) in fontWeights"
                                        :key="key"
                                        :label="$t(item)"
                                        :value="key">
                                    </el-option>
                                </el-select>
                            </div>
                        </div>
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t('Transform') }}
                            </label>
                            <div class="ff-type-value">
                                <el-select size="mini" v-model="valueItem.transform" :placeholder="$t('Select')">
                                    <el-option
                                        v-for="(item, key) in transforms"
                                        :key="key"
                                        :label="$t(item)"
                                        :value="key">
                                    </el-option>
                                </el-select>
                            </div>
                        </div>
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t('Font Style') }}
                            </label>
                            <div class="ff-type-value">
                                <el-select size="mini" v-model="valueItem.fontStyle" :placeholder="$t('Select')">
                                    <el-option
                                        v-for="(item, key) in fontStyles"
                                        :key="key"
                                        :label="$t(item)"
                                        :value="key">
                                    </el-option>
                                </el-select>
                            </div>
                        </div>
                        <div class="ff-type-control">
                            <label class="ff-control-title">
                                {{ $t('Text Decoration') }}
                            </label>
                            <div class="ff-type-value">
                                <el-select size="mini" v-model="valueItem.textDecoration" :placeholder="$t('Select')">
                                    <el-option
                                        v-for="(item, key) in textDecorations"
                                        :key="key"
                                        :label="$t(item)"
                                        :value="key">
                                    </el-option>
                                </el-select>
                            </div>
                        </div>
	                    <slider-with-unit
		                    :label="$t('Line Height')"
		                    :item="valueItem.lineHeight"
		                    @update:itemValue="value => valueItem.lineHeight.value = value"
		                    @update:itemType="type => valueItem.lineHeight.type = type"
	                    />
	                    <slider-with-unit
		                    :label="$t('Letter Spacing')"
		                    :item="valueItem.letterSpacing"
		                    :config="{px_min : -100, em_rem_min : -10}"
		                    @update:itemValue="value => valueItem.letterSpacing.value = value"
		                    @update:itemType="type => valueItem.letterSpacing.type = type"
	                    />
	                    <slider-with-unit
		                    :label="$t('Word Spacing')"
		                    :item="valueItem.wordSpacing"
		                    :config="{px_min : -100, em_rem_min : -10}"
		                    @update:itemValue="value => valueItem.wordSpacing.value = value"
		                    @update:itemType="type => valueItem.wordSpacing.type = type"
	                    />
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
	import { Typography, resetWithDefault } from '../stylerHelper';

    export default {
        name: 'ff_typegraphy',
	    components: { SliderWithUnit },
	    props: ['item', 'valueItem'],
        data() {
            return {
                visible: false,
                hasChange: false,
                fontWeights: {
                    100: 100,
                    200: 200,
                    300: 300,
                    400: 400,
                    500: 500,
                    600: 600,
                    700: 700,
                    800: 800,
                    900: 900,
                    '': 'Default',
                    'normal': 'Normal',
                    'bold': 'Bold'
                },
                transforms: {
                    '': 'Default',
                    'uppercase': 'Uppercase',
                    'lowercase': 'Lowercase',
                    'capitalize': 'Capitalize',
                    'normal': 'Normal'
                },
                fontStyles: {
                    '': 'Default',
                    'normal': 'Normal',
                    'italic': 'Italic',
                    'oblique': 'Oblique'
                },
                textDecorations: {
                    '': 'Default',
                    'underline': 'Underline',
                    'overline': 'Overline',
                    'oblique': 'Oblique',
                    'line-through': 'Line Through',
                    'none': 'None',
                },
                default: new Typography().value
            }
        },
        computed: {
            isChanged() {
                return isEqual(this.default, this.valueItem);
            }              
        },
        methods: {
            reset() {
	            resetWithDefault(this.valueItem, this.default);
            }
        }
    }
</script>
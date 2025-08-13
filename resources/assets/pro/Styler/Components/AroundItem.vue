<template>
    <div class="ff-control-content">
        <div class="ff-control-field mb-2">
            <label class="ff-control-title">
                {{ $t(item.label) }}
            </label>
	        <div class="ff-control-input-wrapper">
		        <el-select size="mini" v-model="valueItem.type" :placeholder="$t('Unit')">
			        <el-option
				        v-for="option in options"
				        :key="option"
				        :label="option"
				        :value="option"/>
		        </el-select>
	        </div>
        </div>
        <div class="ff-control-input-wrapper ff_input_wrapper_full">
            <ul class="ff-control-dimensions">
                <li>
                    <input v-model="valueItem.top" :min="min" :step="step" :max="max" :type="isCustomType ? 'text' : 'number'" placeholder="" />
                    <label>Top</label>
                </li>
                <li>
                    <input :disabled="valueItem.linked == 'yes'" v-model="valueItem.right" :min="min" :step="step" :max="max" :type="isCustomType ? 'text' : 'number'" placeholder="" />
                    <label>Right</label>
                </li>
                <li>
                    <input :disabled="valueItem.linked == 'yes'" v-model="valueItem.left" :min="min" :step="step" :max="max" :type="isCustomType ? 'text' : 'number'" placeholder="" />
                    <label>Left</label>
                </li>
                <li>
                    <input :disabled="valueItem.linked == 'yes'" v-model="valueItem.bottom" :min="min" :step="step" :max="max" :type="isCustomType ? 'text' : 'number'" placeholder="" />
                    <label>bottom</label>
                </li>
                <li>
                    <span @click="handleLinkable()" class="ff-linked ff_item_linkable" :class="(valueItem.linked == 'yes') ? 'ff_item_linked' : ''">
                        <span  v-if="valueItem.linked == 'yes'" class="dashicons dashicons-editor-unlink"></span>
                        <span  v-else class="dashicons dashicons-admin-links"></span>
                    </span>
                </li>
            </ul>
        </div>
    </div>
</template>
<script type="text/babel">
    export default {
        name: 'ff_around_item',
        props: ['item', 'valueItem'],
	    data() {
			return {
				options: this.item.options || ['px', 'em', 'rem', 'custom'],
				min: 0,
				max: 1200,
				step: 1,
			}
	    },
        watch: {
            'valueItem.top'(value) {
				if (!this.isCustomType) {
					if (value > this.max) {
						value = this.max;
					} else if (value < this.min) {
						value = this.min;
					}
					this.valueItem.top = value;
				}
                if (this.valueItem.linked == 'yes') {
                    this.valueItem.right = value;
                    this.valueItem.bottom = value;
                    this.valueItem.left = value;
                }
            },
	        'valueItem.right'(value) {
				if (!this.isCustomType) {
					if (value > this.max) {
						value = this.max;
					} else if (value < this.min) {
						value = this.min;
					}
					this.valueItem.right = value;
				}
            },
	        'valueItem.left'(value) {
				if (!this.isCustomType) {
					if (value > this.max) {
						value = this.max;
					} else if (value < this.min) {
						value = this.min;
					}
					this.valueItem.left = value;
				}
            },
	        'valueItem.bottom'(value) {
				if (!this.isCustomType) {
					if (value > this.max) {
						value = this.max;
					} else if (value < this.min) {
						value = this.min;
					}
					this.valueItem.bottom = value;
				}
            },
	        'valueItem.type'(type) {
		        this.valueItem.top = '';
		        this.valueItem.right = '';
		        this.valueItem.bottom = '';
		        this.valueItem.left = '';
				this.setConfig(type);
	        }
        },
	    computed: {
			isCustomType() {
				return this.valueItem.type === 'custom';
			}
	    },
        methods: {
            handleLinkable() {
                if(this.valueItem.linked == 'yes') {
                    this.valueItem.linked = 'no';
                } else {
                    this.valueItem.linked = 'yes';
                }
            },
	        setConfig(type) {
		        let min = 0, max = 1200, step = 1;
		        if ('px' === type) {
					if (this.item.key === 'margin') {
						min = -1200;
					} else if (this.item.key === 'borderRadius') {
						max = 100;
					} else if (this.item.key === 'borderWidth') {
						max = 50;
					}
		        } else if ('%' === type) {
					max = 100;
		        } else {
			        step = 0.1;
			        if (this.item.key === 'margin') {
				        min = -100;
						max = 100;
			        } else if (this.item.key === 'borderRadius') {
				        max = 10;
			        } else if (this.item.key === 'borderWidth') {
				        max = 2;
			        } else {
						max = 100;
			        }
		        }
		        this.min = min;
		        this.max = max;
		        this.step = step;
	        }
        },
	    created() {
			this.setConfig(this.valueItem.type);
	    }
    }
</script>

<template>
    <div class="ff_border_config">
        <div class="ff_section_title" v-if="item.label">
            {{item.label}}
        </div>
        <div class="ff-control-content">

            <div class="ff-control-field ff_input_wrapper_full">
                <el-checkbox true-label="yes" false-label="no" v-model="item.value.status">{{item.status_label}}</el-checkbox>
            </div>
            <template v-if="item.value.status == 'yes'">
                <div style="margin-top: 15px" class="ff-control-field ff_each_style">
                    <label class="ff-control-title">
                        {{ $t('Border Type') }}
                    </label>
                    <div class="ff-control-input-wrapper">
                        <el-select size="mini" v-model="item.value.border_type" :placeholder="$t('Select')">
                            <el-option
                                v-for="(item, key) in borderTypes"
                                :key="key"
                                :label="$t(item)"
                                :value="key">
                            </el-option>
                        </el-select>
                    </div>
                </div>

                <div class="ff-control-field ff_each_style">
                    <label class="ff-control-title">
                        {{ $t('Border Color') }}
                    </label>
                    <div class="ff-control-input-wrapper">
                        <el-color-picker size="mini" @active-change="handleColorChange" show-alpha v-model="item.value.border_color"></el-color-picker>
                    </div>
                </div>

                <ff_around_item class="mb-3" :item="{ label: 'Border Width', key : 'borderWidth' }" :valueItem="item.value.border_width" />
                <ff_around_item v-if="item.value.border_radius"  :item="{ label: 'Border Radius', key : 'borderRadius' }" :valueItem="item.value.border_radius" />
            </template>

        </div>
    </div>
</template>
<script type="text/babel">
    import AroundItem from './AroundItem';

    export default {
        name: 'ff_border_config',
        components: {
            'ff_around_item': AroundItem
        },
        props: ['item'],
        data() {
            return {
                borderTypes: {
                    solid: 'Solid',
                    double: 'Double',
                    dotted: 'Dotted',
                    dashed: 'Dashed',
                    groove: 'Groove',
                    ridge: 'Ridge'
                }
            }
        },
        methods: {
            handleColorChange(val) {
                this.item.value.border_color = val;
            }
        }    
    }
</script>
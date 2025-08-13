<template>
    <div class="ff_border_config">
        <div class="ff_section_title" v-if="item.label">
            {{ $t(item.label) }}
        </div>
        <div class="ff-control-content">
            <div class="ff-control-field ff_input_wrapper_full mb-3">
                <el-checkbox true-label="yes" false-label="no" v-model="item.status">{{ $t(item.status_label) }}</el-checkbox>
            </div>
            <template v-if="item.status == 'yes'">
                <div class="mb-3">
                    <ff_color_picker :item="item.value.color"/>
                </div>
                <div class="mb-3">
                    <ff_color_picker :item="item.value.active_color"/>
                </div>
	            <div class="mb-3" >
		            <ff_around_item :item="item.value.margin" :value-item="item.value.margin.value"/>
	            </div>
                <div class="mb-3">
                    <ff_border_config :item="item.value.border"/>
                </div>
	            <div v-if="item.value.border.value.status === 'yes'">
		            <div class="ff-control-field ff_input_wrapper_full">
			            <el-checkbox true-label="yes" false-label="no" v-model="item.value.border.value.radio_border_status">{{ $t('Radio Border Same as Checkbox') }}</el-checkbox>
		            </div>
                </div>
            </template>
        </div>
    </div>
</template>
<script type="text/babel">
    import colorPicker from './ColorPicker';
    import BorderConfig from './BorderConfig';
    import Ff_around_item from './AroundItem';


    export default {
        name: 'ff_radio_checkbox',
        components: {
	        Ff_around_item,
            ff_color_picker : colorPicker,
            ff_border_config :  BorderConfig,
        },
        props: ['item'],
    }
</script>

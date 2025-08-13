<template>
    <div class="ff-control-content">
        <div class="ff-control-field">
            <el-tabs type="border-card" :stretch="true" style="border:none; box-shadow:none;">
                <el-tab-pane v-for="tab in item.tabs" :key="tab.key" :label="tab.label">
                    <div class="ff_each_style" v-for="(elem,i) in tab.value" :key="i">
                        <ff_color_picker v-if="elem.key=='color' || elem.key == 'backgroundColor'" :item="elem" />
                        <ff_width v-else-if="elem.key=='width' && elem.element !== 'ff_unit_value'" :item="elem" />
                        <ff_border_config v-else-if="elem.key=='border'" :item="elem" />
                        <ff_typography v-else-if="elem.key=='typography'" :item="{ label: 'Typography' }" :valueItem="elem.value" />
                        <ff_boxshadow v-else-if="elem.key=='boxshadow'" :item="{ label: 'Box Shadow' }" :valueItem="elem.value" />
                        <ff_around_item v-else-if="elem.key=='padding'" :item="{ label: 'Padding', key: 'padding' }" :valueItem="elem.value" />
                        <ff_around_item v-else-if="elem.key=='margin'" :item="{ label: 'Margin', key: 'margin' }" :valueItem="elem.value" />
                        <ff_unit_value v-if="elem.element == 'ff_unit_value'" :item="elem" :value-item="elem.value"/>
                        <ff_allignment_item v-if="elem.element == 'ff_allignment_item'" :item="elem"/>

                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </div>
</template>
<script type="text/babel">
    import BorderConfig from './BorderConfig';
    import Typography from './Typegraphy';
    import Boxshadow from './BoxShadow';
    import Color from './ColorPicker';
    import AroundItem from './AroundItem'
    import Width from './Width'
    import UnitValue from './UnitValue';
	import AllignmentItem from './Allignment';

    export default {
        name: 'ff_tabs',
        props: ['item', 'valueItem'],
        components: {
            'ff_border_config': BorderConfig,
            'ff_typography': Typography,
            'ff_boxshadow' : Boxshadow,
            'ff_width' : Width,
	        'ff_unit_value': UnitValue,
	        'ff_allignment_item': AllignmentItem,
            'ff_color_picker' : Color,
            'ff_around_item': AroundItem
        }
    }
</script>

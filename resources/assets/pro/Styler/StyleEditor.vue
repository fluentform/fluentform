<template>
    <div class="ff_style_editor">
        <div class="ff_each_style" v-for="(editorStyle, editorKey) in editor_styles" :key="editorKey">
            <component :is="editorStyle.element" :valueItem="editorStyle.value" :item="editorStyle" />
        </div>
    </div>
</template>

<script type="text/babel">
    import ffColor from './Components/ColorPicker';
    import ffBackgroundImage from './Components/BackgroundImage';
    import UnitValue from './Components/UnitValue';
    import ffWidth from './Components/Width';
    import ff_around_item from './Components/AroundItem';
    import ff_border_config from './Components/BorderConfig';
    import ff_typography from './Components/Typegraphy';
    import ff_allignment_item from './Components/Allignment';
    import ff_boxshadow_config  from './Components/BoxShadow';
    import ff_breakwithtitle from './Components/BreakWithTitle'
    import ff_tabs from './Components/Tabs'
    import ff_radio_checkbox from './Components/RadioAndCheckbox'
    export default {
        name: 'styler_editor',
        components: {
            ff_color: ffColor,
            ff_background_image: ffBackgroundImage,
	        ff_unit_value: UnitValue,
            ff_width: ffWidth,
            ff_around_item: ff_around_item,
            ff_border_config: ff_border_config,
            ff_typography: ff_typography,
            ff_allignment_item: ff_allignment_item,
            ff_boxshadow_config: ff_boxshadow_config,
            ff_breakwithtitle: ff_breakwithtitle,
            ff_tabs: ff_tabs,
            ff_radio_checkbox: ff_radio_checkbox
        },
        props: ['editor_styles']
    }
</script>

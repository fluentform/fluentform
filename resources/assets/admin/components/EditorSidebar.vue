<template>
    <div>
        <fieldSettingsViewer
            :form_items="form_items"
            :haveFormSteps="haveFormSteps"
            :editItem="editItem">
        </fieldSettingsViewer>
    </div>
</template>

<script>
import fieldSettingsViewer from './editor-field-settings/fieldSettingsViewer';

export default {
    name: 'EditorSidebar',
    props: ['form_items', 'editItem','haveFormSteps'],
    components: {
        fieldSettingsViewer
    }
};
</script>

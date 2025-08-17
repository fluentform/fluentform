<template>
    <div>
        <component
            v-if="componentReady"
            :listItem="listItem"
            :form_items="form_items"
            :editItem="editItem"
            :is="customComponent"
        ></component>
    </div>
</template>

<script>
export default {
    name: "CustomSettingsField",
    props: ["listItem", "editItem", "form_items", "item"],
    data() {
        return {
            componentReady: false
        };
    },
    computed: {
        componentName() {
            return this.listItem?.componentName || this.item?.editor_options?.componentName;
        },
        customComponent() {
            return window.ffEditorOptionsCustomComponents[this.componentName] || null;
        }
    },
    beforeMount() {
        if (window.ffEditorOptionsCustomComponents[this.componentName]) {
            this.componentReady = true;
        }
    }
};
</script>

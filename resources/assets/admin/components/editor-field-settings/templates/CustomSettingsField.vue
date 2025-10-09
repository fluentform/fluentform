<template>
    <div>
        <component  v-if="componentReady" :allElements="allElements" :item="item" :listItem="listItem" :form_items="form_items" :editItem="editItem" :is="customComponent"></component>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'CustomSettingsField',
    props: ['listItem', 'editItem', 'form_items', 'item', 'allElements'],
    data() {
        return {
            componentReady: false
        }
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
        if(window.ffEditorOptionsCustomComponents[this.componentName]) {
            this.componentReady = true;
        }
    }
}
</script>

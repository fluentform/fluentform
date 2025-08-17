export default {
    changeFieldMode(state, mode) {
        state.fieldMode = mode;
    },

    setSidebarLoading(state, value) {
        state.sidebarLoading = value;
    },

    loadResources(state, payload) {
        state.editorShortcodes = payload.shortcodes;
        state.editorComponents = payload.components;
        state.editorDisabledComponents = payload.disabled_components;

        // Assuming _ff is a utility for processing payload
        _ff.each(payload.components, (components, key) => {
            state[`${key}MockList`] = components;
        });

        state.isMockLoaded = true;
    },

    setUniqueName(state, { element, name }) {
        element.attributes.name = name;
    },
    setUniqueKey(state, { element, key }) {
        element.uniqElKey = key;
    },
    updateElement(state, { index, element }) {
        // Update the element in the array at the given index
        state.allElements.splice(index, 1, element);
    },
    addToDropzone(state, { index, item }) {
        state.form.dropzone.splice(index, 0, item);
    },
    removeFromDropzone(state, index) {
        state.form.dropzone.splice(index, 1);
    },
    moveInDropzone(state, { newIndex, oldIndex }) {
        const item = state.form.dropzone.splice(oldIndex, 1)[0];
        state.form.dropzone.splice(newIndex, 0, item);
    },
    setEditorShortcode(state, shortcode) {
        state.editorShortcodes[0].shortcodes = shortcode;
    }
};

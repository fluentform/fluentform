export default {
    changeFieldMode(state, mode) {
        state.fieldMode = mode;
    },

    updateSidebar(state) {
        state.sidebarLoading = true;
        setTimeout(() => {
            state.sidebarLoading = false;
        }, 100);
    },

    loadResources(state, payload) {
        state.editorShortcodes = payload.shortcodes;
        state.editorComponents = payload.components;
        state.editorDisabledComponents = payload.disabled_components;

        _ff.each(payload.components, (components, key) => {
            state[`${key}MockList`] = components;
        });

        state.isMockLoaded = true;
    }
}

export default {
    changeFieldMode(state, mode) {
        state.fieldMode = mode;
    },

    updateSidebar(state) {
        state.sidebarLoading = true;
        setTimeout(() => {
            state.sidebarLoading = false;
        }, 500);
    },

    loadEditorShortcodes(state, payload) {
        state.editorShortcodes = payload;
    }
}
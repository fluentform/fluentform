export default {
    loadEditorShortcodes({ commit }, form_id) {
        let data = {
            form_id,
            action: 'fluentform-load-editor-shortcodes'
        };
        FluentFormsGlobal.$get(data)
            .done(res => {
                if (res.success)
                    commit('loadEditorShortcodes', res.data.shortcodes);
            })
            .fail( _ => {});
    }
}

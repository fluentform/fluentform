export default {
    loadResources({ commit }, form_id) {
        const url = FluentFormsGlobal.$rest.route('getFormResources', form_id);

        FluentFormsGlobal.$rest.get(url)
            .then(res => {
                commit('loadResources', res);
            })
            .catch( _ => {});
    },
}

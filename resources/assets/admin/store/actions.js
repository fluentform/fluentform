export default {
    loadResources({ commit }, form_id) {
        const url = 'forms/' + form_id + '/resources';

        FluentFormsGlobal.$rest.get(url)
            .then(res => {
                commit('loadResources', res);
            })
            .catch( _ => {});
    },
}

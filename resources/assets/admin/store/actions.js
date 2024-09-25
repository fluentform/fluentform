export default {
    loadResources({ commit }, form_id) {
        const url = FluentFormsGlobal.$rest.route('getFormResources', form_id);

        FluentFormsGlobal.$rest.get(url)
            .then(res => {
                commit('loadResources', res);
            })
            .catch(() => {});
    },
    updateSidebar({ commit }) {
        commit('setSidebarLoading', true);
        setTimeout(() => {
            commit('setSidebarLoading', false);
        }, 100);
    }
};

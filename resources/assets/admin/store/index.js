import Vue from 'vue';
import Vuex from 'vuex';
import createLogger from 'vuex/dist/logger';

Vue.use(Vuex);

const debug = process.env.NODE_ENV !== 'production';

import mutations from './mutations'
import actions from './actions'

export default new Vuex.Store({
    state: {
        fieldMode: 'add',
        sidebarLoading: true,
        editorShortcodes: {},
        editorComponents: {},
        editorDisabledComponents: {},

        postMockList: [],
        taxonomyMockList: [],
        generalMockList: [],
        advancedMockList: [],
        paymentsMockList: [],
        containerMockList: [],
        isMockLoaded: false,
    },
    getters: {
        fieldMode: state => state.fieldMode,
        sidebarLoading: state => state.sidebarLoading,
        editorShortcodes: state => state.editorShortcodes,

        editorComponents: state => state.editorComponents,
        editorDisabledComponents: state => state.editorDisabledComponents,
        postMockList: state => state.postMockList,
        taxonomyMockList: state => state.taxonomyMockList,
        generalMockList: state => state.generalMockList,
        advancedMockList: state => state.advancedMockList,
        paymentsMockList: state => state.paymentsMockList,
        containerMockList: state => state.containerMockList,
        isMockLoaded: state => state.isMockLoaded,
    },
    actions,
    mutations,
    // strict: debug,
    // plugins: debug ? [createLogger()] : []
});

import { createStore, createLogger } from 'vuex';
import mutations from './mutations';
import actions from './actions';

const debug = process.env.NODE_ENV !== 'production';

export default createStore({
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
        allElements: [],
        form: {
            dropzone: []
        }
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
    strict: debug,
    plugins: debug ? [createLogger()] : [],
});

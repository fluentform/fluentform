import mitt from 'mitt';

const eventBus = mitt();
export default {
    install(app) {
        app.config.globalProperties.$eventBus = eventBus;
    }
}
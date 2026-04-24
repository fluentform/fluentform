import { createApp as createVueApp } from 'vue';
import registerServices from '@bootstrap/registerServices';
import registerCompatibility from '@bootstrap/registerCompatibility';

export function createApp(RootComponent, options = {}) {
    const {
        props = {},
        services = {},
        plugins = [],
        uiRegistrar = null,
        compatibility = true,
    } = options;

    const app = createVueApp(RootComponent, props);

    if (typeof uiRegistrar === 'function') {
        uiRegistrar(app);
    }

    registerServices(app, services);

    if (compatibility) {
        registerCompatibility(app, services);
    }

    plugins.forEach((plugin) => {
        if (plugin) {
            app.use(plugin);
        }
    });

    return app;
}

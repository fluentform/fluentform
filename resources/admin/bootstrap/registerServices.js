export default function registerServices(app, services = {}) {
    const serviceMap = {
        ui: services.ui,
        i18n: services.i18n,
        api: services.api,
        permission: services.permission,
        storage: services.storage,
    };

    Object.entries(serviceMap).forEach(([key, service]) => {
        if (!service) {
            return;
        }

        app.provide(key, service);
        app.config.globalProperties[`$${key}`] = service;
    });
}

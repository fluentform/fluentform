export default function registerGlobals(app, services = {}) {
    const { i18n, ui, api, permission } = services;

    if (i18n) {
        app.config.globalProperties.$t = i18n.t.bind(i18n);
        app.config.globalProperties.$_n = i18n.n.bind(i18n);
    }

    if (ui) {
        app.config.globalProperties.$notify = ui.notify;
        app.config.globalProperties.$message = ui.message;
        app.config.globalProperties.$loading = ui.loading;
        app.config.globalProperties.$confirm = ui.confirm;
        app.config.globalProperties.$success = ui.success;
        app.config.globalProperties.$fail = ui.error;
        app.config.globalProperties.$warning = ui.warning;
        app.config.globalProperties.$copy = () => ui.success(i18n ? i18n.t('Copied to Clipboard.') : 'Copied to Clipboard.');
    }

    if (api) {
        app.config.globalProperties.$api = api;
    }

    if (permission) {
        app.config.globalProperties.$permission = permission;
    }
}

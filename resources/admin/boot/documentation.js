import { createApp } from '@bootstrap/createApp';
import registerDocumentationUi from '@bootstrap/registerDocumentationUi';
import { mountApp } from '@bootstrap/mountApp';
import Documentation from '@modules/documentation/Documentation.vue';
import { createI18n } from '@services/createI18n';
import { createApi } from '@services/createApi';
import { createPermission } from '@services/createPermission';
import '@admin/styles/modules/documentation/index.scss';

const services = {
    i18n: createI18n(window.fluent_forms_global_var?.admin_i18n || {}),
    api: createApi(),
    permission: createPermission(),
};

const parent = document.querySelector('#ff_documentation_app');

if (parent) {
    let mountNode = parent.querySelector('[data-fluentform-runtime="documentation"]');

    if (!mountNode) {
        mountNode = document.createElement('div');
        mountNode.setAttribute('data-fluentform-runtime', 'documentation');
        parent.appendChild(mountNode);
    }

    const app = createApp(Documentation, {
        services,
        uiRegistrar: registerDocumentationUi,
    });
    mountApp(app, mountNode);
}

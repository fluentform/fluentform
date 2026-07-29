const FALLBACK_URL = 'https://fluentforms.com/pricing/?utm_source=fluent-forms&utm_medium=free_plugin&utm_campaign=upgrade_pro';

const CARRIED_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'theme_style'];

export default function upgradeUrl(utmContent = '', baseUrl = '') {
    const vars = window.FluentFormApp
        || window.fluent_form_entries_vars
        || window.ffc_conv_vars
        || {};
    const localized = vars.upgrade_url || FALLBACK_URL;

    try {
        const url = new URL(baseUrl || localized);

        if (baseUrl) {
            const reference = new URL(localized);
            CARRIED_PARAMS.forEach(key => {
                const value = reference.searchParams.get(key);
                if (value) {
                    url.searchParams.set(key, value);
                }
            });
        }

        if (utmContent) {
            url.searchParams.set('utm_content', utmContent);
        }

        return url.toString();
    } catch (e) {
        return localized;
    }
}

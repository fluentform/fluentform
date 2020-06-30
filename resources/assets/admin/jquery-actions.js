const pluginSlug = 'fluentform';

const action = {
    // Define jQuery actions here
    getGlobalSettings: `${pluginSlug}-global-settings`,
    saveGlobalSettings: `${pluginSlug}-global-settings-store`,
    getAllForms: `${pluginSlug}-forms`,
    getTotalForms: `${pluginSlug}-get-all-forms`,
    getForm: `${pluginSlug}-form-find`,
    saveForm: `${pluginSlug}-form-store`,
    updateForm: `${pluginSlug}-form-update`,
    removeForm: `${pluginSlug}-form-delete`,
    duplicateForm: `${pluginSlug}-form-duplicate`,
    getElements: `${pluginSlug}-load-editor-components`,
    getFormInputs: `${pluginSlug}-form-inputs`,
    getAllEditorShortcodes: `${pluginSlug}-load-all-editor-shortcodes`,
    getFormSettings: `${pluginSlug}-settings-formSettings`,
    getFormGeneralSettings: `${pluginSlug}-settings-general-formSettings`,
    saveFormGeneralSettings: `${pluginSlug}-save-settings-general-formSettings`,
    getMailChimpSettings: `${pluginSlug}-get-form-mailchimp-settings`,
    saveFormSettings: `${pluginSlug}-settings-formSettings-store`,
    removeFormSettings: `${pluginSlug}-settings-formSettings-remove`,
    loadEditorShortcodes: `${pluginSlug}-load-editor-shortcodes`,
    getPages: `${pluginSlug}-get-pages`,
    exportForms: `${pluginSlug}-export-forms`,
    importForms: `${pluginSlug}-import-forms`,
    getPredefinedForms: `${pluginSlug}-predefined-forms`,
    createPredefinedForm: `${pluginSlug}-predefined-create`,
    getPdfTemplates: `${pluginSlug}_pdf_admin_ajax_actions`,
    zapierAdminAjaxAction: `${pluginSlug}-zapier_admin_ajax_actions`,
    getPostSettings: `${pluginSlug}_get_post_settings`,
    chainedSelectFetchRemoteFile: `${pluginSlug}_chained_select_file_upload`,
    chainedSelectFetchRemovDataSource: `${pluginSlug}_chained_select_remove_ds`,
    
    /**
     * Active Campaign
     */
    activeCampaign: {
        getSettings: `${pluginSlug}-get-form-activeCampaign-settings`,
        getLists: `${pluginSlug}-get-activeCampaign-lists`,
    },
};

export const actions = action;

export default {
    install(Vue) {
        Vue.prototype.$action = action;
    }
}
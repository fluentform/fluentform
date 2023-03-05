class Route {
    get(name, ...args) {
        const route = this[name];

        if (!route) {
            throw `${name}:Route Not Found`;
        }

        let continuation = 0;

        return route.replace(/{param}/g, function () {
            const replaceMent = args[continuation];

            continuation++;

            return replaceMent;
        });
    }

    getForms = "forms";
    storeForms = this.getForms;
    getTemplates = this.getForms + "/templates";

    findForm = this.getForms + "/{param}";
    updateForm = this.findForm;
    deleteForm = this.findForm;
    duplicateForm = this.findForm + "/duplicate";
    convertForm = this.findForm + "/convert";
    getFormResources = this.findForm + "/resources";
    getFormPages = this.findForm + "/pages";
    getFormFields = this.findForm + "/fields";
    getFormShortcodes = this.findForm + "/shortcodes";

    getFormSettings = "settings/{param}";
    storeFormSettings = this.getFormSettings;
    deleteFormSettings = this.getFormSettings;

    getGeneralFormSettings = this.getFormSettings + "/general";
    storeGeneralFormSettings = this.getGeneralFormSettings;

    getFormSettingsCustomizer = this.getFormSettings + "/customizer";
    storeFormSettingsCustomizer = this.getFormSettingsCustomizer;
    storeEntryColumns = this.getFormSettings + '/entry-columns';

    getSubmissions = "submissions";
    getSubmissionsResources = this.getSubmissions + '/resources';
    handleSubmissionsBulkActions = this.getSubmissions + '/bulk-actions';
    getAllSubmissions = this.getSubmissions + '/all';
    getReports = this.getSubmissions + '/report';

    handleSubmissionsExport = this.getSubmissions + '/export/{param}';
    findSubmission = this.getSubmissions + '/{param}'; // not implemented
    deleteSubmission = this.findSubmission;
    updateSubmissionStatus = this.findSubmission + '/status';
    toggleSubmissionIsFavorite = this.findSubmission + '/is-favorite';
    
    getSubmissionLogs = this.findSubmission + '/logs';
    deleteSubmissionLogs = this.findSubmission + '/logs';

    getSubmissionNotes = this.findSubmission + '/notes';
    storeSubmissionNote = this.findSubmission + '/notes';

    getSubmissionUsers = this.findSubmission + '/submission-users'
    updateSubmissionUser = this.findSubmission + '/update-submission-user'

    getLogs = 'logs';
    getLogFilters = this.getLogs + '/filters';
    deleteLogs = this.getLogs;

    integrations = 'integrations';
    getGlobalIntegration = this.integrations;
    updateGlobalIntegration = this.integrations;
    updateGlobalIntegrationStatus = this.integrations + '/update-status'
    findIntegration = this.integrations + "/{param}";
    getFormIntegrationSettings = this.findIntegration;
    updateFormIntegrationSettings = this.findIntegration;
    deleteFormIntegration = this.findIntegration;
    getIntegrations = this.findIntegration + "/form-integrations";
    getFormIntegrationList = this.findIntegration + '/integration-list-id';

    getGlobalSettings = 'global-settings';
    storeGlobalSettings = this.getGlobalSettings;

    getRolesAndManagers = 'roles-and-manager';
    storeRoles = this.getRolesAndManagers;

    storeManager = this.getRolesAndManagers + "/manager";
    deleteManager = this.storeManager;
    analytics = 'analytics';
    getFormAnalytics = this.analytics + '/{param}'
    resetFormAnalytics = this.analytics + '/{param}/reset/'

    transferForms = 'transfer';
    importForms = this.transferForms +'/import';
    exportForms = this.transferForms +'/export';
}

export default new Route();

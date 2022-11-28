class Route {
    get(name, ...args) {
        const route = this[name];

        if (!route) {
            throw "Route Not Found";
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
    convertForm = this.findForm + "/convert/{param}";
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

    getEntries = "entries";
    getEntriesResources = this.getEntries + '/resources';
    handleEntriesBulkActions = this.getEntries + '/bulk-actions';

    findEntry = this.getEntries + '/{param}';
    deleteEntry = this.findEntry; // not implemented
    updateEntryStatus = this.findEntry + '/status';
    toggleEntryIsFavorite = this.findEntry + '/is-favorite';
}

export default new Route();

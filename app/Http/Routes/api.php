<?php

/**
 * @var $router \FluentForm\Framework\Http\Router
 */

/*
* /forms resource
*/
$router->prefix('forms')->withPolicy('FormPolicy')->group(function ($router) {
    $router->get('/', 'FormController@index');
    $router->post('/', 'FormController@store');
    $router->get('templates', 'FormController@templates');
    $router->post('import', 'TransferController@import');
    $router->get('export', 'TransferController@export');

    $router->prefix('{form_id}')->group(function ($router) {
        $router->get('/', 'FormController@find');
        $router->post('/', 'FormController@update');
        $router->delete('/', 'FormController@delete');
        $router->post('duplicate', 'FormController@duplicate');
        $router->post('convert', 'FormController@convert');
        $router->get('resources', 'FormController@resources');
        $router->get('pages', 'FormController@pages');
        $router->get('fields', 'FormController@fields');
        $router->get('shortcodes', 'FormController@shortcodes');
    });
});

$router->prefix('settings')->withPolicy('FormPolicy')->group(function ($router) {
    $router->prefix('{form_id}')->group(function ($router) {
        $router->get('/', 'FormSettingsController@index');
        $router->post('/', 'FormSettingsController@store');
        $router->delete('/', 'FormSettingsController@remove');

        $router->get('general', 'FormSettingsController@general');
        $router->post('general', 'FormSettingsController@saveGeneral');

        $router->get('customizer', 'FormSettingsController@customizer');
        $router->post('customizer', 'FormSettingsController@storeCustomizer');

        $router->post('entry-columns', 'FormSettingsController@storeEntryColumns');
    });
});

$router->prefix('submissions')->withPolicy('SubmissionPolicy')->group(function ($router) {
    $router->get('/', 'SubmissionController@index');
    $router->get('export/{form_id}', 'SubmissionController@exportSubmission');
    $router->get('resources', 'SubmissionController@resources');
    $router->post('bulk-actions', 'SubmissionController@handleBulkActions');
    $router->get('all', 'SubmissionController@all');
    $router->get('report', 'SubmissionController@report');

    $router->delete('/{entry_id}', 'SubmissionController@remove');

    $router->prefix('{entry_id}')->group(function ($router) {
        $router->get('/', 'SubmissionController@find');
    
        $router->post('status', 'SubmissionController@updateStatus');
        $router->post('is-favorite', 'SubmissionController@toggleIsFavorite');

        $router->get('logs', 'SubmissionLogController@get');
        $router->delete('logs', 'SubmissionLogController@remove');

        $router->get('notes', 'SubmissionNoteController@get');
        $router->post('notes', 'SubmissionNoteController@store');
        
        $router->get('submission-users','SubmissionController@submissionUsers');
        $router->post('update-submission-user','SubmissionController@updateSubmissionUser');
    });
});

$router->prefix('logs')->withPolicy('SubmissionPolicy')->group(function ($router) {
    $router->get('/', 'LogController@get');
    $router->delete('/', 'LogController@remove');
    $router->get('/filters', 'LogController@getFilters');
});

$router->prefix('integrations')->withPolicy('FormPolicy')->group(function ($router) {
    $router->get('/', 'GlobalIntegrationController@index');
    $router->post('/', 'GlobalIntegrationController@update');
    $router->post('update-status', 'GlobalIntegrationController@updateModuleStatus');
    
    $router->prefix('{form_id}')->group(function ($router) {
        $router->get('/form-integrations', 'FormIntegrationController@index');
        $router->get('/', 'FormIntegrationController@find');
        $router->post('/', 'FormIntegrationController@update');
        $router->delete('/', 'FormIntegrationController@delete');
        
        $router->get('/integration-list-id', 'FormIntegrationController@integrationListComponent');
    });
});

$router->prefix('global-settings')->withPolicy('GlobalSettingsPolicy')->group(function ($router) {
    $router->get('/', 'GlobalSettingsController@index');
    $router->post('/', 'GlobalSettingsController@store');
});

$router->prefix('roles-and-manager')->withPolicy('RoleManagerPolicy')->group(function ($router) {
    $router->get('/', 'RoleManagerController@index');
    $router->post('/', 'RoleManagerController@addCapability');
    $router->post('/manager', 'RoleManagerController@addManager');
    $router->delete('/manager', 'RoleManagerController@removeManager');
});

$router->prefix('analytics')->withPolicy('FormPolicy')->group(function ($router) {
    $router->post('/{form_id}/reset', 'AnalyticsController@reset');
});


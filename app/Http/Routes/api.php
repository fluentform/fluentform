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

$router->prefix('entries')->withPolicy('FormPolicy')->group(function ($router) {
    $router->get('/', 'EntryController@index');
    $router->get('resources', 'EntryController@resources');
    $router->post('bulk-actions', 'EntryController@handleBulkActions');

    $router->prefix('{entry_id}')->group(function ($router) {
        $router->post('status', 'EntryController@updateStatus');
        $router->post('is-favorite', 'EntryController@toggleIsFavorite');
    });
});

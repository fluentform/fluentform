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

    $router->prefix('{id}')->group(function ($router) {
        $router->get('/', 'FormController@find');
        $router->post('/', 'FormController@update');
        $router->delete('/', 'FormController@delete');
        $router->post('duplicate', 'FormController@duplicate');
        $router->post('convert', 'FormController@convert');
        $router->get('resources', 'FormController@resources');
        $router->get('pages', 'FormController@pages');
        $router->get('fields', 'FormController@fields');
        $router->get('shortcodes', 'FormController@shortcodes');
        
        $router->get('settings', 'FormSettingsController@index');
        $router->post('settings', 'FormSettingsController@store');
        $router->delete('settings', 'FormSettingsController@remove');
        $router->get('settings/general', 'FormSettingsController@general');
        $router->post('settings/general', 'FormSettingsController@saveGeneral');
    });
});

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

    $router->prefix('{id}')->group(function ($router) {
        $router->get('/', 'FormController@find');
        $router->post('/', 'FormController@update');
        $router->delete('/', 'FormController@delete');
        $router->post('duplicate', 'FormController@duplicate');
        $router->post('convert', 'FormController@convert');
    });
});

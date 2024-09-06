<?php
/**
 * @var $router Router
 */

use FluentForm\Framework\Http\Router;

$router->namespace('')->group(function ($router) {
    require __DIR__ . '/api.php';
});
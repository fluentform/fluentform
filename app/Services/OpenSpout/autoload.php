<?php
/**
 * Simple autoloader for OpenSpout library
 * This autoloader maps the OpenSpout namespace to the directory structure
 */

spl_autoload_register(function ($class) {
    // Only handle OpenSpout namespace
    if (strpos($class, 'OpenSpout\\') !== 0) {
        return;
    }

    // Remove the namespace prefix
    $class = substr($class, strlen('OpenSpout\\'));
    
    // Convert namespace separators to directory separators
    $class = str_replace('\\', DIRECTORY_SEPARATOR, $class);
    
    // Build the file path (files are directly in OpenSpout directory, not in src/)
    $file = __DIR__ . DIRECTORY_SEPARATOR . $class . '.php';
    
    // If the file exists, require it
    if (file_exists($file)) {
        require_once $file;
    }
});


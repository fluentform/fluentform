<?php

namespace Box\Spout\Autoloader;

require_once 'Psr4Autoloader.php';

/**
 * @var string $fluentformSrcBaseDirectory
 * Full path to "src/Spout" which is what we want "Box\Spout" to map to.
 */
$fluentformSrcBaseDirectory = dirname(dirname(__FILE__));

$fluentformLoader = new Psr4Autoloader();
$fluentformLoader->register();
$fluentformLoader->addNamespace('Box\Spout', $fluentformSrcBaseDirectory);

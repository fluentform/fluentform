<?php
/**
 * ./wpf make:controller <path/name>
 * Creates a controller class inside the app/Http/Controllers folder.
 */
(function($pluginDir, $args) {
    $target = wpf_generator_target($args[1]);
    $composerFile = $pluginDir . '/composer.json';
    $file = $pluginDir . '/app/Http/Controllers/' . $target . '.php';
    $composer = json_decode(file_get_contents($composerFile), true);
    $namespace = $composer['extra']['wpfluent']['namespace']['current'];
    $pieces = explode('/', $target);
    $name = array_pop($pieces);
    $sub = implode('\\', $pieces);
    $fqn = wpf_namespace_join($namespace . '\App\Http\Controllers', $sub);

    $content = <<<TEXT
    <?php

    namespace {$fqn};

    use $namespace\Framework\Request\Request;

    class {$name} extends Controller
    {
        public function index(Request \$request)
        {
            // Your code goes here...
        }

        public function create(Request \$request)
        {
            // Your code goes here...
        }

        public function update(Request \$request, \$id)
        {
            // Your code goes here...
        }

        public function delete(Request \$request, \$id)
        {
            // Your code goes here...
        }
    }

    TEXT;

    $dirPath = substr($file, 0, strrpos($file, '/')) . '/';

    if (!is_dir($dirPath)) {
    	@mkdir($dirPath, 0777, true);
    }

    if (file_put_contents($file, $content)) {
    	$mainPath = substr(
    		$file, strpos($file, ltrim(substr($pluginDir, strrpos($pluginDir, '/')), '/'))
    	);
    	$output = new \Symfony\Component\Console\Output\ConsoleOutput;
        $output->writeln('<info>Controller '.$mainPath.' created successfully.</info>');
    }
})(realpath(__DIR__.'/../../../..'), $args);

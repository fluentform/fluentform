<?php
/**
 * ./wpf make:handler    <path/name>
 * * Creates a handler class inside the app/Hooks/Handlers folder.
 */
(function($pluginDir, $args) {
    $target = wpf_generator_target($args[1]);
    $composerFile = $pluginDir . '/composer.json';
    $file = $pluginDir . '/app/Hooks/Handlers/' . $target . '.php';
    $composer = json_decode(file_get_contents($composerFile), true);
    $namespace = $composer['extra']['wpfluent']['namespace']['current'];
    $pieces = explode('/', $target);
    $name = array_pop($pieces);
    $sub = implode('\\', $pieces);
    $fqn = wpf_namespace_join($namespace . '\App\Hooks\Handlers', $sub);

    $content = <<<TEXT
    <?php

    namespace {$fqn};

    use $namespace\Framework\Foundation\Application;

    class {$name}
    {
        protected \$app = null;

        public function __construct(Application \$app)
        {
            \$this->app = \$app;
        }
        
        public function handle()
        {
            // ...
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
        $output->writeln('<info>Handler '.$mainPath.' created successfully.</info>');
    }
})(realpath(__DIR__.'/../../../..'), $args);

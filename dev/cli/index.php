<?php

return function($args) {
	if (($arg = reset($args)) === 'doc') {
		return require __DIR__.'/doc_viewer.php';
	} elseif (substr($arg, 0, 4) === 'make') {
		$files = glob(__DIR__.'/commands/make/*.php');
		$command = ltrim(substr($arg, 4), ':');

		if (in_array($file = __DIR__."/commands/make/{$command}.php", $files)) {
			return require $file;
		}
		return;
	} elseif (substr($arg, 0, 4) === 'migr') {
		return require __DIR__.'/commands/migration/index.php';
	} elseif (substr($arg, 0, 4) === 'seed') {
		require __DIR__.'/../seeds/index.php';
		return (new \Symfony\Component\Console\Output\ConsoleOutput)->writeln(
			'<info>The database has been seeded successfully.</info>'
		);
	}

	(new \Symfony\Component\Console\Output\ConsoleOutput)->writeln(
		'<info>Unknown command '. (isset($command) ? "make:{$command}" : $arg) . '.' .'</info>'
	);
};

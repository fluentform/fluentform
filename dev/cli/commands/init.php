<?php

return function($args, $loader) {
	if (!file_exists($loader)) {	
		echo 'Please wait...'.PHP_EOL;
		chdir(__DIR__.'/../../../dev');
		exec('composer update', $output);
		foreach ($output as $line) {
		    echo $line . PHP_EOL;
		}
	}

	if (($args && reset($args) === 'init') || !file_exists($loader)) {
		if (file_exists($f = __DIR__ . '/../../../dev/test/setup.sh')) {
		    @chmod($f, 0700);
			$_ = $GLOBALS['wpdb'];
			if (isset($args[1]) && $args[1] === '--config') {
				if (file_exists($filePath = ABSPATH.'wp-tests-config.php')) {
					$file = fopen($filePath, 'r');
					while (!feof($file)) {
					    $line = fgets($file);
					    if (strpos($line, 'DB_NAME') !== false) {
					        preg_match(
					        	"/define\s*\(\s*'DB_NAME'\s*,\s*'([^']+)'\s*\)/", $line, $matches
					        );

					        if (isset($matches[1])) {
					            $dbn = $matches[1];
					        }
					    }
					}
					fclose($file);
				}
			} else {
				$dbn = str_replace('-', '_', basename(ABSPATH).'_testdb');
			}

			// Delete wordpress & wordpress-tests-lib diectories
			$tmpDir = getenv('TMPDIR');
			$wordpressDir = escapeshellarg($tmpDir . 'wordpress');
			$testsLibDir = escapeshellarg($tmpDir . 'wordpress-tests-lib');
			$command = "rm -rf $wordpressDir $testsLibDir";
			exec($command, $output, $returnVar);

			echo "Installing test suit, it may take a while...\n\n";
			exec(
				$f.' '.$dbn.' '.$_->dbuser.' '.$_->dbpassword.' '.$_->dbhost, $out
			); foreach ($out as $o) echo $o.PHP_EOL;

			$testConf = $tmpDir . '/wordpress-tests-lib/wp-tests-config.php';
			$wpRootDir = realpath(__DIR__ . '/../../../../../../');
			$newTestConf = $wpRootDir . '/wp-tests-config.php';
			
			@chmod($wpRootDir, 0700);
			@unlink($newTestConf);
			@symlink($testConf, $newTestConf);
			$newLine = "defined('WP_DEBUG_LOG') || define('WP_DEBUG_LOG', true);";
			$currentContent = file_get_contents($newTestConf);
			$newContent = $currentContent . "\n" . $newLine;
			file_put_contents($newTestConf, $newContent);

			// Create debug.log file
			if (!file_exists(
				$testLog = $tmpDir.'/wordpress/wp-content/debug.log'
			)) { @touch($testLog); }

			$devDir = __DIR__.'/../..';
			@chmod($devDir, 0700);
			@unlink($devDir.'/test.log');
			@symlink($testLog, $devDir.'/test.log');
		}

		if (!file_exists($loader)) {
			
			echo 'Please wait...'.PHP_EOL;
			chdir(__DIR__.'/../../../dev');
			exec('composer update');

			$content = file_get_contents(
				$file = __DIR__.'/../../../dev/test/inc/RefreshDatabase.php'
			);
			
			$composer = json_decode(
				file_get_contents(__DIR__.'/../../../composer.json'), true
			);

			$ns = $composer['extra']['wpfluent']['namespace']['current'];
			file_put_contents($file, str_replace('WPFluent\\', $ns . '\\', $content));
			
			exec(__FILE__, $output);
			foreach ($output as $line) {
			    echo $line . PHP_EOL;
			}
		}

		return true;
	}
};

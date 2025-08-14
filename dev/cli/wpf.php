<?php

$args = array_slice($argvals, 1);

if (!defined('ABSPATH') && isset($args) && $args[0] !== 'test') {
	require_once $cwd."/../../../wp-load.php";
}

(require $cwd."/dev/cli/commands/init.php")($args, $loader);

chdir($cwd.'/dev/');exec('composer dump');chdir($cwd);
$require([$loader, $devGlobals, $functions]);

if ($args) {
	if (strtolower(reset($args)) === 'about') {
		$readMe = file_get_contents(
			$cwd.'/vendor/wpfluent/framework/README.md'
		);
		
		$about = require $cwd.'/config/app.php';
		$about = array_merge(['PHP version' => PHP_VERSION], $about);
		
		if (preg_match('/version - \d+\.\d+.\d+/i', $readMe, $matches)) {
			$pieces = explode('-', $matches[0]);
			$about = array_merge(['Framework version' => trim(end($pieces))], $about);
		}

		foreach ($about as $key => $value) {
			echo 'Plugin ' . str_pad(
				ucwords(str_replace('_', ' ', $key)), 18
			) . ' : ' . $value . PHP_EOL;
		}
	} elseif (($arg = reset($args)) === 'build') {
		return (require $cwd.'/dev/cli/build.php')($cwd);
	} elseif (($arg = reset($args)) === 'logmon') {
		exec("pkill -f 'logmon'");
		exec('php '.$cwd.'/dev/cli/logmon.php > /dev/null 2>&1 &');
		echo "Log monitor started...\n";
	} elseif (($arg = reset($args)) === 'logoff') {
		exec("pkill -f 'logmon'");
		echo "Log monitor stopped.\n";
	} elseif (($arg = reset($args)) === 'test') {
		$tmpDir = sys_get_temp_dir();
		$init = require $cwd . "/dev/cli/commands/init.php";
		
		$del = function ($path) use (&$del) {
		    if (is_file($path) || is_link($path)) {
		        if (!@unlink($path)) {
		            throw new RuntimeException(
		            	"Failed to delete file: $path"
		            );
		        }
		    } elseif (is_dir($path)) {
		        $items = array_diff(scandir($path), ['.', '..']);
		        foreach ($items as $item) {
		            $del($path . DIRECTORY_SEPARATOR . $item);
		        }
		        // Try to remove the directory, handle errors
		        if (!@rmdir($path)) {
		            throw new RuntimeException(
		            	"Failed to delete directory: $path"
		            );
		        }
		    }
		};

		register_shutdown_function(function() use (
			&$del, &$loader, &$init, $tmpDir
		) {
		    $error = error_get_last();
		    if ($error !== null) {
		    	echo "\nIf this error is related to test suit then run ";
		    	die("./wpf init\n");
		    }
		});

		try {
			$funcPath = $tmpDir . '/wordpress-tests-lib/includes/functions.php';
			if (!file_exists($funcPath)) {
				echo "\nNeed to install the test suite, please wait..., \n\n";
				require_once $cwd."/../../../wp-load.php";
		        foreach (['/wordpress', '/wordpress-tests-lib'] as $p) {
		            $del($tmpDir . $p);
		        }
				$init(['init'], $loader);
				die('Run ./wpf test'.PHP_EOL);
			}

			// Make the plugin active during the testing
			$p = substr($cwd, strrpos($cwd, '/') + 1);
			$GLOBALS['wp_tests_options'] = [
				'active_plugins' => [$p.'/plugin.php']
			];
			// Run the test suite
			chdir($cwd.'/dev');
			$args = array_merge($args, ['--exclude', 'skip']);
		    $command = new PHPUnit\TextUI\Command;
		    $result = $command->run(
		    	['phpunit', ...array_splice($args, 1)], false
		    );

		    if ($result > 2) {
		    	$msg = 'If nothing works, try running: '.PHP_EOL.PHP_EOL;
				$msg .='rm -rf "$(echo $TMPDIR)wordpress" ';
				$msg .= '"$(echo $TMPDIR)wordpress-tests-lib"'.PHP_EOL.PHP_EOL; 
				$msg .= './wpf test or ./dev/test/setup.sh'.PHP_EOL.PHP_EOL;
				die($msg);
		    }
		} catch (Exception $e) {
			die($e->getMessage().PHP_EOL);
		}
	} elseif ($arg === 'fix') {
		echo "Please wait a few moments...".PHP_EOL;
		return (require $cwd.'/dev/cli/update_static.php');
	} elseif ($arg !== 'init') {
		(require $cwd.'/dev/cli/index.php')($args);
	}
} else {
	// Show the available commands list
	require $cwd.'/dev/cli/list_commands.php';
}
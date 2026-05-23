<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package Wpftest
 */

ini_set('error_reporting', E_ALL);
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');

$_tests_dir = getenv( 'WP_TESTS_DIR' );

if ( ! $_tests_dir ) {
	$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
}

// Forward custom PHPUnit Polyfills configuration to PHPUnit bootstrap file.
$_phpunit_polyfills_path = getenv( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' );
if ( false !== $_phpunit_polyfills_path ) {
	define( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH', $_phpunit_polyfills_path );
}

if ( ! file_exists( "{$_tests_dir}/includes/functions.php" ) ) {
	echo "Could not find {$_tests_dir}/includes/functions.php, have you run dev/test/setup.sh ?" . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Give access to tests_add_filter() function.
require_once "{$_tests_dir}/includes/functions.php";

tests_add_filter('muplugins_loaded', function() {
	require dirname(realpath(__DIR__.'/../../')) . '/fluentform.php';

	// Optional cross-plugin test mode: load fluentformpro alongside free so
	// dev/test/tests/Pro/* can exercise Pro classes through the same harness.
	// Opt-in only — default free-only runs are unaffected. Path is resolved
	// from the FREE plugin's dev/test/inc/ to its sibling fluentformpro dir
	// under wp-content/plugins/.
	if (getenv('FLUENTFORM_PRO_TEST') === '1') {
		// __DIR__ is /…/plugins/fluentform/dev/test/inc — five levels up = /…/plugins
		$pro_path = realpath(__DIR__.'/../../../../') . '/fluentformpro/fluentformpro.php';
		if (file_exists($pro_path)) {
			require $pro_path;
			// Sentinel for Pro test classes — distinguishes "flag set + loaded"
			// from "flag set but pro repo missing" so tests can skip gracefully
			// instead of fataling on use FluentFormPro\... imports.
			defined('FLUENTFORM_PRO_TEST_LOADED') or define('FLUENTFORM_PRO_TEST_LOADED', true);
		} else {
			fwrite(STDERR, "[FLUENTFORM_PRO_TEST] expected fluentformpro at {$pro_path} but not found\n");
		}
	}
});

// Start up the WP testing environment.
require "{$_tests_dir}/includes/bootstrap.php";

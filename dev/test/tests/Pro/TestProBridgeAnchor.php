<?php

namespace Dev\Test\Tests\Pro;

use Dev\Test\Inc\TestCase;

/**
 * Pro bridge anchor — proves the FLUENTFORM_PRO_TEST=1 env-gated load works.
 *
 * Expected to FAIL on feat/devtools-test-enablers HEAD because the bootstrap
 * does not yet load fluentformpro. Expected to PASS once bootstrap.php
 * conditionally requires fluentformpro/fluentformpro.php behind the env flag.
 *
 * Skipped cleanly when the env flag is absent so default free-only runs are
 * unaffected.
 */
class TestProBridgeAnchor extends TestCase
{
    public static function setUpBeforeClass() : void
    {
        if (!defined('FLUENTFORM_PRO_TEST_LOADED')) {
            self::markTestSkipped('Pro not loaded (set FLUENTFORM_PRO_TEST=1 and check fluentformpro is checked out).');
        }

        parent::setUpBeforeClass();
    }

    public function test_pro_plugin_constants_are_defined()
    {
        $this->assertTrue(defined('FLUENTFORMPRO'), 'FLUENTFORMPRO constant must be defined');
        $this->assertTrue(defined('FLUENTFORMPRO_VERSION'), 'FLUENTFORMPRO_VERSION constant must be defined');
        $this->assertTrue(defined('FLUENTFORMPRO_DIR_PATH'), 'FLUENTFORMPRO_DIR_PATH constant must be defined');
    }

    public function test_pro_classes_are_autoloaded()
    {
        $this->assertTrue(
            class_exists('FluentFormPro'),
            'FluentFormPro entry class must autoload after the Pro require'
        );

        $this->assertTrue(
            class_exists('FluentFormPro\\Payments\\Classes\\CouponModel'),
            'Pro CouponModel must be autoloadable through Pro autoload.php'
        );
    }

    public function test_pro_registered_at_least_one_listener_on_a_free_hook()
    {
        // Pro registers add_action('fluentform/global_notify_completed', ...) and many
        // other listeners on free hooks. If any listener attached, the bridge works.
        $this->assertGreaterThan(
            0,
            has_action('fluentform/global_notify_completed'),
            'Pro should have registered at least one listener on the free fluentform/global_notify_completed action'
        );
    }
}

<?php

namespace Tests\Integration;

use lucatume\WPBrowser\TestCase\WPTestCase;

/**
 * Smoke test — proves WPLoader booted WordPress + FluentForm and the bootstrap
 * migrations ran. Ported from the legacy dev/test/tests/TestSample.php.
 */
class SampleTest extends WPTestCase
{
    public function test_harness_boots(): void
    {
        $this->assertTrue(function_exists('wpFluentForm'), 'FluentForm did not load under WPLoader');
    }
}

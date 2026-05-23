<?php

namespace Dev\Test\Tests;

use Dev\Test\Inc\TestCase;

/**
 * Pure smoke test — proves the harness boots, TestCase setUp() runs, and
 * RefreshDatabase migrates without erroring. Does NOT depend on
 * UsersAndPostsSeeder, which relies on UserFactory::$model being set to a
 * concrete User model — FluentForm doesn't ship one (factories/UserFactory.php
 * keeps the $model property commented out as a stub for downstream plugins).
 */
class TestSample extends TestCase
{
    public function test_harness_boots()
    {
        $this->assertTrue(true);
    }
}

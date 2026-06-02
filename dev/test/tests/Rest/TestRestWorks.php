<?php

namespace Dev\Test\Tests\Rest;

use Dev\Test\Inc\TestCase;
use WP_REST_Response;

/**
 * Smoke test for the WP REST dispatcher via the test harness's get() helper.
 * Registers a route directly with WordPress (FluentForm's router has its
 * own internal registry that only flushes to WP_REST_Server once during
 * the initial rest_api_init; registering through it after setUp isn't
 * reliable). register_rest_route works inside any rest_api_init pass.
 */
class TestRestWorks extends TestCase
{
    /**
     * Track the rest_api_init callback this test installs so tearDown
     * can remove it. Leaving the closure on the global rest_api_init
     * action would cause every subsequent test's setUp() to re-register
     * the route (each setUp re-fires do_action('rest_api_init') against
     * a fresh WP_REST_Server), polluting later tests' route tables.
     */
    private $restInitCallback;

    public function tearDown() : void
    {
        if ($this->restInitCallback) {
            remove_action('rest_api_init', $this->restInitCallback);
            $this->restInitCallback = null;
        }
        parent::tearDown();
    }

    public function test_rest_works()
    {
        $route = trim($this->getRestNamespace(), '/');
        list($ns, $ver) = explode('/', $route);

        $this->restInitCallback = function () use ($ns, $ver) {
            register_rest_route("{$ns}/{$ver}", '/test-rest-works', [
                'methods'  => 'GET',
                'callback' => function () {
                    return new WP_REST_Response(['ok' => true], 200);
                },
                'permission_callback' => '__return_true',
            ]);
        };
        add_action('rest_api_init', $this->restInitCallback);

        // Concerns::createRequest() re-fires rest_api_init before dispatching,
        // so the route registered above will land on the server in time.
        $response = $this->get('test-rest-works');

        $this->assertTrue($response->isOkay());
    }

    /**
     * Regression guard: prove the previous test's rest_api_init callback
     * was removed in tearDown. If the leak returns, this test's setUp()
     * would re-fire rest_api_init, the leaked closure would re-register
     * test-rest-works on the fresh server, and the route would show up
     * in the route table.
     */
    public function test_rest_works_callback_does_not_leak_to_next_test()
    {
        $namespace = $this->getRestNamespace();
        $routes = $this->server->get_routes();

        $this->assertArrayNotHasKey(
            $namespace . 'test-rest-works',
            $routes,
            'Previous test leaked its rest_api_init closure — route persists across tests'
        );
    }
}

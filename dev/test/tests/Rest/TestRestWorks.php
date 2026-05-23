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
    public function test_rest_works()
    {
        // Hook into the NEXT rest_api_init pass so the route lands on
        // the WP_REST_Server instance that Concerns::get() dispatches to.
        $route = trim($this->getRestNamespace(), '/');
        list($ns, $ver) = explode('/', $route);

        add_action('rest_api_init', function () use ($ns, $ver) {
            register_rest_route("{$ns}/{$ver}", '/test-rest-works', [
                'methods'  => 'GET',
                'callback' => function () {
                    return new WP_REST_Response(['ok' => true], 200);
                },
                'permission_callback' => '__return_true',
            ]);
        });

        // Concerns::createRequest() re-fires rest_api_init before dispatching,
        // so the route registered above will land on the server in time.
        $response = $this->get('test-rest-works');

        $this->assertTrue($response->isOkay());
    }
}

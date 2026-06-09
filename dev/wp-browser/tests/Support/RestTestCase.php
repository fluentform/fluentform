<?php

namespace Tests\Support;

use lucatume\WPBrowser\TestCase\WPTestCase;
use Tests\Support\Concerns\InteractsWithFluentForm;

/**
 * Base case for Integration tests that exercise the FluentForm REST surface.
 * Extend this instead of WPTestCase when a test dispatches /fluentform/v1/
 * requests; pure model/service tests can extend WPTestCase directly.
 *
 * Provides $this->get/post/put/patch/delete/submitForm and login helpers via
 * InteractsWithFluentForm, each returning [status, body, response].
 */
abstract class RestTestCase extends WPTestCase
{
    use InteractsWithFluentForm;

    public function setUp(): void
    {
        parent::setUp();
        rest_get_server();
        do_action('rest_api_init');
    }

    public function tearDown(): void
    {
        wp_set_current_user(0);
        unset($_REQUEST['_wpnonce'], $_SERVER['HTTP_X_WP_NONCE']);
        parent::tearDown();
    }

    protected function assertOk(int $status): void
    {
        $this->assertSame(200, $status, 'Expected 200. Body: ' . wp_json_encode($this->lastBody));
    }

    protected function assertForbidden(int $status): void
    {
        $this->assertContains(
            $status,
            [401, 403],
            'Expected 401/403. Body: ' . wp_json_encode($this->lastBody)
        );
    }
}

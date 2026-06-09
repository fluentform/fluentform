<?php

namespace Tests\Support\Helper;

use Codeception\Module;
use Tests\Support\Concerns\InteractsWithFluentForm;

/**
 * Codeception module exposing FluentForm REST + auth helpers to Cest classes
 * as $I->get(), $I->post(), $I->loginAsAdmin(), $I->impersonateAsRole(), etc.
 *
 * The request/auth flow lives in InteractsWithFluentForm so the Functional
 * suite and the Integration RestTestCase share one implementation.
 */
class Functional extends Module
{
    use InteractsWithFluentForm;

    public function seeResponseCodeIs(int $expected): void
    {
        \PHPUnit\Framework\Assert::assertSame(
            $expected,
            $this->lastResponse ? (int) $this->lastResponse->get_status() : 0,
            'Unexpected REST status. Body: ' . wp_json_encode($this->lastBody)
        );
    }

    public function grabResponseJson(): array
    {
        return $this->lastBody ?? [];
    }

    /**
     * Truncate every fluentform_* table, leaving WordPress core tables alone.
     * Call from a Cest's _before so methods don't bleed state into each other.
     */
    public function resetFluentFormTables(): void
    {
        global $wpdb;

        $tables = $wpdb->get_col(
            $wpdb->prepare('SHOW TABLES LIKE %s', $wpdb->esc_like($wpdb->prefix . 'fluentform_') . '%')
        );

        $wpdb->query('SET FOREIGN_KEY_CHECKS = 0');
        foreach ($tables as $table) {
            $wpdb->query("TRUNCATE TABLE `{$table}`");
        }
        $wpdb->query('SET FOREIGN_KEY_CHECKS = 1');
    }
}

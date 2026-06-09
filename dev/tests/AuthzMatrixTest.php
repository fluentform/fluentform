<?php

namespace FluentFormDev\Tests\Security;

use PHPUnit\Framework\TestCase;

/**
 * Authorization matrix — cross-form authorization regression.
 *
 * Black-box: drives the live REST API over HTTP, so it needs no WordPress
 * bootstrap and runs under the existing dev PHPUnit (dev/vendor/bin/phpunit).
 * A Manager restricted to ONE form must never delete or read another form's
 * data by smuggling that form's ids in the request body.
 *
 * Guards cross-form access boundaries.
 *
 * Configure against a staging site (NEVER production) via env vars — see
 * dev/tests/README.md. With no config every test is SKIPPED, never silently
 * passed.
 */
final class AuthzMatrixTest extends TestCase
{
    /** @var array<string,string> */
    private static $cfg = [];

    public static function setUpBeforeClass(): void
    {
        self::$cfg = [
            'base'           => rtrim((string) getenv('FF_BASE_URL'), '/'),
            'managerCookie'  => (string) getenv('FF_MANAGER_COOKIE'),
            'managerNonce'   => (string) getenv('FF_MANAGER_NONCE'),
            'adminCookie'    => (string) getenv('FF_ADMIN_COOKIE'),
            'adminNonce'     => (string) getenv('FF_ADMIN_NONCE'),
            'formAuthorized' => (string) getenv('FF_FORM_AUTHORIZED'),
            'formVictim'     => (string) getenv('FF_FORM_VICTIM'),
            'victimEntry'    => (string) getenv('FF_VICTIM_ENTRY'),
        ];
    }

    protected function setUp(): void
    {
        foreach (self::$cfg as $value) {
            if ('' === $value) {
                $this->markTestSkipped(
                    'authz-matrix not configured (set FF_BASE_URL, FF_MANAGER_*, FF_ADMIN_*, '
                    . 'FF_FORM_AUTHORIZED, FF_FORM_VICTIM, FF_VICTIM_ENTRY — see dev/tests/README.md)'
                );
            }
        }
    }

    public function testSmuggledForeignEntryIsNotDeletedUnderAuthorizedForm(): void
    {
        $this->assertTrue($this->entryExists('admin'), 'precondition: victim entry should exist before the attack');

        $res = $this->request('manager', 'submissions/bulk-actions', [
            'form_id'     => self::$cfg['formAuthorized'],         // a form the Manager IS allowed on
            'action_type' => 'other.delete_permanently',
            'entries'     => [self::$cfg['victimEntry']],          // ...but a DIFFERENT form's entry id
        ]);

        $this->assertContains($res['status'], [200, 403, 422], 'unexpected status ' . $res['status']);
        $this->assertTrue($this->entryExists('admin'), 'cross-form delete: victim entry was deleted across the form boundary');
    }

    public function testNamingVictimFormDirectlyIsForbidden(): void
    {
        $res = $this->request('manager', 'submissions/bulk-actions', [
            'form_id'     => self::$cfg['formVictim'],             // a form the Manager is NOT allowed on
            'action_type' => 'other.delete_permanently',
            'entries'     => [self::$cfg['victimEntry']],
        ]);

        $this->assertSame(403, $res['status'], 'expected 403 when naming an unauthorized form');
    }

    public function testManagerCannotReadForeignEntry(): void
    {
        $this->assertFalse($this->entryExists('manager'), 'Manager could read an entry of an unauthorized form');
    }

    private function entryExists(string $as): bool
    {
        $res = $this->request($as, 'submissions/' . self::$cfg['victimEntry'], null, 'GET');

        return 200 === $res['status'] && is_array($res['json']) && !isset($res['json']['code']);
    }

    /**
     * @param array<string,mixed>|null $body
     * @return array{status:int,json:mixed}
     */
    private function request(string $as, string $path, $body = null, string $method = 'POST'): array
    {
        $cookie = 'admin' === $as ? self::$cfg['adminCookie'] : self::$cfg['managerCookie'];
        $nonce  = 'admin' === $as ? self::$cfg['adminNonce'] : self::$cfg['managerNonce'];

        $headers = [
            'X-WP-Nonce: ' . $nonce,
            'Cookie: ' . $cookie,
            'Accept: application/json',
        ];

        $ch = curl_init(self::$cfg['base'] . '/wp-json/fluentform/v1/' . $path);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
        ]);

        if ('GET' !== $method && null !== $body) {
            $headers[] = 'Content-Type: application/x-www-form-urlencoded';
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($body));
        }

        // Honour an upstream proxy (e.g. Burp at 127.0.0.1:8080) when set.
        if ($proxy = getenv('FF_PROXY')) {
            curl_setopt($ch, CURLOPT_PROXY, $proxy);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $raw    = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

        return [
            'status' => $status,
            'json'   => is_string($raw) ? json_decode($raw, true) : null,
        ];
    }
}

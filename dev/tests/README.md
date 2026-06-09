# dev/tests — security regression tests (PHPUnit)

Runs on the existing dev tooling (`dev/vendor/bin/phpunit`, PHPUnit 8.5) — no
extra dependencies, no WordPress bootstrap. `AuthzMatrixTest` is a **black-box**
HTTP test: it drives the live REST API as a restricted Manager and proves a
cross-form authorization cannot happen.

## What it asserts

| Test | Expectation |
|------|-------------|
| `testSmuggledForeignEntryIsNotDeletedUnderAuthorizedForm` | Manager names an authorized form but smuggles another form's `entries[]` → victim entry still exists afterwards |
| `testNamingVictimFormDirectlyIsForbidden` | Manager names the unauthorized form directly → `403` |
| `testManagerCannotReadForeignEntry` | Manager cannot GET an entry of an unauthorized form |

## Fixture (staging only — never production)

1. Two forms, each with ≥1 entry. `FF_FORM_AUTHORIZED` = Form A, `FF_FORM_VICTIM` = Form B.
2. A Manager (Fluent Forms → Settings → Managers) granted **only Form A** + "Manage Entries". The WP user can be a Subscriber.
3. `FF_VICTIM_ENTRY` = an existing entry id under Form B.
4. Grab each session's nonce from `GET /wp-admin/admin-ajax.php?action=rest-nonce`, and the `Cookie` header from a logged-in request in devtools.

## Run

```bash
FF_BASE_URL=https://staging.example.test \
FF_MANAGER_COOKIE='wordpress_logged_in_...=...' \
FF_MANAGER_NONCE='abc123' \
FF_ADMIN_COOKIE='wordpress_logged_in_...=...' \
FF_ADMIN_NONCE='def456' \
FF_FORM_AUTHORIZED=10 \
FF_FORM_VICTIM=20 \
FF_VICTIM_ENTRY=12345 \
dev/vendor/bin/phpunit -c dev/tests/phpunit.xml.dist
```

With no env config the tests **skip** (CI stays green) and never silently pass
the security assertions.

## Route through Burp (optional)

Set `FF_PROXY=http://127.0.0.1:8080` to send all test traffic through Burp, so
Burp passively scans it and captures each request for Repeater / Intruder /
Autorize:

```bash
FF_PROXY=http://127.0.0.1:8080 FF_BASE_URL=... dev/vendor/bin/phpunit -c dev/tests/phpunit.xml.dist
```

## Related

- `dev/security/authz-matrix.test.mjs` — the same matrix as a zero-dependency
  Node test (`node --test`), for when PHP/Burp aren't handy.

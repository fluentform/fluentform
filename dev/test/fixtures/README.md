# Test Fixtures

Committed JSON snapshots that PHPUnit tests load via `$this->loadFormFixture('<name>')`.

Fixtures complement factories — factories generate variation, fixtures provide repeatable, realistic shapes for tests that care about specific structure (multi-step forms, conditional fields, payment flows).

## Adding a fixture

1. Create `dev/test/fixtures/forms/<name>.json`.
2. The file's contents will be stored verbatim in the `form_fields` column.
3. Load in a test: `$form = $this->loadFormFixture('<name>');`.

## Privacy rules — read before committing

Fixtures are checked in. Do **not** include real PII. Use these placeholders:

| Real data type | Placeholder |
|---|---|
| Email | `user1@example.com`, `admin@example.com` |
| Name | `Test User`, `User 1`, `Customer A` |
| Phone | `+1-555-0100` … `+1-555-0199` (RFC 5733 reserved range) |
| Address | `123 Test Street, Example City` |
| URL | `https://example.com`, `https://example.org` |
| Credit card | use Stripe test tokens (`tok_visa`), never real numbers |

If a fixture needs to mimic a customer issue, anonymize first. Search the diff for `@gmail`, `@yahoo`, `@hotmail` etc. before committing.

## Idempotency

Tests should not modify fixtures. If a test needs to mutate the form, call `$form->update([...])` — the suite-scoped `RefreshDatabase` truncates the table between tests so changes don't leak.

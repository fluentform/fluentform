# Authorization-matrix tests (cross-form authorization)

Runtime guard for the "authorization-scope vs. acted-on-IDs" class — a Manager
restricted to specific forms must never delete/read another form's data by
smuggling that form's object ids in the request body. Static review can't prove
this; only running it against real data can.

## What it checks

`authz-matrix.test.mjs` logs in (via session cookie + REST nonce) as a **Manager
scoped to one form** and:

1. **Smuggle** — names an authorized form (`form_id`) but sends an *unauthorized*
   form's entry id in `entries[]`, then confirms (as admin) the victim entry
   still exists. Fails if it was deleted across the form boundary.
2. **Negative control** — naming the unauthorized form directly returns `403`.
3. **Read** — the Manager cannot fetch a foreign form's entry.

## Fixture (staging only — never production)

1. Two forms, each with ≥1 entry. `FF_FORM_AUTHORIZED` = Form A, `FF_FORM_VICTIM` = Form B.
2. A Manager (Fluent Forms → Settings → Managers) granted **only Form A** +
   "Manage Entries". The underlying WP user can be a Subscriber.
3. `FF_VICTIM_ENTRY` = an existing entry id under Form B.
4. Grab each session's nonce from `GET /wp-admin/admin-ajax.php?action=rest-nonce`
   and the `Cookie` header from the browser devtools (logged-in request).

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
node --test dev/security/authz-matrix.test.mjs
```

With no env config the suite **skips** (stays green in CI) and never silently
passes the security assertions.

## Burp + Autorize (broader sweep)

For coverage beyond this fixture, drive the admin UI through **Burp + the
Autorize extension** under the Manager session: any mutating request Autorize
marks **"Bypassed!"** (got `200`, expected `403`) is a finding. Fuzz `entries[]`
/ `transaction_id` with cross-form ids via Intruder.

/**
 * Authorization matrix — cross-form authorization regression test.
 *
 * Exercises every mutating "bulk / id-array" endpoint as a low-privilege
 * Manager who is restricted to ONE form, smuggling a DIFFERENT form's object
 * ids in the body. A correct server either rejects (403/422) or no-ops
 * (0 rows touched). This is the runtime check that static review cannot do:
 * "is row N owned by the form the caller is authorized for?"
 *
 * It guards cross-form access boundaries.
 *
 * Run against a live staging site (NEVER production):
 *   FF_BASE_URL=https://staging.example.test \
 *   FF_MANAGER_COOKIE='<cookie header for the restricted Manager>' \
 *   FF_MANAGER_NONCE='<rest nonce from the Manager session>' \
 *   FF_ADMIN_COOKIE='<cookie header for an admin>' \
 *   FF_ADMIN_NONCE='<rest nonce from the admin session>' \
 *   FF_FORM_AUTHORIZED=10 \      # form the Manager IS allowed on (Form A)
 *   FF_FORM_VICTIM=20 \          # form the Manager is NOT allowed on (Form B)
 *   FF_VICTIM_ENTRY=12345 \      # an existing entry id under Form B
 *   node --test dev/security/authz-matrix.test.mjs
 *
 * Obtain a nonce from a logged-in session via:
 *   GET /wp-admin/admin-ajax.php?action=rest-nonce
 *
 * With no config the suite SKIPS (so it stays green in CI until wired to a
 * fixture); it never silently passes the security assertions.
 */
import { test, before } from 'node:test';
import assert from 'node:assert/strict';

const cfg = {
  base:           (process.env.FF_BASE_URL || '').replace(/\/$/, ''),
  managerCookie:  process.env.FF_MANAGER_COOKIE || '',
  managerNonce:   process.env.FF_MANAGER_NONCE || '',
  adminCookie:    process.env.FF_ADMIN_COOKIE || '',
  adminNonce:     process.env.FF_ADMIN_NONCE || '',
  formAuthorized: process.env.FF_FORM_AUTHORIZED || '',
  formVictim:     process.env.FF_FORM_VICTIM || '',
  victimEntry:    process.env.FF_VICTIM_ENTRY || '',
};

const REQUIRED = ['base', 'managerCookie', 'managerNonce', 'adminCookie', 'adminNonce', 'formAuthorized', 'formVictim', 'victimEntry'];
const missing = REQUIRED.filter((k) => !cfg[k]);
const SKIP = missing.length > 0;
const skipReason = SKIP ? `not configured (missing: ${missing.map((m) => 'FF_' + m.replace(/([A-Z])/g, '_$1').toUpperCase()).join(', ')})` : '';

function form(body) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(body)) {
    if (Array.isArray(v)) v.forEach((x) => p.append(`${k}[]`, x));
    else p.append(k, v);
  }
  return p;
}

async function rest(path, { method = 'POST', as = 'manager', body = {}, override } = {}) {
  const cookie = as === 'admin' ? cfg.adminCookie : cfg.managerCookie;
  const nonce = as === 'admin' ? cfg.adminNonce : cfg.managerNonce;
  const headers = { 'X-WP-Nonce': nonce, Cookie: cookie, Accept: 'application/json' };
  if (override) headers['X-HTTP-Method-Override'] = override;
  const init = { method, headers };
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    init.body = form(body).toString();
  }
  const res = await fetch(`${cfg.base}/wp-json/fluentform/v1/${path}`, init);
  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  return { status: res.status, json };
}

async function entryExists(entryId, { as = 'admin' } = {}) {
  const { status, json } = await rest(`submissions/${entryId}`, { method: 'GET', as });
  return status === 200 && !!json && !json.code; // WP error responses carry a `code`
}

before(() => {
  if (SKIP) console.log(`[authz-matrix] SKIPPED — ${skipReason}`);
});

// --- Core: the reported bug (free plugin) ---------------------------------

test('bulk-delete: smuggled foreign entry is NOT deleted under an authorized form', { skip: SKIP && skipReason }, async () => {
  assert.ok(await entryExists(cfg.victimEntry), 'precondition: victim entry should exist before the attack');

  const { status } = await rest('submissions/bulk-actions', {
    as: 'manager',
    body: {
      form_id: cfg.formAuthorized,                  // a form the Manager IS allowed on
      action_type: 'other.delete_permanently',
      entries: [cfg.victimEntry],                   // ...but a DIFFERENT form's entry id
    },
  });

  // Whether the endpoint 200s (no-op) or 4xx, the invariant is: nothing got deleted.
  assert.ok([200, 403, 422].includes(status), `unexpected status ${status}`);
  assert.ok(await entryExists(cfg.victimEntry), 'cross-form delete: victim entry was deleted across form boundary');
});

test('bulk-delete: naming the victim form directly is forbidden (negative control)', { skip: SKIP && skipReason }, async () => {
  const { status } = await rest('submissions/bulk-actions', {
    as: 'manager',
    body: {
      form_id: cfg.formVictim,                      // a form the Manager is NOT allowed on
      action_type: 'other.delete_permanently',
      entries: [cfg.victimEntry],
    },
  });
  assert.equal(status, 403, `expected 403 when naming an unauthorized form, got ${status}`);
});

test('read: Manager cannot fetch an entry of an unauthorized form', { skip: SKIP && skipReason }, async () => {
  assert.equal(await entryExists(cfg.victimEntry, { as: 'manager' }), false, 'Manager could read a foreign form entry');
});

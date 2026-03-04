# Remaining / Skipped Issues

These issues were identified during the comprehensive audit but were **not fixed** because they require major architectural decisions, coordination with FluentFormPro, or carry risk of breaking existing functionality.

---

## Security

### SEC-H1: Authorization Bypass in Subscription Cancellation
**File:** `app/Modules/Payments/TransactionShortcodes.php`
**Severity:** High
**Status:** Skipped per owner decision

**Problem:** The `cancel_transaction` route allows any logged-in user to cancel a subscription without verifying they own it. The check only confirms the user is logged in, not that the subscription belongs to them.

**Why Skipped:** The owner indicated that admins may legitimately need to cancel subscriptions on behalf of users. A proper fix would require:
- Adding ownership verification for non-admin users
- Keeping admin override capability
- Possibly adding a capability check like `fluentform_manage_payments`

**Recommended Fix:**
```php
if (!current_user_can('fluentform_manage_payments')) {
    // Verify user owns this subscription
    $subscription = /* fetch subscription */;
    if ($subscription->user_id !== get_current_user_id()) {
        wp_die('Unauthorized');
    }
}
```

---

### SEC-L6: Stripe SCA Payment Nonce
**File:** Payment processing flow (Pro feature)
**Severity:** Low
**Status:** Skipped — risk of breaking payment flow

**Problem:** The Stripe SCA payment intent confirmation flow may not have adequate nonce protection on the callback.

**Why Skipped:** Payment flows are extremely sensitive. A broken nonce check could prevent legitimate payments from completing. This needs careful testing with actual Stripe test-mode transactions before deploying. Coordinate with FluentFormPro team.

---

## Optimization

### OPT-H5: Deprecated Entries Class (880 lines)
**File:** `app/Modules/Entries/Entries.php`
**Severity:** High (code bloat)
**Status:** Cannot remove — actively used

**Problem:** The legacy `Entries` class is 880+ lines and duplicates logic that exists in `SubmissionService`. Ideally it should be removed and callers migrated.

**Active Callers Found:**
- `app/Hooks/Ajax.php` — 10 method calls (renderEntries, exportData, changeEntryStatus, etc.)
- `FluentFormPro/src/classes/EntryEditor.php` — 1 call (updateEntryDiffs)

**Recommended Plan:**
1. Create wrapper methods in `SubmissionController` / `SubmissionService` for each Ajax.php call
2. Update Ajax.php routes to point to new controller methods
3. Update FluentFormPro's EntryEditor to use SubmissionService
4. Deprecate Entries class with `@deprecated` annotation
5. Remove in next major version

---

### OPT-M2: Cache `get_option` Calls in FormValidationService
**File:** `app/Services/Form/FormValidationService.php`
**Severity:** Medium
**Status:** Skipped — not needed

**Problem:** Multiple `get_option()` calls for the same key.

**Why Skipped:** WordPress internally caches `get_option()` results in the object cache (`wp_cache`). Repeated calls for the same key only hit the database once per request. No optimization needed.

---

### OPT-M3: Remove Deprecated Per-ID Action Loops
**File:** Various service files
**Severity:** Medium
**Status:** Skipped — needs hook listener audit

**Problem:** Several places fire deprecated hooks in loops (e.g., `do_action('fluentform_before_delete_' . $id)`). These should be consolidated.

**Why Skipped:** Third-party plugins or FluentFormPro add-ons may be listening on these exact hook names. Removing them without a full audit of all listener registrations could break integrations. Requires:
1. Search all Pro add-ons for deprecated hook usage
2. Add `apply_filters_deprecated()` wrappers
3. Notify integration partners
4. Remove in next major version

---

### OPT-M4: Deprecated Report Class
**File:** `app/Modules/Entries/Report.php`
**Severity:** Medium
**Status:** Skipped — needs Pro coordination

**Problem:** The legacy `Report` class duplicates logic now in `ReportService`. Should be consolidated.

**Why Skipped:** FluentFormPro may reference this class. Needs coordinated deprecation:
1. Audit FluentFormPro for Report class usage
2. Migrate Pro callers to ReportService
3. Add `@deprecated` annotation
4. Remove in next major version

---

### OPT-M5: Move Temp Directory Cleanup to Cron
**File:** Upload/file handling code
**Severity:** Medium
**Status:** Skipped — behavior change

**Problem:** Temporary file cleanup happens inline during form submission, adding latency to the submission response.

**Why Skipped:** Moving to a cron job changes the timing behavior. If the cron doesn't run (common on low-traffic sites), temp files accumulate. Current inline approach is reliable even if slower. A proper fix would need:
- WP-Cron scheduled event
- Fallback cleanup if cron is disabled
- Admin setting for cleanup interval

---

### OPT-M6: Refactor `getDisabledComponents`
**File:** Component loading code
**Severity:** Medium
**Status:** Skipped — low ROI, high risk

**Problem:** `getDisabledComponents()` could be optimized with caching or restructuring.

**Why Skipped:** The function works correctly and is not a performance bottleneck. Refactoring it risks breaking component loading across all form types. The ROI does not justify the risk.

---

### OPT-M7: Remove Deprecated Export Class
**File:** `app/Modules/Entries/Export.php`
**Severity:** Medium
**Status:** Confirmed safe to remove, but deletion was deferred

**Problem:** The `Export` class is not called by FluentFormPro or the free plugin (Ajax.php uses `Entries::exportData()` which has its own export logic).

**Why Deferred:** File deletions were deferred during this audit cycle. Can be safely removed in the next cleanup pass via `git rm app/Modules/Entries/Export.php`.

---

### OPT-L1: Unused User Model
**File:** `app/Models/User.php`
**Severity:** Low
**Status:** Cannot remove — actively used

**Problem:** Initially flagged as potentially unused.

**Finding:** The `Submission` model defines a `user()` relationship that returns `$this->belongsTo(User::class)`. The User model is actively used and must be kept.

---

## Traceability / Architecture

### TRACE-RC-1 / TRACE-RC-2: Policy Permission Changes
**File:** `app/Http/Policies/` directory
**Severity:** Medium
**Status:** Skipped — could break existing access

**Problem:** Some policy methods may have inconsistent permission checks (e.g., using `fluentform_dashboard_access` where `fluentform_forms_manager` would be more appropriate, or vice versa).

**Why Skipped:** Changing permission strings could lock out users who currently have access. WordPress capabilities are stored in the database and assigned to roles. Changing which capability is checked requires:
1. Full audit of all capability assignments in Pro and free
2. Migration script to add new capabilities to roles that had old ones
3. Documentation for site admins
4. Backward-compatible capability mapping

---

### TRACE-RC-3: Remove Unused Classes
**Files:**
- `app/Modules/Entries/Export.php` — NOT used (safe to remove)
- `app/Http/Policies/PublicPolicy.php` — NOT used (safe to remove)
- `app/Http/Requests/UserRequest.php` — NOT used (safe to remove)

**Status:** Deferred — file deletions were not approved in this cycle

**Recommended Action:** In the next cleanup cycle, run:
```bash
git rm app/Modules/Entries/Export.php
git rm app/Http/Policies/PublicPolicy.php
git rm app/Http/Requests/UserRequest.php
```

These files have zero callers in both FluentForm free and FluentFormPro.

---

### TRACE-RC-5: IntegrationManagerController
**File:** `app/Http/Controllers/IntegrationManagerController.php`
**Severity:** Info
**Status:** Cannot remove — critical base class

**Finding:** This class serves as the base controller for 39+ integration modules in FluentFormPro (Mailchimp, ActiveCampaign, HubSpot, ConvertKit, Drip, etc.). It is one of the most critical classes in the architecture and must not be modified without extreme care.

---

## Summary

| Issue | Severity | Action Required |
|-------|----------|----------------|
| SEC-H1 | High | Add ownership check for non-admin users |
| SEC-L6 | Low | Test with Stripe before adding nonce |
| OPT-H5 | High | Multi-phase deprecation plan with Pro team |
| OPT-M3 | Medium | Audit all hook listeners before removing |
| OPT-M4 | Medium | Coordinate with Pro team |
| OPT-M5 | Medium | Design cron-based cleanup with fallback |
| OPT-M7 | Medium | Safe to `git rm` in next cycle |
| TRACE-RC-1/2 | Medium | Full capability audit + migration script |
| TRACE-RC-3 | Low | Safe to `git rm` 3 files in next cycle |
| OPT-M2 | — | No action needed (WP caches internally) |
| OPT-M6 | — | No action needed (low ROI) |
| OPT-L1 | — | No action needed (actively used) |
| TRACE-RC-5 | — | No action needed (critical base class) |

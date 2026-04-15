# Debugger Report

## 1) Executive Summary

- Scope: Allowed-form scope regressions introduced by the new `getUserAllowedFormsScope()` semantics, with emphasis on empty scoped managers versus unrestricted managers.
- Overall risk level: Medium.
- Notes on runtime or test limitations: No automated test suite was available in this workspace for these permission flows, so verification is code-path based.

### Severity Snapshot

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 1 |
| LOW | 0 |

### Verdict Snapshot

| Verdict | Count |
|---|---|
| Confirmed | 1 |
| Rejected | 2 |
| Needs manual verification | 0 |

- Top risks:
  - Saving a manager with `has_specific_forms_permission = yes` and no selected forms now stores an empty scoped list that denies all form access.
  - The manager UI still instructs admins to leave the selector blank for all-form access, so the broken state is the documented flow.
  - Existing empty-scoped managers are serialized back through the manager API as `forms: false`, which hides the actual restricted-empty state from the editor.

## 2) Table of Contents

- [Blank specific-form selection now locks managers out](#blank-specific-form-selection-now-locks-managers-out)

## 3) Confirmed Bugs by Severity

### Medium

#### Blank specific-form selection now locks managers out

- Area: Functional
- Risk classification: Bug
- Confidence: High
- File:line: `app/Services/Manager/ManagerService.php:77-82`, `resources/assets/admin/settings/Managers/Managers.vue:178-192`, `app/Services/Manager/FormManagerService.php:105-117`, `app/Http/Policies/FormPolicy.php:20-25`
- Entry point: Manager settings screen -> `Managers.vue` save action -> `ManagersController@addManager` -> `ManagerService::addManager()`
- Reproduction path:
  1. Open manager settings and enable `Specific Forms Permission`.
  2. Leave the form multiselect empty, following the current tooltip/placeholder guidance.
  3. Save the manager.
  4. The save path persists an empty form list via `FormManagerService::addUserAllowedForms([])`.
  5. `getUserAllowedFormsScope()` resolves that manager to `[]`, and policy checks such as `FormPolicy::index()` now deny form access instead of treating the manager as unrestricted.
- Evidence:
  - `Managers.vue` tells admins to "Leave blank to give the manager access to all forms" and uses the same wording in the select placeholder.
  - `ManagerService::addManager()` writes the submitted `forms` array as-is when `has_specific_forms_permission` is `yes`.
  - `FormManagerService::getUserAllowedFormsScope()` now intentionally returns `[]` for specific-form managers with no assigned forms.
  - `Acl::hasPermission(..., $formId)` / form policy checks consume that scoped result and deny access.
  - `ManagerService::getManagers()` still serializes empty assigned lists through the legacy helper and returns `forms: false`, which further masks the restricted-empty state on edit.
- Expected vs actual behavior:
  - Expected: Leaving the selection blank should either grant all-form access, as the UI currently promises, or the UI should block/save differently so admins cannot create a contradictory state.
  - Actual: Leaving the selection blank creates a manager with specific-form mode enabled and zero accessible forms.
- Impact:
  - Settings managers can reliably misconfigure managers into a no-access state using the documented UI flow.
  - Existing empty-scoped managers are hard to diagnose because the editor response collapses the empty list back to `false`.
- Severity rationale:
  - This is a reliable authorization regression in a core admin flow with direct operational impact: intended managers lose access to all forms after save.
  - It is not higher than Medium because it does not grant unauthorized access or expose data, and another privileged admin can recover the configuration.
- Recommended fix:
  - Align the manager flow with the new scope semantics by choosing one behavior explicitly:
    - If blank should still mean unrestricted, then when `has_specific_forms_permission === yes` and `forms` is empty, either disable specific-form mode or avoid persisting `_fluent_forms_allowed_forms` as an empty scoped list.
    - If blank should mean no forms, update the tooltip/placeholder and serialize empty assigned lists distinctly in `getManagers()` so the editor reflects the true restricted-empty state.
- Verifier note:
  - Confirmed end-to-end. The exact break is `ManagerService::addManager()` persisting an empty list while `FormManagerService::getUserAllowedFormsScope()` now treats that empty list as a real scoped denial state.
- Feedback for next run:
  - When permission helpers are changed to distinguish `false` from `[]`, re-audit every settings/save UI that still documents or serializes "blank means all".
- Task statement:
  - Review all manager configuration paths that still rely on legacy falsey semantics and align them with the new scoped-helper contract.

## 4) Rejected Candidates

- `app/Services/Logger/Logger.php:28-39`
  - Candidate: The `if (!$formIds && false !== ($allowForms = ...))` fallback might re-open access for restricted-empty users.
  - Verifier note: Rejected. When the current user scope is `[]`, the fallback sets `$formIds = []`, and the query immediately converts that into `whereIn(..., [0])`, which stays deny-all rather than unrestricted.

- `app/Services/Report/ReportService.php:155-163`
  - Candidate: The unrestricted branch that passes `[$requestedFormId]` or `false` might still be an empty-scope bypass.
  - Verifier note: Rejected. `false` is the intentional unrestricted sentinel in this codebase; the real regression was only the earlier `[]` override, which is already fixed.

## 5) Needs Manual Verification

None.

## 6) Prioritized Fix Backlog

1. [ ] Decide the intended UX for blank manager form selection and make `ManagerService::addManager()` enforce that behavior explicitly.
2. [ ] Update `resources/assets/admin/settings/Managers/Managers.vue` copy so it matches the post-PR permission semantics.
3. [ ] Stop collapsing empty assigned lists to `false` in `ManagerService::getManagers()` if the restricted-empty state remains valid and user-visible.

## 7) Feedback Loop Updates

- False-positive patterns added:
  - A raw `if (!$value && false !== $scope)` check is not automatically a bug when the downstream query has an explicit `[]` -> deny-all branch.
- Evidence thresholds added or tightened:
  - Treat empty-scope regressions as confirmed only after tracing a full entry point from saved settings or request input through `getUserAllowedFormsScope()` to a concrete policy/query denial or bypass.
- Recurring confirmed archetypes:
  - Legacy UI/save flows that still treat empty arrays as equivalent to unrestricted access after scope helpers start distinguishing `false` from `[]`.
- Severity calibration updates (`previous -> final`):
  - Low -> Medium for manager lockout, because the operational denial-of-access path is concrete and repeatable even without privilege escalation.

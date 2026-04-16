# Fluent Forms 6.2.1 Release Test Checklist

Simple but effective coverage list for the `6.2.1` update from the changelog in [readme.txt](/Volumes/Projects/work/forms/wp-content/plugins/fluentform/readme.txt:441).

## Recommended Test Pass Order

1. Upgrade the plugin from `6.2.0` to `6.2.1`.
2. Run the smoke scenarios first.
3. Run the targeted fix and regression scenarios.
4. Finish with one quick end-to-end submission test on a normal form and a payment or conversational form if available.

## Smoke Coverage

### FF-621-SMOKE-01: Basic admin + frontend sanity

- Open Fluent Forms admin pages: All Forms, All Entries, Reports, Settings.
- Load one published form on the frontend and submit it successfully.
- Confirm there are no fatal errors, permission errors, or broken layouts.
- Expected: Core admin and frontend flows work after upgrade.

### FF-621-SMOKE-02: Entry search and export sanity

- Open a form that already has entries.
- Search entries with a normal keyword.
- Export entries in at least one format.
- Expected: Search returns expected results and export finishes without errors.

## Targeted Release Scenarios

### FF-621-01: Form-scoped permissions on legacy AJAX and REST

- Log in as an admin and verify valid form actions still work.
- Log in as a lower-permission user and try to access form actions they should not have. **
- Expected: Allowed users can proceed; unauthorized access is blocked consistently.

### FF-621-02: Legacy encrypted token fallback after upgrade

- Use a saved draft, resume link, PDF link, or any flow that depends on older encrypted tokens from before `6.2.0`.
- Test the same flow after upgrading to `6.2.1`.
- Expected: Older tokens continue to work where compatibility fallback is intended, without breaking newly generated tokens.


### FF-621-04: Analytics and report queries still load correctly

- Open form analytics or report screens for a form with existing data.
- Test date filtering and summary widgets.
- Expected: Reports load successfully and feel at least as fast as before, with no missing or incorrect totals.


### FF-621-06: Public PDF download with legacy links

- Use an older public PDF download link generated before the update if available.
- Also test a freshly generated public PDF link.
- Expected: Both legacy and newly generated links download the correct PDF without permission or token errors.

### FF-621-07: Draft submissions export support

- Create or use a form with saved draft submissions.
- Export entries including drafts.
- Expected: Draft rows are included correctly in the export and no export error occurs.

### FF-621-08: Entries search access control

- Test entry search as an authorized admin/editor role.
- Test the same search as a user without entry access.
- Expected: Authorized users can search entries; unauthorized users cannot access entry search results.


### FF-621-10: Character limit validation message

- Add a field with a character limit and a custom validation message.
- Exceed the limit on the frontend.
- Expected: The configured custom message appears, not a raw field name or broken placeholder text.

### FF-621-11: Numeric validation should reject numeric-looking text

- Use a field with numeric validation enabled.
- Submit true numeric values like `123` and `12.50`.
- Submit numeric-looking invalid text like `12abc`, `1,2,3`, or spaced mixed input depending on field rules.
- Expected: Valid numbers pass; text that only looks numeric is rejected.

### FF-621-12: WPML addon activation

- On a site with the WPML addon available, activate the addon from the plugin flow used by Fluent Forms.
- Expected: Activation succeeds without the `Invalid plugin` error.


## Quick Sign-off Checklist

- Upgrade from `6.2.0` to `6.2.1` completed successfully.
- Existing forms still render and submit.
- Entry search, export, and reports still work.
- Legacy token-based flows still work.
- Validation messaging behaves correctly.
- No new permission regressions were found.

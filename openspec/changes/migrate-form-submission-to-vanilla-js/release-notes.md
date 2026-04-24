## Migration Release Notes: jQuery to Vanilla Submission Runtime

Date: 2026-04-24

### Summary

- Public form submission runtime now includes a vanilla path with compatibility bridge behavior.
- Legacy jQuery lifecycle events remain supported via bridge emission when jQuery is present.
- Loading mode control is available through `fluentform/jquery_loading_mode` with `auto|enabled|disabled`.

### Rollback instructions

Use this emergency filter to force legacy jQuery loading behavior immediately:

```php
add_filter('fluentform/jquery_loading_mode', fn() => 'enabled');
```

### Compatibility status

- OpenSpec strict validation: PASS (`openspec validate migrate-form-submission-to-vanilla-js --strict --no-interactive`)
- JS/PHP syntax checks for touched runtime files: PASS
- Frontend build (`npm run dev`): PASS (compiled), with existing webpack warning noise
- Generated asset side effect (`assets/js/fluent_gutenblock.js`) intentionally excluded from migration scope

### Risk log

| Risk | Severity | Mitigation |
|---|---|---|
| Third-party or Pro scripts that rely on undocumented jQuery internals may still fail in strict Disabled mode | High | Use `auto` or `enabled` mode for production until each dependent handle is validated |
| Payload/order parity regressions in edge flows (captcha timeout, payment next-action, file-only submission) | High | Keep bridge active, run targeted scenario checklist before release, monitor logs |
| Mode Auto heuristic misses a late-registered jquery-dependent script | Medium | Override with `fluentform/jquery_loading_mode_required` filter or force `enabled` |
| Admin visibility of Disabled-mode jquery dependency conflict | Medium | Warning logging + one-time admin notice implemented |

### Known limitations

- Disabled mode prioritizes vanilla core runtime continuity; jquery-dependent integrations may degrade if jQuery is intentionally absent.
- Compatibility bridge is still required for legacy event consumers and is not yet deprecated.
- Final manual browser verification matrix (all Free + Pro flows) must be completed before public release sign-off.

### Bridge deprecation note

The dual-publish bridge remains a compatibility layer for legacy consumers. Deprecation timeline is intentionally deferred and should only start after Pro and integration consumers are verified jQuery-independent across major releases.

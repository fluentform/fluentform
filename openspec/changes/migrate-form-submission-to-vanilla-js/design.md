## Context

Current public submission runtime is implemented in `resources/assets/public/form-submission.js` and initialized through `jQuery(document).ready(...)`. It uses jQuery features deeply (`$.post`, `$.param`, delegated `.on`, `.trigger/.triggerHandler`, `serializeArray`, Deferred/when, DOM traversals, and animation helpers). Free and Pro public modules subscribe to lifecycle events such as `fluentform_init`, `fluentform_init_single`, `fluentform_submission_success`, `fluentform_submission_failed`, `fluentform_reset`, `ff_reinit`, and step events (`ff_to_next_page`, `ff_to_prev_page`, `update_slider`).

Script registration currently declares `fluent-form-submission` with `['jquery']` dependency in `app/Modules/Component/Component.php`. A direct dependency drop without a compatibility contract can break Pro handlers (payment, chat, gateway scripts) and third-party custom code relying on jQuery event buses.

## Goals / Non-Goals

**Goals:**
- Replace jQuery-only implementation in `form-submission.js` with vanilla DOM/event/network APIs while preserving behavior.
- Keep Free and Pro runtime behavior unchanged for existing users.
- Preserve existing jQuery event contract via bridge mode so integrations continue to work.
- Provide an explicit option/interface for jQuery loading mode instead of hard coupling.
- Document and validate side effects across script dependencies and event consumers.

**Non-Goals:**
- Rewriting all other Free/Pro public scripts to vanilla JS in the same change.
- Removing jQuery from the entire plugin ecosystem in one release.
- Changing server-side submission APIs or response payload contracts.

## Decisions

1. **Phased migration with compatibility-first order**
- Decision: Implement a behavior-preserving vanilla core first, then route existing event emissions through a compatibility bridge.
- Why: minimizes risk for Pro modules and third-party snippets that rely on current event timing and payloads.
- Alternative considered: hard switch to native-only events immediately. Rejected due to high regression risk.

2. **Dual event publishing (native + jQuery bridge) during migration period**
- Decision: Keep native `CustomEvent` publishing and additionally emit equivalent jQuery events when jQuery is available or explicitly loaded.
- Why: preserves backward compatibility while allowing future consumers to migrate to native listeners.
- Alternative considered: native-only events with migration notes. Rejected for immediate compatibility risk.

3. **Configurable jQuery loading mode (Auto/Enabled/Disabled)**
- Decision: Introduce a runtime loading policy exposed via interface (settings or filter-backed configuration) with three modes:
  - Auto (default): load jQuery only when required by active features/integrations.
  - Enabled: always load jQuery and bridge events.
  - Disabled: do not enqueue jQuery for core submission runtime; still run vanilla core.
- Why: enables safe rollout and progressive jQuery reduction without forcing risky defaults.
- Alternative considered: binary on/off only. Rejected due to insufficient operational control.

4. **Dependency audit as a release gate**
- Decision: treat Free+Pro script dependency/event-consumer matrix as required deliverable before changing enqueue dependencies.
- Why: regression risk mostly lives in side effects, not only in `form-submission.js` internals.
- Alternative considered: ad-hoc manual checks. Rejected for incomplete coverage.

5. **Step runtime becomes the next explicit migration slice**
- Decision: migrate `resources/assets/public/Pro/slider.js` as the next core runtime target after submission-runtime and advanced-bootstrap stabilization.
- Why: step forms are the largest remaining reason Fluent Forms still needs jQuery on otherwise clean public pages, and step events (`ff_to_next_page`, `ff_to_prev_page`, `update_slider`) are central to Free/Pro compatibility.
- Alternative considered: defer `slider.js` until after payment handlers. Rejected because it prolongs the biggest jQuery blocker for ordinary public forms.

## Risks / Trade-offs

- [Event timing drift] Native event dispatch order may differ from jQuery `.triggerHandler()` semantics.
  → Mitigation: define event ordering in spec and add regression checks for key hooks.

- [Hidden jQuery coupling] Pro or third-party scripts may rely on undocumented jQuery internals.
  → Mitigation: dependency/event matrix and Auto mode default before any strict disable path.

- [Behavior parity gaps] Form serialization, excluded field filtering, and error rendering can diverge subtly.
  → Mitigation: parity checklist and scenario-driven QA for each form type (simple, step, payment, upload).

- [Operational confusion] New option might be misconfigured.
  → Mitigation: clear mode descriptions in interface and safe default (Auto).

## Migration Plan

1. Baseline map
- Map all jQuery API usages in `form-submission.js` and classify by capability (events, network, DOM helpers, animation, deferred).
- Build consumer matrix across Free/Pro scripts listening to Fluent Forms runtime events.

2. Implement vanilla core (behavior parity)
- Replace jQuery-specific internals with native equivalents while preserving payloads and observable behavior.
- Keep existing public API entry points (e.g., `window.fluentFormApp`, `window.ff_helper`) stable.

3. Migrate step runtime
- Convert `resources/assets/public/Pro/slider.js` to native DOM/event/network APIs while preserving:
  - step navigation order
  - progress indicator updates
  - focus/scroll behavior
  - draft restore behavior
  - legacy step event payloads
- Keep legacy jQuery emission behind the central bridge while step internals move to plain JS.

4. Add jQuery compatibility bridge
- Centralize runtime event emission and ensure equivalent jQuery events are fired with same names/data when bridge active.
- Preserve current hooks used by Pro/payment/chat integrations.

5. Add jQuery loading control interface
- Add setting/filter-backed mode and wire enqueue dependency behavior.
- Default to Auto; keep Enabled path for strict backward compatibility.

6. Verification and rollout
- Validate scenarios in Free and Pro, including file uploads, step forms, payment next actions, reset flows, captcha cycles, and `ff_reinit`.
- Include explicit package/dependency impact review before release.

7. Rollback strategy
- If severe regression occurs, switch mode to Enabled globally and/or restore jQuery dependency declaration while retaining migration artifacts.

## Open Questions

- [RESOLVED] **Loading control UI surface**: Implement as WordPress filter `fluentform/jquery_loading_mode`
  first. Expose a Global Settings field (key: `ff_jquery_loading_mode`) in the same release for
  site-owner discoverability. Filter always takes precedence over the stored option.

- [RESOLVED] **Auto mode heuristic**: jQuery is considered "required" in Auto mode when at least one
  of the following is true at `wp_enqueue_scripts` time:
  (a) a registered Fluent Forms Free or Pro public script handle declares `['jquery']` as a dependency, OR
  (b) the filter `fluentform/jquery_loading_mode_required` returns `true`.

- [OPEN] **Bridge deprecation timeline**: Not decided in this change. Requires a separate deprecation
  proposal tied to Pro plugin jQuery-free readiness. Bridge SHALL remain active for a minimum of
  2 major releases after the vanilla core ships.

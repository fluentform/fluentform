/**
 * Fluid Form Event Bridge - jQuery/Native dual-support event system
 * Provides unified event API that works with or without jQuery
 */

const { isJQueryAvailable } = require("./jquery-mode-constants.js");

// Fire jQuery events whenever jQuery is on the page, regardless of the loading mode.
// "Disabled" mode controls whether we declare jQuery as a script DEP — but our own
// allowlist (fluentform-advanced, form-save-progress, payments) and third-party plugins
// can still bring jQuery in. When it's there, legacy `$.on()` handlers expect their
// positional `[$theForm, form]` args; without `$.trigger`, they only get the CustomEvent
// fire (no extra args) and crash on `$theForm.attr(...)`.
function shouldFireJqueryEvents() {
    return isJQueryAvailable();
}

function ensureFluentFormJqueryBridge() {
    if (window.fluentFormBridge) {
        return window.fluentFormBridge;
    }
    window.fluentFormBridge = {
        emitEvent: function (
            eventName,
            detail,
            targetElement,
            jqueryEventArguments,
            options
        ) {
            // Validate event name to prevent prototype pollution and unexpected events
            if (
                typeof eventName !== "string" ||
                !/^[a-z_][a-z0-9_]*$/i.test(eventName)
            ) {
                console.warn(
                    "fluentFormBridge: Invalid event name:",
                    eventName
                );
                return;
            }

            const eventOptions = options || {};
            const eventTarget = targetElement || document;

            // Fire the native CustomEvent first so addEventListener handlers can
            // cancel before any jQuery handlers run. We then reconcile the result
            // into the jQuery .trigger() so cancellation flows in BOTH directions:
            //   native preventDefault()       → jQuery sees event.isDefaultPrevented()
            //   native stopPropagation()      → jQuery .trigger() is skipped
            //   jQuery preventDefault()       → reflected back onto the native event
            //   jQuery stopPropagation()      → propagated to the native event
            const browserEvent = new CustomEvent(eventName, {
                detail: detail,
                cancelable: true,
                bubbles:
                    typeof eventOptions.bubbles === "boolean"
                        ? eventOptions.bubbles
                        : true,
            });

            eventTarget.dispatchEvent(browserEvent);

            const nativePreventedDefault = browserEvent.defaultPrevented;

            // Note: native `stopPropagation()` only affects ancestor bubbling of
            // the native event chain — it does NOT mean "skip jQuery handlers on
            // the same target." We deliberately do not short-circuit here; jQuery
            // handlers attached to the same eventTarget should still run.

            if (shouldFireJqueryEvents()) {
                const $target = window.jQuery(eventTarget);
                const jqueryEvent = window.jQuery.Event(eventName, {
                    // Carry the native cancellation flag into the jQuery event so
                    // jQuery handlers see it via `e.isDefaultPrevented()`.
                    isDefaultPrevented: nativePreventedDefault
                        ? () => true
                        : undefined,
                });

                // Wrap raw DOM nodes so legacy handlers like `function(e, $theForm)`
                // keep working when vanilla emit sites pass a plain `formEl`.
                const baseArgs = jqueryEventArguments
                    ?? (detail !== undefined ? [detail] : []);
                const triggerArgs = baseArgs.map(arg =>
                    arg?.nodeType === 1 ? window.jQuery(arg) : arg
                );

                $target.trigger(jqueryEvent, triggerArgs);

                // Reflect any new cancellation (jQuery handler called
                // preventDefault) back onto the native event, in case any caller
                // checks `browserEvent.defaultPrevented` after emitEvent returns.
                if (
                    !nativePreventedDefault &&
                    jqueryEvent.isDefaultPrevented?.() === true
                ) {
                    browserEvent.preventDefault();
                }
            }

            return browserEvent;
        },
        onEvent: function (targetElement, eventNames, handler, options) {
            const eventTarget = targetElement || document;
            // HTMLFormElement is array-like (`form[0]` returns the first field), so the
            // old `eventTarget[0]?.nodeType === 1` unwrap accidentally redirected listeners
            // to the first input instead of the form. Only unwrap when we were handed a
            // jQuery wrapper (which advertises `.jquery`).
            const targetNode =
                eventTarget && typeof eventTarget.jquery === "string"
                    ? eventTarget[0]
                    : eventTarget;
            const names = Array.isArray(eventNames)
                ? eventNames
                : String(eventNames || "")
                      .split(/\s+/)
                      .filter(Boolean);
            const removers = [];

            names.forEach(function (eventName) {
                // Track handlers to prevent duplicates (if using addEventListener)
                const handlerKey =
                    "__fluentFormHandler_" + eventName + "_" + handler.name;

                // Use jQuery if available (for backward compatibility), otherwise use native listeners
                if (isJQueryAvailable()) {
                    const jqueryTarget = window.jQuery(
                        targetNode || eventTarget
                    );
                    const jqueryHandler = function (event) {
                        const jqueryArguments = Array.prototype.slice.call(
                            arguments,
                            1
                        );
                        handler(
                            event,
                            jqueryArguments[0],
                            jqueryArguments,
                            "jquery"
                        );
                    };

                    jqueryTarget.on(eventName, jqueryHandler);
                    removers.push(function () {
                        jqueryTarget.off(eventName, jqueryHandler);
                    });
                } else if (
                    targetNode &&
                    typeof targetNode.addEventListener === "function"
                ) {
                    // Fall back to native event listeners when jQuery is not available
                    const nativeHandler = function (event) {
                        handler(event, event.detail, [event.detail], "native");
                    };

                    // Warn if similar handler already registered (for debugging, but allow duplicates)
                    // Different features/packages may legitimately register handlers at different times
                    if (
                        targetNode[handlerKey] &&
                        typeof window.console !== "undefined"
                    ) {
                        console.warn(
                            "fluentFormBridge: Handler with name '" +
                                handler.name +
                                "' already registered for event '" +
                                eventName +
                                "'. This may be intentional (multiple features) or accidental (initialization twice)."
                        );
                    }

                    // Track handler for warning purposes (not blocking)
                    if (!targetNode[handlerKey]) {
                        targetNode[handlerKey] = [];
                    }
                    targetNode[handlerKey].push(nativeHandler);

                    targetNode.addEventListener(
                        eventName,
                        nativeHandler,
                        options || false
                    );
                    removers.push(function () {
                        targetNode.removeEventListener(
                            eventName,
                            nativeHandler,
                            options || false
                        );
                        // Clean up tracking
                        const idx = targetNode[handlerKey].indexOf(
                            nativeHandler
                        );
                        if (idx !== -1) {
                            targetNode[handlerKey].splice(idx, 1);
                        }
                    });
                }
            });

            return function () {
                removers.forEach(function (removeListener) {
                    removeListener();
                });
            };
        },
    };
    return window.fluentFormBridge;
}

module.exports = { ensureFluentFormJqueryBridge };

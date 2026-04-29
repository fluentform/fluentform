/**
 * Fluid Form Event Bridge - jQuery/Native dual-support event system
 * Provides unified event API that works with or without jQuery
 */

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
            if (typeof window.jQuery === "function") {
                const $jqueryEventTarget = window.jQuery(eventTarget);
                if (typeof jqueryEventArguments !== "undefined") {
                    $jqueryEventTarget.trigger(eventName, jqueryEventArguments);
                } else if (typeof detail !== "undefined") {
                    $jqueryEventTarget.trigger(eventName, [detail]);
                } else {
                    $jqueryEventTarget.trigger(eventName);
                }
                return;
            }

            const browserEvent = new CustomEvent(eventName, {
                detail: detail,
                bubbles:
                    typeof eventOptions.bubbles === "boolean"
                        ? eventOptions.bubbles
                        : true,
            });
            eventTarget.dispatchEvent(browserEvent);
        },
        onEvent: function (targetElement, eventNames, handler, options) {
            const eventTarget = targetElement || document;
            const targetNode =
                eventTarget[0] && eventTarget[0].nodeType === 1
                    ? eventTarget[0]
                    : eventTarget;
            const names = Array.isArray(eventNames)
                ? eventNames
                : String(eventNames || "")
                      .split(/\s+/)
                      .filter(Boolean);
            const removers = [];

            names.forEach(function (eventName) {
                // Use jQuery if available (for backward compatibility), otherwise use native listeners
                if (typeof window.jQuery === "function") {
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

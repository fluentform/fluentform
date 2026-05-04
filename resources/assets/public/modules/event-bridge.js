/**
 * Fluent Forms event bridge
 *
 * Single API for emitting and listening to FluentForm events under either
 * runtime: with jQuery on the page (Pro / payments / save-progress / 3rd-party
 * brings it in) or without it (jQuery-disabled mode).
 *
 *   • emitEvent fires ONE path per mode:
 *       - jQuery present → $.trigger only
 *       - jQuery absent  → native CustomEvent only
 *     Every event the bridge emits was a `$.trigger`-only event in dev, so
 *     skipping the CustomEvent when jQuery is present matches dev behavior
 *     exactly and avoids a dual-fire that crashed legacy `(event, instance)`
 *     handlers when the CustomEvent path delivered them no positional args.
 *
 *   • onEvent registers via the matching path. Internal listeners that need
 *     to work in both modes go through here so they don't have to care.
 */

const { isJQueryAvailable } = require("./jquery-mode-constants.js");

const VALID_EVENT_NAME = /^[a-z_][a-z0-9_]*$/i;

const isElementNode = node => node?.nodeType === 1;
const isJqueryWrapper = obj => typeof obj?.jquery === "string";

// HTMLFormElement is array-like (`form[0]` returns the first field), so a naive
// `target[0]?.nodeType === 1` unwrap accidentally redirects listeners to the
// first input. Only unwrap when handed a real jQuery collection.
const unwrapJquery = target =>
    isJqueryWrapper(target) ? target[0] : target;

// Wrap raw DOM nodes in jQuery so legacy handlers like `function (e, $form)`
// keep working when vanilla emit sites pass a plain element.
const wrapElementsForJquery = args =>
    args.map(arg => (isElementNode(arg) ? window.jQuery(arg) : arg));

const splitEventNames = eventNames =>
    Array.isArray(eventNames)
        ? eventNames
        : String(eventNames || "").split(/\s+/).filter(Boolean);

function triggerJqueryEvent(target, eventName, jqueryArgs, detail) {
    const $target = window.jQuery(target);
    const event = window.jQuery.Event(eventName);
    const args = jqueryArgs ?? (detail !== undefined ? [detail] : []);
    $target.trigger(event, wrapElementsForJquery(args));
    return event;
}

function dispatchNativeEvent(target, eventName, detail, options) {
    const event = new CustomEvent(eventName, {
        detail,
        cancelable: true,
        bubbles: typeof options?.bubbles === "boolean" ? options.bubbles : true,
    });
    target.dispatchEvent(event);
    return event;
}

function attachJqueryListener(target, eventName, handler) {
    const $target = window.jQuery(target);
    const wrapped = function (event, ...rest) {
        handler(event, rest[0], rest, "jquery");
    };
    $target.on(eventName, wrapped);
    return () => $target.off(eventName, wrapped);
}

function attachNativeListener(target, eventName, handler, options) {
    if (typeof target?.addEventListener !== "function") {
        return () => {};
    }
    const wrapped = function (event) {
        handler(event, event.detail, [event.detail], "native");
    };
    target.addEventListener(eventName, wrapped, options || false);
    return () => target.removeEventListener(eventName, wrapped, options || false);
}

function ensureFluentFormJqueryBridge() {
    if (window.fluentFormBridge) {
        return window.fluentFormBridge;
    }

    window.fluentFormBridge = {
        emitEvent(eventName, detail, targetElement, jqueryArgs, options) {
            if (
                typeof eventName !== "string" ||
                !VALID_EVENT_NAME.test(eventName)
            ) {
                console.warn(
                    "fluentFormBridge: Invalid event name:",
                    eventName
                );
                return;
            }

            const target = targetElement || document;

            return isJQueryAvailable()
                ? triggerJqueryEvent(target, eventName, jqueryArgs, detail)
                : dispatchNativeEvent(target, eventName, detail, options);
        },

        onEvent(targetElement, eventNames, handler, options) {
            const target = unwrapJquery(targetElement || document);
            const names = splitEventNames(eventNames);

            const removers = names.map(eventName =>
                isJQueryAvailable()
                    ? attachJqueryListener(target, eventName, handler)
                    : attachNativeListener(target, eventName, handler, options)
            );

            return () => removers.forEach(remove => remove());
        },
    };

    return window.fluentFormBridge;
}

module.exports = { ensureFluentFormJqueryBridge };

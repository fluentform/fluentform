/**
 * Vanilla CAPTCHA renderer.
 *
 * Origin: dev:resources/assets/public/form-submission.js:988-1073
 * Migration:
 *   - maybeRenderCaptchas (dev:988-1013): same gated render order — reCAPTCHA
 *     and Turnstile via `.ready(...)`, hCaptcha immediate.
 *   - renderCaptcha (dev:1015-1058): reads sitekey via `dataset.sitekey || el.getAttribute(...)`,
 *     skips re-render when the iframe is already present, calls the global
 *     `grecaptcha.render` / `hcaptcha.render` / `turnstile.render` and persists
 *     the widget id back onto `data-${type}_widget_id` (the hyphenated form is
 *     mandatory — see WIDGET_ATTR comment below; PR8 C-30).
 *   - resetCaptcha (dev:1060-1073) + reinitCaptchasForReinit: reset by widget id
 *     for each provider; remove + re-render the Turnstile widget.
 *   Lazy-render is wired from `wireFirstInteractionAndCaptchaTriggers`
 *   (form-submission.plain.js) on focusin and step navigation.
 */

// Origin: dev:form-submission.js:1018, 1054 — `$el.attr('data-' + type + '_widget_id', widgetId)`.
// The hyphen between e.g. `g` and `recaptcha` is what makes the attribute
// read back as `dataset.gRecaptcha_widget_id` (consumers in
// form-submission.plain.js read those camelCased keys). Without the hyphen,
// captcha widget lookups silently fail and tokens never reach the server.
const WIDGET_ATTR = {
    "g-recaptcha": "data-g-recaptcha_widget_id",
    "cf-turnstile": "data-cf-turnstile_widget_id",
    "h-captcha": "data-h-captcha_widget_id",
};

function getWidgetAttr(type) {
    return WIDGET_ATTR[type] || `data-${type}_widget_id`;
}

function renderCaptcha(type, el, renderFunction) {
    if (!el || typeof renderFunction !== "function") {
        return;
    }

    const widgetIdAttr = getWidgetAttr(type);
    const siteKey = el.dataset.sitekey || el.getAttribute("data-sitekey");
    const id = el.id;

    try {
        let widgetId = el.getAttribute(widgetIdAttr);

        if (type === "g-recaptcha" || type === "h-captcha") {
            if (widgetId && el.querySelectorAll("iframe").length > 0) {
                return; // Already rendered
            }
        } else if (type === "cf-turnstile") {
            const responseInput = el.querySelector(
                'input[name="cf-turnstile-response"]'
            );
            if (responseInput && responseInput.value) {
                return;
            }
            if (widgetId && window.turnstile) {
                try {
                    window.turnstile.remove(widgetId);
                } catch (error) {
                    // Ignore — widget may already be gone.
                }
            }
        }

        let container = id;
        const options = { sitekey: siteKey };
        if (type === "cf-turnstile") {
            container = "#" + id;
        }

        widgetId = renderFunction(container, options);
        el.setAttribute(widgetIdAttr, widgetId);
    } catch (error) {
        console.error(`Error rendering ${type}:`, error);
    }
}

function resetCaptcha(type, el, resetFunction) {
    if (!el || typeof resetFunction !== "function") {
        return false;
    }
    const widgetIdAttr = getWidgetAttr(type);
    const existing = el.getAttribute(widgetIdAttr);
    if (!existing) {
        return false;
    }
    try {
        resetFunction(existing);
        return true;
    } catch (error) {
        console.error(`Error resetting ${type}:`, error);
        el.removeAttribute(widgetIdAttr);
        return false;
    }
}

function maybeRenderCaptchas(formEl) {
    if (!formEl) {
        return;
    }

    if (
        window.grecaptcha &&
        typeof window.grecaptcha.ready === "function"
    ) {
        const recaptchas = formEl.querySelectorAll(
            ".ff-el-recaptcha.g-recaptcha"
        );
        if (recaptchas.length) {
            window.grecaptcha.ready(function () {
                recaptchas.forEach(el =>
                    renderCaptcha("g-recaptcha", el, window.grecaptcha.render)
                );
            });
        }
    }

    if (
        window.turnstile &&
        typeof window.turnstile.ready === "function"
    ) {
        const turnstiles = formEl.querySelectorAll(
            ".ff-el-turnstile.cf-turnstile"
        );
        if (turnstiles.length) {
            window.turnstile.ready(function () {
                turnstiles.forEach(el =>
                    renderCaptcha("cf-turnstile", el, window.turnstile.render)
                );
            });
        }
    }

    if (window.hcaptcha) {
        const hcaptchas = formEl.querySelectorAll(".ff-el-hcaptcha.h-captcha");
        hcaptchas.forEach(el =>
            renderCaptcha("h-captcha", el, window.hcaptcha.render)
        );
    }
}

function reinitCaptchasForReinit(formEl) {
    if (!formEl) {
        return;
    }

    if (
        window.grecaptcha &&
        typeof window.grecaptcha.ready === "function"
    ) {
        const recaptchas = formEl.querySelectorAll(
            ".ff-el-recaptcha.g-recaptcha"
        );
        if (recaptchas.length) {
            window.grecaptcha.ready(function () {
                recaptchas.forEach(el => {
                    if (
                        !resetCaptcha("g-recaptcha", el, window.grecaptcha.reset)
                    ) {
                        renderCaptcha(
                            "g-recaptcha",
                            el,
                            window.grecaptcha.render
                        );
                    }
                });
            });
        }
    }

    if (
        window.turnstile &&
        typeof window.turnstile.ready === "function"
    ) {
        const turnstiles = formEl.querySelectorAll(
            ".ff-el-turnstile.cf-turnstile"
        );
        if (turnstiles.length) {
            window.turnstile.ready(function () {
                turnstiles.forEach(el => {
                    if (
                        !resetCaptcha(
                            "cf-turnstile",
                            el,
                            window.turnstile.reset
                        )
                    ) {
                        renderCaptcha(
                            "cf-turnstile",
                            el,
                            window.turnstile.render
                        );
                    }
                });
            });
        }
    }

    if (window.hcaptcha) {
        const hcaptchas = formEl.querySelectorAll(".ff-el-hcaptcha.h-captcha");
        hcaptchas.forEach(el => {
            if (!resetCaptcha("h-captcha", el, window.hcaptcha.reset)) {
                renderCaptcha("h-captcha", el, window.hcaptcha.render);
            }
        });
    }
}

module.exports = {
    renderCaptcha,
    resetCaptcha,
    maybeRenderCaptchas,
    reinitCaptchasForReinit,
};

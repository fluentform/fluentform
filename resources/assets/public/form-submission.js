// Form submission entry point with intelligent conditional loading
// Routes to jQuery wrapper or vanilla JS modules based on availability and settings

const {
    JQUERY_MODE_DISABLED,
    JQUERY_MODE_AUTO,
    getConfiguredJQueryMode,
    isJQueryAvailable,
} = require("./modules/jquery-mode-constants.js");

function bootFluentFormSubmission() {
    try {
        const jQueryMode = getConfiguredJQueryMode();

        if (jQueryMode === JQUERY_MODE_DISABLED) {
            // Force vanilla JS when explicitly disabled in settings
            const vanillaSubmission = require("./modules/form-submission.plain.js");
            vanillaSubmission.initVanillaSubmissionRuntime();
            return;
        }

        if (jQueryMode === JQUERY_MODE_AUTO) {
            // Auto mode: intelligently choose based on jQuery availability
            if (isJQueryAvailable()) {
                require("./form-submission-jquery.js");
            } else {
                const vanillaSubmission = require("./modules/form-submission.plain.js");
                vanillaSubmission.initVanillaSubmissionRuntime();
            }
            return;
        }

        // Enabled mode: force jQuery regardless
        require("./form-submission-jquery.js");
    } catch (error) {
        console.error("FluentForm submission runtime initialization failed:", error);
        // Fallback: mark forms as still loading so the user sees the loading state
        const markForms = function () {
            const forms = document.querySelectorAll(".frm-fluent-form");
            forms.forEach(function (form) {
                form.classList.add("ff-form-loading");
            });
        };
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", markForms);
        } else {
            markForms();
        }
    }
}

// Defer the path decision until DOMContentLoaded so deferred jQuery loaders
// (performance plugins, async/defer attributes) have a chance to register
// `window.jQuery` before we choose between the jQuery and vanilla runtimes.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootFluentFormSubmission);
} else {
    bootFluentFormSubmission();
}

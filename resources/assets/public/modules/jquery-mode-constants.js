// Shared jQuery loading mode values + detection helpers
// Mirrors FluentForm\App\Helpers\Helper::JQUERY_MODE_* constants

const JQUERY_MODE_AUTO = "auto";
const JQUERY_MODE_ENABLED = "enabled";
const JQUERY_MODE_DISABLED = "disabled";

function getConfiguredJQueryMode() {
    if (
        typeof window !== "undefined" &&
        window.fluentFormVars &&
        window.fluentFormVars.jQueryMode
    ) {
        return window.fluentFormVars.jQueryMode;
    }
    return JQUERY_MODE_AUTO;
}

function isJQueryAvailable() {
    return typeof window !== "undefined" && typeof window.jQuery === "function";
}

module.exports = {
    JQUERY_MODE_AUTO,
    JQUERY_MODE_ENABLED,
    JQUERY_MODE_DISABLED,
    getConfiguredJQueryMode,
    isJQueryAvailable,
};

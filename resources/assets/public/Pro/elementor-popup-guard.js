// Elementor popups close on outside clicks via a window-level capture
// listener (elementor dialog.js hideOnOutsideClick). The image-crop overlay
// is a lity lightbox appended to document.body — outside the popup's DOM —
// so every click inside it hides the popup. The dialog exposes a per-click
// exemption selector (hide.ignore; Elementor Pro uses it for the
// body-appended flatpickr calendar), which we extend at runtime on the
// documented elementor/popup/show event. stopPropagation cannot work here:
// the capture listener fires before the event reaches the overlay.
// CJS on purpose — consumed by webpack via interop and required directly
// by dev/tests/js/elementor-popup-cropper-guard.test.js.

var FF_OVERLAY_SELECTOR = '.ff-cropper-lity';

function extendElementorPopupHideSettings(hide) {
    var ignore = (hide && hide.ignore) || '';

    if (ignore.indexOf(FF_OVERLAY_SELECTOR) !== -1) {
        return null;
    }

    return Object.assign({}, hide, {
        ignore: (ignore ? ignore + ', ' : '') + FF_OVERLAY_SELECTOR
    });
}

function applyGuardToModal(modal) {
    if (!modal || typeof modal.getSettings !== 'function' || typeof modal.setSettings !== 'function') {
        return false;
    }

    var updated = extendElementorPopupHideSettings(modal.getSettings('hide'));
    if (!updated) {
        return false;
    }

    modal.setSettings('hide', updated);

    return true;
}

// Catch-up for popups shown before the guard registered (delay-JS optimizers
// can execute the fluentform-advanced bundle after the popup's first show).
// Called at crop-open time with the form element; resolves the host popup
// document and patches its already-created modal. Idempotent via
// extendElementorPopupHideSettings.
function guardHostElementorPopup(formEl) {
    if (typeof window === 'undefined' || !formEl || typeof formEl.closest !== 'function') {
        return false;
    }

    var modalEl = formEl.closest('.elementor-popup-modal');
    if (!modalEl) {
        return false;
    }

    var match = (modalEl.id || '').match(/elementor-popup-modal-(\d+)/);
    var frontend = window.elementorFrontend;

    if (
        !match ||
        !frontend ||
        !frontend.documentsManager ||
        !frontend.documentsManager.documents
    ) {
        return false;
    }

    var popupDocument = frontend.documentsManager.documents[match[1]];
    if (!popupDocument || typeof popupDocument.getModal !== 'function') {
        return false;
    }

    return applyGuardToModal(popupDocument.getModal());
}

function registerElementorPopupGuard() {
    if (typeof window === 'undefined' || !window.jQuery || window.__ffElementorPopupGuard) {
        return;
    }

    window.__ffElementorPopupGuard = true;

    window.jQuery(document).on('elementor/popup/show', function (event, id, popupDocument) {
        if (popupDocument && typeof popupDocument.getModal === 'function') {
            applyGuardToModal(popupDocument.getModal());
        }
    });
}

module.exports = {
    extendElementorPopupHideSettings: extendElementorPopupHideSettings,
    applyGuardToModal: applyGuardToModal,
    guardHostElementorPopup: guardHostElementorPopup,
    registerElementorPopupGuard: registerElementorPopupGuard
};

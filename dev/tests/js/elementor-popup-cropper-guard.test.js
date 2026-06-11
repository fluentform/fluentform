// Regression: image-crop modal closes the host Elementor popup.
//
// The crop UI is a lity lightbox appended to document.body — outside the
// Elementor popup's DOM tree. Elementor popups close on outside clicks via a
// window-level capture listener (elementor dialog.js), so every click inside
// the cropper (ratio buttons, Reset, Crop & Upload) hides the popup.
//
// Elementor's dialog exposes a sanctioned exemption: the hide.ignore selector,
// checked per click. Elementor Pro itself uses it for the body-appended
// flatpickr calendar. The guard extends that selector with the cropper overlay
// on the documented elementor/popup/show event, plus a catch-up at crop-open
// time for popups that were shown before the guard registered (delay-JS
// optimizers can execute fluentform-advanced after the popup's first show).
//
// Source under test: resources/assets/public/Pro/elementor-popup-guard.js
// (CJS module consumed by the fluentform-advanced bundle via webpack interop).

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');

const {
    extendElementorPopupHideSettings,
    applyGuardToModal,
    guardHostElementorPopup,
} = require('../../../resources/assets/public/Pro/elementor-popup-guard.js');

test('appends the cropper selector while preserving existing ignore', () => {
    const hide = {
        auto: false,
        onOutsideClick: true,
        ignore: '.flatpickr-calendar',
    };

    const updated = extendElementorPopupHideSettings(hide);

    assert.strictEqual(updated.ignore, '.flatpickr-calendar, .ff-cropper-lity');
    assert.strictEqual(updated.onOutsideClick, true);
    assert.strictEqual(updated.auto, false);
});

test('handles missing or empty ignore selector', () => {
    assert.strictEqual(extendElementorPopupHideSettings({}).ignore, '.ff-cropper-lity');
    assert.strictEqual(extendElementorPopupHideSettings(null).ignore, '.ff-cropper-lity');
    assert.strictEqual(extendElementorPopupHideSettings({ ignore: '' }).ignore, '.ff-cropper-lity');
});

test('is idempotent — returns null when already patched', () => {
    const patched = extendElementorPopupHideSettings({ ignore: '.flatpickr-calendar' });

    assert.strictEqual(extendElementorPopupHideSettings(patched), null);
});

test('does not mutate the input settings object', () => {
    const hide = { ignore: '.flatpickr-calendar' };

    extendElementorPopupHideSettings(hide);

    assert.strictEqual(hide.ignore, '.flatpickr-calendar');
});

function makeModal(initialIgnore) {
    const calls = [];
    const settings = { hide: { ignore: initialIgnore, onOutsideClick: true } };
    return {
        calls,
        settings,
        getSettings: (key) => settings[key],
        setSettings: (key, value) => {
            settings[key] = value;
            calls.push([key, value]);
        },
    };
}

test('applyGuardToModal merges settings through the dialog widget API', () => {
    const modal = makeModal('.flatpickr-calendar');

    assert.strictEqual(applyGuardToModal(modal), true);
    assert.strictEqual(modal.calls.length, 1);
    assert.strictEqual(modal.settings.hide.ignore, '.flatpickr-calendar, .ff-cropper-lity');
    assert.strictEqual(modal.settings.hide.onOutsideClick, true);

    // Second popup show of the same modal must not re-append selectors.
    assert.strictEqual(applyGuardToModal(modal), false);
    assert.strictEqual(modal.calls.length, 1);
});

test('applyGuardToModal tolerates absent or partial modal objects', () => {
    assert.strictEqual(applyGuardToModal(null), false);
    assert.strictEqual(applyGuardToModal(undefined), false);
    assert.strictEqual(applyGuardToModal({ getSettings: () => ({}) }), false);
    assert.strictEqual(applyGuardToModal({ setSettings: () => {} }), false);
});

// --- guardHostElementorPopup (delay-JS catch-up at crop-open time) ---

const realWindow = global.window;

beforeEach(() => {
    global.window = {};
});

afterEach(() => {
    global.window = realWindow;
});

function makePopupEnv(popupId, modal) {
    global.window.elementorFrontend = {
        documentsManager: {
            documents: { [popupId]: { getModal: () => modal } },
        },
    };
    return {
        closest: (selector) =>
            selector === '.elementor-popup-modal'
                ? { id: 'elementor-popup-modal-' + popupId }
                : null,
    };
}

test('guardHostElementorPopup patches the host popup of a form element', () => {
    const modal = makeModal('.flatpickr-calendar');
    const formEl = makePopupEnv('1949', modal);

    assert.strictEqual(guardHostElementorPopup(formEl), true);
    assert.strictEqual(modal.settings.hide.ignore, '.flatpickr-calendar, .ff-cropper-lity');

    // Already-patched popup: no further writes.
    assert.strictEqual(guardHostElementorPopup(formEl), false);
    assert.strictEqual(modal.calls.length, 1);
});

test('guardHostElementorPopup is a no-op outside Elementor popups', () => {
    global.window.elementorFrontend = { documentsManager: { documents: {} } };

    assert.strictEqual(guardHostElementorPopup({ closest: () => null }), false);
    assert.strictEqual(guardHostElementorPopup(null), false);
    assert.strictEqual(guardHostElementorPopup({}), false);
});

test('guardHostElementorPopup tolerates absent elementorFrontend or unknown popup id', () => {
    const formEl = {
        closest: () => ({ id: 'elementor-popup-modal-77' }),
    };

    // No elementorFrontend at all.
    assert.strictEqual(guardHostElementorPopup(formEl), false);

    // Popup id not in documents registry.
    global.window.elementorFrontend = { documentsManager: { documents: {} } };
    assert.strictEqual(guardHostElementorPopup(formEl), false);

    // Modal host element without a parseable id.
    global.window.elementorFrontend = {
        documentsManager: { documents: { 77: { getModal: () => makeModal('') } } },
    };
    assert.strictEqual(
        guardHostElementorPopup({ closest: () => ({ id: 'some-other-id' }) }),
        false
    );
});

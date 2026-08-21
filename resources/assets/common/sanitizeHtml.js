import DOMPurify from 'dompurify';

// Single sanitizer for HTML an admin authored in the form builder — confirmation
// messages, Custom HTML, section-break descriptions, terms/GDPR text — shared by
// the public form scripts and the builder previews so both agree on the policy.
//
// The server keeps `target` on <a>/<area> (wp_kses_allowed_html('post')), so the
// link dialog's "Open link in a new tab" checkbox survives PHP. DOMPurify's
// default allow-list has no `target`, which silently dropped it again on render.
// FluentForm's own default Terms field ships target="_blank", so even untouched
// forms disagreed with their own preview.
//
// `target` is re-allowed narrowly and nothing else is:
//   - only on <a> and <area>, never <form>/<base>-style navigation sinks;
//   - only the four browsing-context keywords or a plain frame name, so no
//     other `_`-prefixed value can be smuggled through;
//   - links opening a new context get rel="noopener noreferrer", severing the
//     window.opener handle (reverse tabnabbing).
// The value is never executable, so no script-injection surface is widened.
//
// This runs on its OWN DOMPurify instance. Hooks are global to an instance, and
// the shared default instance also sanitizes *submitted* entry values in the
// admin (admin/helpers/sanitizeHtml.js) — an isolated instance is what keeps
// this relaxed policy off untrusted content. It is also what prevents a repeat
// of the per-keystroke addHook() in inputTextarea.vue, which leaked target/rel
// onto unrelated previews and stripped rel="noopener" off author links.

const TARGET_KEYWORDS = ['_blank', '_self', '_parent', '_top'];
// _self, _top and _parent all navigate an existing browsing context, so no
// opener handle is created and there is nothing to sever. Only _blank and named
// targets open a new one.
const SAME_CONTEXT_TARGETS = ['_self', '_top', '_parent'];
const FRAME_NAME = /^[A-Za-z][A-Za-z0-9_.-]*$/;
const LINK_TYPE = /^[A-Za-z][A-Za-z-]*$/;
// noopener alone closes reverse tabnabbing, and it is what the WordPress link
// dialog writes. noreferrer is deliberately NOT added: it strips the Referer
// header, which would silently break referral/affiliate attribution on every
// already-saved confirmation message.
const REQUIRED_REL = ['noopener'];

// `tagName` is only trusted when it is a string: DOM clobbering
// (<form><input name="tagName">) replaces it with an Element, and calling
// toUpperCase() on that throws out of the hook, out of sanitize(), and leaves
// the message unrendered. Unknown shapes are treated as "not a link".
function isLinkElement(node) {
    const tag = node && 'string' === typeof node.tagName ? node.tagName.toUpperCase() : '';
    return 'A' === tag || 'AREA' === tag;
}

function isSafeTarget(value) {
    const target = String(value || '').trim();
    return TARGET_KEYWORDS.includes(target.toLowerCase()) || FRAME_NAME.test(target);
}

const purifier = DOMPurify(window);

purifier.addHook('uponSanitizeAttribute', (node, data) => {
    if ('target' !== data.attrName || !isLinkElement(node)) {
        return;
    }

    if (isSafeTarget(data.attrValue)) {
        data.forceKeepAttr = true;
    }
});

purifier.addHook('afterSanitizeAttributes', (node) => {
    if (!isLinkElement(node)
        || 'function' !== typeof node.getAttribute
        || 'function' !== typeof node.setAttribute
    ) {
        return;
    }

    const target = node.getAttribute('target');

    if (!target || SAME_CONTEXT_TARGETS.includes(target.trim().toLowerCase())) {
        return;
    }

    // This runs after DOMPurify has finished with the attributes, so nothing
    // re-checks what is written back. Keep only well-formed link types — author
    // tokens survive, debris from a mangled rel does not.
    const tokens = (node.getAttribute('rel') || '')
        .split(/\s+/)
        .filter((token) => LINK_TYPE.test(token));

    REQUIRED_REL.forEach((token) => {
        if (!tokens.includes(token)) {
            tokens.push(token);
        }
    });

    node.setAttribute('rel', tokens.join(' '));
});

export default function sanitizeHtml(value) {
    if (value === null || typeof value === 'undefined') {
        return '';
    }

    return purifier.sanitize(String(value));
}

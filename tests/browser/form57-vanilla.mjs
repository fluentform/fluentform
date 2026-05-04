// Browser-driven verification of the vanilla submission runtime against form 57
// in `Disable jQuery (Vanilla JS)` mode. Run with:
//
//     npm run test:browser
//
// or directly:  node tests/browser/form57-vanilla.mjs
//
// Override the URL via FF_TEST_URL=https://yoursite.test/?ff_landing=57
//
// Requires: Playwright + Chromium installed (devDep). The test site must serve
// form ID 57 with at least the fields the assertions reference (text input
// with tooltip, file input, numeric_field with min=5/max=10).

import { chromium } from "playwright";

const URL =
    process.env.FF_TEST_URL || "https://forms.test/?ff_landing=57";

const results = [];
const record = (id, status, detail) => {
    results.push({ id, status, detail });
    const tag = status === "PASS" ? "✓" : status === "FAIL" ? "✗" : "—";
    console.log(`  ${tag} ${id}: ${status}${detail ? " — " + detail : ""}`);
};

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();

const consoleErrors = [];
const proPaymentErrors = [];
const isPaymentHandlerProError = entry =>
    /payment_handler_pro\.js/.test(entry) ||
    /Cannot read properties of undefined \(reading 'settings'\)/.test(entry);
page.on("pageerror", err => {
    const text = String(err);
    if (isPaymentHandlerProError(text)) {
        proPaymentErrors.push(text);
    } else {
        consoleErrors.push(text);
    }
});
page.on("console", msg => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (isPaymentHandlerProError(text)) {
        proPaymentErrors.push(text);
    } else {
        consoleErrors.push(text);
    }
});

console.log(`\n→ Navigating to ${URL}\n`);
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

const prereqs = await page.evaluate(() => ({
    jQueryMode: window.fluentFormVars?.jQueryMode,
    bridge: typeof window.fluentFormBridge,
    cleanup: typeof window._fluentFormSubmissionCleanup,
    recaptchaCb: typeof window.fluentFormrecaptchaSuccessCallback,
    fluentFormApp: typeof window.fluentFormApp,
}));
console.log("Prerequisites:");
console.log("  jQueryMode:", prereqs.jQueryMode);
console.log("  bridge:", prereqs.bridge);
console.log("  cleanup:", prereqs.cleanup);
console.log("  recaptchaCb:", prereqs.recaptchaCb);
console.log("  fluentFormApp:", prereqs.fluentFormApp);

if (prereqs.jQueryMode !== "disabled") {
    console.log(
        `\n  ⚠ jQueryMode is "${prereqs.jQueryMode}", not "disabled". ` +
        `Tests below describe whatever path actually ran.\n`
    );
}

console.log("\n─── Smoke ──────────────────────────────────────────────────");

record(
    "S1",
    consoleErrors.length === 0 ? "PASS" : "FAIL",
    consoleErrors.length === 0
        ? "no console errors"
        : `${consoleErrors.length} error(s): ${consoleErrors[0]?.slice(0, 120)}`
);

record(
    "C-09",
    prereqs.recaptchaCb === "function" ? "PASS" : "FAIL",
    `window.fluentFormrecaptchaSuccessCallback is ${prereqs.recaptchaCb}`
);

const isInit = await page.evaluate(() =>
    document
        .querySelector("form.frm-fluent-form")
        ?.getAttribute("data-is_initialized")
);
record(
    "C-21",
    isInit === "yes" ? "PASS" : "FAIL",
    `form data-is_initialized = "${isInit}"`
);

const tooltipResult = await page.evaluate(async () => {
    const tip = document.querySelector(".ff-el-tooltip");
    if (!tip) return { found: false };
    tip.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    const pop = document.querySelector(".ff-el-pop-content");
    const text = pop?.textContent?.slice(0, 50) || "";
    tip.dispatchEvent(new MouseEvent("mouseleave", { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
    const popAfter = document.querySelector(".ff-el-pop-content");
    return {
        found: true,
        renderedOnEnter: !!pop,
        contentText: text,
        clearedOnLeave: !popAfter,
    };
});
if (!tooltipResult.found) {
    record("C-20", "SKIP", "no .ff-el-tooltip on this form");
} else {
    record(
        "C-20",
        tooltipResult.renderedOnEnter && tooltipResult.clearedOnLeave
            ? "PASS"
            : "FAIL",
        `enter→${tooltipResult.renderedOnEnter ? "shown" : "missing"} leave→${tooltipResult.clearedOnLeave ? "cleared" : "stayed"} (text: "${tooltipResult.contentText}")`
    );
}

console.log("\n─── Validation ─────────────────────────────────────────────");

const numericMinTest = await page.evaluate(() => {
    const input = document.querySelector('input[name="numeric_field"]');
    if (!input) return { found: false };
    input.value = "3";
    const form = input.closest("form");
    const app = window.fluentFormApp(form);
    let messages = null;
    try {
        app.validate();
    } catch (e) {
        if (e instanceof window.ffValidationError) messages = e.messages;
    }
    return {
        found: true,
        sawMinMessage: /minimum value/i.test(
            messages?.numeric_field?.min || ""
        ),
        messages,
    };
});
if (!numericMinTest.found) {
    record("C-08-sanity", "SKIP", "no numeric_field on form");
} else {
    record(
        "C-08-sanity",
        numericMinTest.sawMinMessage ? "PASS" : "FAIL",
        numericMinTest.sawMinMessage
            ? `correctly fired: "${numericMinTest.messages.numeric_field.min}"`
            : `expected min error, got: ${JSON.stringify(numericMinTest.messages)}`
    );
}

const numericEmptyTest = await page.evaluate(() => {
    const input = document.querySelector('input[name="numeric_field"]');
    if (!input) return { found: false };
    input.value = "";
    const form = input.closest("form");
    const app = window.fluentFormApp(form);
    let messages = null;
    try {
        app.validate();
    } catch (e) {
        if (e instanceof window.ffValidationError) messages = e.messages;
    }
    const minMsg = messages?.numeric_field?.min;
    return {
        found: true,
        falseMinError: !!(minMsg && /minimum value/i.test(minMsg)),
        messages,
    };
});
if (!numericEmptyTest.found) {
    record("C-08-fix", "SKIP", "no numeric_field");
} else {
    record(
        "C-08-fix",
        numericEmptyTest.falseMinError ? "FAIL" : "PASS",
        numericEmptyTest.falseMinError
            ? `regression — empty input wrongly fired: "${numericEmptyTest.messages.numeric_field.min}"`
            : "empty input correctly bailed"
    );
}

const enterKeyTest = await page.evaluate(async () => {
    const input = document.querySelector(
        'input.ff-el-form-control[type="text"]'
    );
    if (!input) return { found: false };
    let submitFired = false;
    input.closest("form").addEventListener(
        "submit",
        e => {
            submitFired = true;
            e.preventDefault();
        },
        { once: true }
    );
    input.focus();
    input.dispatchEvent(
        new KeyboardEvent("keydown", {
            key: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
        })
    );
    await new Promise(r => setTimeout(r, 100));
    return { found: true, submitFired };
});
if (!enterKeyTest.found) {
    record("C-10", "SKIP", "no .ff-el-form-control text input");
} else {
    record(
        "C-10",
        enterKeyTest.submitFired ? "FAIL" : "PASS",
        enterKeyTest.submitFired
            ? "Enter triggered submit (guard not preventing)"
            : "Enter prevented from submitting"
    );
}

console.log("\n─── Inline error clearing (C-14) ──────────────────────────");

const inlineClearTest = await page.evaluate(async () => {
    const form = document.querySelector("form.frm-fluent-form");
    const target = form?.querySelector('input[name="input_text"]');
    if (!target) return { found: false };
    const group = target.closest(".ff-el-group");
    group.classList.add("ff-el-is-error");
    target.setAttribute("aria-invalid", "true");
    const err = document.createElement("div");
    err.className = "error text-danger";
    err.textContent = "Required";
    group.appendChild(err);
    target.value = "abc";
    target.dispatchEvent(new Event("change", { bubbles: true }));
    await new Promise(r => setTimeout(r, 100));
    return {
        found: true,
        classRemoved: !group.classList.contains("ff-el-is-error"),
        ariaReset: target.getAttribute("aria-invalid") === "false",
        textRemoved: !group.querySelector(".error.text-danger"),
    };
});
if (!inlineClearTest.found) {
    record("C-14", "SKIP", "no input_text field");
} else {
    const all =
        inlineClearTest.classRemoved &&
        inlineClearTest.ariaReset &&
        inlineClearTest.textRemoved;
    record(
        "C-14",
        all ? "PASS" : "FAIL",
        `class:${inlineClearTest.classRemoved} aria:${inlineClearTest.ariaReset} text:${inlineClearTest.textRemoved}`
    );
}

console.log("\n─── File upload error rendering (C-16 / C-26) ─────────────");

const fileUploadTest = await page.evaluate(async () => {
    const form = document.querySelector("form.frm-fluent-form");
    const fileInput = form?.querySelector('input[type="file"]');
    if (!fileInput) return { found: false };
    const fieldName = fileInput.name;
    const message = "Test upload error renders below field";

    if (window.jQuery) {
        // Same shape Pro/file-uploader.js fires
        window.jQuery(form).trigger("show_element_error", {
            element: fieldName,
            message,
        });
    } else {
        form.dispatchEvent(
            new CustomEvent("show_element_error", {
                detail: { element: fieldName, message },
                bubbles: true,
            })
        );
    }
    await new Promise(r => setTimeout(r, 200));
    const groupEl = fileInput.closest(".ff-el-group");
    return {
        found: true,
        sawMessage: form.outerHTML.includes(message),
        groupErrorClass: !!groupEl?.classList.contains("ff-el-is-error"),
        ariaInvalid: fileInput.getAttribute("aria-invalid"),
        errorDivText: groupEl?.querySelector(".error.text-danger")
            ?.textContent,
    };
});
if (!fileUploadTest.found) {
    record("C-16/C-26", "SKIP", "no file input on form");
} else {
    const ok =
        fileUploadTest.sawMessage &&
        fileUploadTest.groupErrorClass &&
        fileUploadTest.ariaInvalid === "true";
    record(
        "C-16/C-26",
        ok ? "PASS" : "FAIL",
        `rendered:${fileUploadTest.sawMessage} group-class:${fileUploadTest.groupErrorClass} aria-invalid:${fileUploadTest.ariaInvalid}`
    );
}

console.log("\n─── Reset (C-12 / C-13) ────────────────────────────────────");

const resetTest = await page.evaluate(async () => {
    const form = document.querySelector("form.frm-fluent-form");
    const text = form?.querySelector('input[name="input_text"]');
    if (!text) return { found: false };
    text.value = "should-clear-on-reset";
    form.reset();
    await new Promise(r => setTimeout(r, 200));
    return {
        found: true,
        textCleared: text.value !== "should-clear-on-reset",
    };
});
record(
    "C-13-native-reset",
    resetTest.textCleared ? "PASS" : "FAIL",
    `text value cleared: ${resetTest.textCleared}`
);

console.log("\n─── Payment-handler contract ──────────────────────────────");
// These tests don't require a payment field on the form — they verify the App
// instance API surface that `Pro/payment_handler.js` and `payment_handler_pro.js`
// depend on:
//   - addFieldValidationRule / removeFieldValidationRule (force_failed for stock-out)
//   - addGlobalValidator (Stripe-style pre-submit validators that mutate the
//     submission payload)
//   - fluentform_init_single payload shape (the event Payment_handler subscribes
//     to in payment_handler.js:902 — `(event, instance)` where instance is the app)
//   - ff_reinit re-init flow (payment_handler.js:907 listens to it for AJAX
//     forms re-rendered after an action)

// PAY-1: addFieldValidationRule + force_failed (stock-out simulation)
const forceFailedTest = await page.evaluate(() => {
    const form = document.querySelector("form.frm-fluent-form");
    const target = form?.querySelector('input[name="input_text"]');
    if (!target) return { found: false };
    const app = window.fluentFormApp(form);
    target.value = "anything";
    app.addFieldValidationRule("input_text", "force_failed", {
        value: true,
        message: "Out of stock",
    });
    let messages = null;
    try {
        app.validate();
    } catch (e) {
        if (e instanceof window.ffValidationError) messages = e.messages;
    }
    // Cleanup so PAY-2 doesn't see leftover state
    app.removeFieldValidationRule("input_text", "force_failed");
    return {
        found: true,
        messages,
        gotForceFailedError:
            messages?.input_text?.force_failed === "Out of stock",
    };
});
if (!forceFailedTest.found) {
    record("PAY-1 force_failed-add", "SKIP", "no input_text field");
} else {
    record(
        "PAY-1 force_failed-add",
        forceFailedTest.gotForceFailedError ? "PASS" : "FAIL",
        forceFailedTest.gotForceFailedError
            ? `force_failed rule fired with "Out of stock"`
            : `expected force_failed error, got: ${JSON.stringify(forceFailedTest.messages)}`
    );
}

// PAY-2: removeFieldValidationRule clears the rule
const removeRuleTest = await page.evaluate(() => {
    const form = document.querySelector("form.frm-fluent-form");
    const target = form?.querySelector('input[name="input_text"]');
    if (!target) return { found: false };
    const app = window.fluentFormApp(form);
    target.value = "anything";
    app.addFieldValidationRule("input_text", "force_failed", {
        value: true,
        message: "Should not see",
    });
    app.removeFieldValidationRule("input_text", "force_failed");
    let messages = null;
    try {
        app.validate();
    } catch (e) {
        if (e instanceof window.ffValidationError) messages = e.messages;
    }
    return {
        found: true,
        messages,
        forceFailedAbsent: !messages?.input_text?.force_failed,
    };
});
if (!removeRuleTest.found) {
    record("PAY-2 remove-rule", "SKIP", "no input_text field");
} else {
    record(
        "PAY-2 remove-rule",
        removeRuleTest.forceFailedAbsent ? "PASS" : "FAIL",
        removeRuleTest.forceFailedAbsent
            ? "rule removed cleanly"
            : `force_failed still firing: ${JSON.stringify(removeRuleTest.messages)}`
    );
}

// PAY-3: addGlobalValidator runs in the pre-submit pipeline and can mutate the payload
// (this is the Stripe-token-append pattern at payment_handler.js:751)
const globalValidatorTest = await page.evaluate(async () => {
    const form = document.querySelector("form.frm-fluent-form");
    const app = window.fluentFormApp(form);

    let validatorRan = false;
    let receivedFormEl = null;
    let mutatedBody = null;

    app.addGlobalValidator("paymentHarnessTest", function (theForm, formData) {
        validatorRan = true;
        receivedFormEl = theForm;
        // Match the Stripe token-append pattern
        const extra = new URLSearchParams({
            "payment-harness-token": "TOKEN-123",
        }).toString();
        formData.data = formData.data
            ? formData.data + "&" + extra
            : extra;
    });

    // Fill the form so client-side validation passes
    form.querySelectorAll("input.ff-el-form-control").forEach(input => {
        if (input.type === "text") input.value = "ok";
        if (input.type === "email") input.value = "ok@example.com";
    });
    const numeric = form.querySelector('input[name="numeric_field"]');
    if (numeric) numeric.value = "7";

    // Mock fetch so we don't hit the real backend
    const origFetch = window.fetch;
    window.fetch = async function (url, opts) {
        mutatedBody = opts?.body || "";
        return new Response(
            JSON.stringify({
                data: { result: { message: "ok" } },
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            }
        );
    };

    try {
        await app.submissionAjaxHandler();
    } finally {
        window.fetch = origFetch;
        // Cleanup — wipe the global validator so it doesn't leak
        app.addGlobalValidator("paymentHarnessTest", undefined);
    }

    // The body is double-URL-encoded: payload = {data: 'k1=v1&k2=v2', action: ...},
    // then URLSearchParams encodes that for the request body, so `=` becomes `%3D`
    // and `&` becomes `%26` inside the `data` value. Look for the token substring
    // (which has no special chars).
    return {
        validatorRan,
        receivedFormElIsForm: receivedFormEl === form,
        bodyContainsToken:
            !!mutatedBody && mutatedBody.includes("TOKEN-123"),
    };
});
record(
    "PAY-3 addGlobalValidator",
    globalValidatorTest.validatorRan &&
        globalValidatorTest.receivedFormElIsForm &&
        globalValidatorTest.bodyContainsToken
        ? "PASS"
        : "FAIL",
    `ran:${globalValidatorTest.validatorRan} formEl:${globalValidatorTest.receivedFormElIsForm} bodyHasToken:${globalValidatorTest.bodyContainsToken}`
);

// PAY-4: fluentform_init_single payload shape — what Payment_handler subscribes to.
// With the targeted CustomEvent skip in place (bridge fires only $.trigger when
// jQuery is on the page), this listener should fire exactly once with a proper
// `instance`. The `ghostCalls` counter remains as a regression guard: any
// non-zero count signals the dual-fire has come back.
const initSinglePayloadTest = await page.evaluate(async () => {
    const form = document.querySelector("form.frm-fluent-form");
    if (!window.jQuery) return { skipped: "no jquery on page" };

    let received = null;
    let totalCalls = 0;
    let ghostCalls = 0;
    window.jQuery(form).on(
        "fluentform_init_single.payHarness",
        function (event, instance) {
            totalCalls++;
            if (!instance) {
                ghostCalls++;
                return; // ghost call from CustomEvent dispatch — skip
            }
            received = instance;
        }
    );

    // Real-world callers (Elementor, Pro reinit) use jQuery $.trigger to fire
    // ff_reinit. Mirror that here — native CustomEvent dispatch does NOT cross
    // into jQuery `.on()` handlers in the host's jQuery 3.x setup.
    // Wrap as [form] — HTMLFormElement is array-like, so unwrapped form gets
    // iterated by jQuery.makeArray. Component.php:1210 uses [ffForm] for the
    // same reason.
    window.jQuery(document).trigger("ff_reinit", [form]);
    await new Promise(r => setTimeout(r, 200));

    window.jQuery(form).off("fluentform_init_single.payHarness");

    if (!received) {
        return {
            received: null,
            totalCalls,
            ghostCalls,
            instanceShape: null,
        };
    }
    return {
        received: !!received,
        totalCalls,
        ghostCalls,
        instanceShape: {
            hasAddFieldValidationRule:
                typeof received.addFieldValidationRule === "function",
            hasRemoveFieldValidationRule:
                typeof received.removeFieldValidationRule === "function",
            hasAddGlobalValidator:
                typeof received.addGlobalValidator === "function",
            hasSendData: typeof received.sendData === "function",
            hasInitFormHandlers:
                typeof received.initFormHandlers === "function",
            hasInitTriggers: typeof received.initTriggers === "function",
        },
    };
});
if (initSinglePayloadTest.skipped) {
    record("PAY-4 init_single-payload", "SKIP", initSinglePayloadTest.skipped);
} else if (!initSinglePayloadTest.received) {
    record(
        "PAY-4 init_single-payload",
        "FAIL",
        `no instance received after ff_reinit (totalCalls=${initSinglePayloadTest.totalCalls} ghostCalls=${initSinglePayloadTest.ghostCalls})`
    );
} else {
    const shape = initSinglePayloadTest.instanceShape;
    const allPresent = Object.values(shape).every(Boolean);
    record(
        "PAY-4 init_single-payload",
        allPresent ? "PASS" : "FAIL",
        `instance.${Object.keys(shape).filter(k => shape[k]).length}/${Object.keys(shape).length} app methods present (calls: ${initSinglePayloadTest.totalCalls}, ghosts: ${initSinglePayloadTest.ghostCalls})`
    );
}

// PAY-PRO-GUARD: surface whether Pro's payment_handler_pro.js needs the same
// ghost-call defense the free payment_handler.js carries. This is OUT of this
// repo's scope (Pro source lives elsewhere) — but the test catches the symptom
// so we know when the Pro team has shipped the patch.
if (proPaymentErrors.length === 0) {
    record(
        "PAY-PRO-GUARD",
        "PASS",
        "no payment_handler_pro.js ghost-call crashes observed"
    );
} else {
    record(
        "PAY-PRO-GUARD",
        "FAIL",
        `Pro file needs ghost-call guard: ${proPaymentErrors[0].slice(0, 160)}`
    );
}

console.log("\n─── Result summary ─────────────────────────────────────────");
const summary = {
    pass: results.filter(r => r.status === "PASS").length,
    fail: results.filter(r => r.status === "FAIL").length,
    skip: results.filter(r => r.status === "SKIP").length,
};
console.log(
    `  PASS: ${summary.pass}   FAIL: ${summary.fail}   SKIP: ${summary.skip}`
);

await browser.close();

if (summary.fail > 0) process.exit(1);

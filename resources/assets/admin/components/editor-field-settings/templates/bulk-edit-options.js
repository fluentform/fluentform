/**
 * Bulk Edit serialisation for the editor's Advanced Options list.
 *
 * The textarea can only express `label : value`, so rebuilding the option list
 * from it destroys every other key the option carries — `global_inventory` and
 * `quantity` for the Pro Inventory feature, plus `calc_value`, `image` and
 * `disabled`. applyBulkEdit() instead re-attaches each surviving option's whole
 * record, matching on value.
 *
 * It does NOT rescue an option whose parsed value comes back empty (a label with
 * a blank value serialises to "A : " and parses to nothing). That is carried over
 * from the original and left alone deliberately; the no-op guarantee below is
 * about metadata, not about resurrecting unparseable lines.
 *
 * Value is the option's identity: a rewritten value starts a fresh, unmapped
 * option rather than carrying an inventory item onto something the user
 * redefined. KNOWN LIMIT: `values_visible` defaults to false and updateValue()
 * mirrors the label into the value, so real options have label === value and
 * serialise to a label-only line — editing it changes the value too, and the
 * mapping goes. Accepted, and pinned by a test so the suite cannot certify a
 * guarantee the product does not keep.
 *
 * CommonJS on purpose: webpack consumes it from the .vue component and
 * `node --test dev/tests/js/*.test.js` consumes it directly.
 */

// Mirrors createOption(). `quantity`/`global_inventory` are deliberately absent:
// seeding a Pro-only key onto every option of every free install would be worse
// than leaving a new option unmapped.
const NEW_OPTION_DEFAULTS = {
    calc_value: '',
    image: '',
};

function toList(value) {
    return Array.isArray(value) ? value : [];
}

function toText(value) {
    if (value === null || typeof value === 'undefined') {
        return '';
    }

    return String(value);
}

// An option may hold 10 while the textarea returns '10', and stored values can
// carry whitespace the textarea has already trimmed off.
function matchKey(value) {
    const key = toText(value).trim();

    return key === '' ? null : key;
}

function isGroup(option) {
    return !!option && typeof option === 'object' && option.type === 'group';
}

// Carries a code rather than user copy: this module has no $t(), so the
// component maps the code to a translated message.
function assertFlat(existingOptions) {
    if (toList(existingOptions).some(isGroup)) {
        const error = new Error('Bulk Edit cannot be applied to grouped options.');
        error.code = 'grouped_options';

        throw error;
    }
}

function serializeOptions(options) {
    let astext = '';

    toList(options).forEach(item => {
        if (!item) {
            return;
        }

        const rawLabel = toText(item.label);
        const rawValue = toText(item.value);
        const label = rawLabel.includes(':') ? rawLabel.replace(/:/g, '\\:') : rawLabel;
        const value = rawValue.includes(':') ? rawValue.replace(/:/g, '\\:') : rawValue;

        astext += label;
        // Coerced, not raw: a numeric 0 label is falsy and would drop the
        // ` : value` half, silently rewriting the value on the next parse.
        if (rawLabel !== '' && rawLabel !== rawValue) {
            astext += ' : ' + value;
        }
        astext += String.fromCharCode(13, 10);
    });

    return astext;
}

function parseBulkEditLines(text) {
    const lines = toText(text).split('\n');
    const parsed = [];

    lines.forEach(line => {
        const lineItem = line.split(/(?<!\\):/);

        let label = lineItem[0];
        if (label) {
            label = label.replace(/\\:/g, ':').trim();
        }

        let value = lineItem[1];
        if (value) {
            value = value.replace(/\\:/g, ':').trim();
        } else {
            value = label;
        }

        if (label && value) {
            parsed.push({ label, value });
        }
    });

    return parsed;
}

function buildValueBuckets(existingOptions) {
    const buckets = new Map();

    toList(existingOptions).forEach(option => {
        if (!option || typeof option !== 'object') {
            return;
        }

        const bucketKey = matchKey(option.value);
        if (bucketKey === null) {
            return;
        }

        if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, []);
        }
        buckets.get(bucketKey).push(option);
    });

    return buckets;
}

function claim(buckets, key, claimed) {
    const bucketKey = matchKey(key);
    if (bucketKey === null) {
        return null;
    }

    const bucket = buckets.get(bucketKey);
    if (!bucket) {
        return null;
    }

    while (bucket.length) {
        const candidate = bucket.shift();
        // shift() consumes each entry once; `claimed` additionally covers a list
        // holding the SAME object twice, which would give two lines one id.
        if (!claimed.has(candidate)) {
            claimed.add(candidate);

            return candidate;
        }
    }

    return null;
}

function buildOption(parsedItem, source, nextOptionId) {
    if (!source) {
        return Object.assign({
            id: nextOptionId(),
            label: parsedItem.label,
            value: parsedItem.value,
        }, NEW_OPTION_DEFAULTS);
    }

    const option = Object.assign({}, source, {
        label: parsedItem.label,
        value: parsedItem.value,
    });

    if (!option.id) {
        option.id = nextOptionId();
    }
    Object.keys(NEW_OPTION_DEFAULTS).forEach(key => {
        if (typeof option[key] === 'undefined') {
            option[key] = NEW_OPTION_DEFAULTS[key];
        }
    });

    return option;
}

/**
 * `nextOptionId` is injected because the counter is module state in
 * advanced-options.vue — seeded from Date.now() and shared by every field. A
 * second counter here would hand out ids that collide with it. `replaceAll` is
 * for presets: clicking one replaces the list, so an entry that merely collides
 * by name (Georgia is in both Countries and U.S. States) must not inherit a
 * stock item.
 * Grouped options throw: they have no `value`, so matching would silently
 * flatten them away. The Bulk Edit button is already hidden for them, but a UI
 * invariant should not be the only thing standing between a group and data loss.
 */
function applyBulkEdit(text, existingOptions, nextOptionId, opts) {
    assertFlat(existingOptions);

    const parsed = parseBulkEditLines(text);
    const replaceAll = !!(opts && opts.replaceAll);
    const byValue = buildValueBuckets(replaceAll ? [] : existingOptions);
    const claimed = new Set();

    return parsed.map(item => buildOption(item, claim(byValue, item.value, claimed), nextOptionId));
}

module.exports = {
    serializeOptions,
    parseBulkEditLines,
    applyBulkEdit,
};

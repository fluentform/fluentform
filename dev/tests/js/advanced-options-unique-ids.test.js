// Regression: editor Advanced Options — "Duplicate keys detected: '1'" on add,
// and drag-reorder copying instead of moving.
//
// Root cause: advanced-options.vue keyed the option list with
// :key="option.id || index" while mounted() backfilled item.id = i
// (index 0 => id 0, falsy) and createOption() produced id-less options.
// A new option's index-fallback key collides with a legacy option whose
// backfilled id equals that index. Broken keys also poison vddl's
// move protocol (drop-insert clone + remove source by re-rendered index),
// which surfaces as drag-copies.
//
// Fix (mirrored from advanced-options.vue): every option/group gets a
// unique truthy id at creation, and ensureUniqueIds() repairs legacy
// falsy/duplicate ids at mount. Keys become strictly option.id.

const { test } = require('node:test');
const assert = require('node:assert');

let optionUid = 1749100000000; // Date.now() seed in the component
const nextOptionId = () => ++optionUid;

// Mirrors advanced-options.vue ensureUniqueIds() (component uses this.$set).
// Ids compare as strings — Vue's keyed diff stringifies keys, so 1 and '1'
// collide there and must be treated as duplicates here too.
function ensureUniqueIds(options, seen = new Set()) {
    (options || []).forEach(item => {
        if (!item) {
            return;
        }
        if (!item.id || seen.has(String(item.id))) {
            item.id = nextOptionId();
        }
        seen.add(String(item.id));
        if (item.type === 'group' && Array.isArray(item.options)) {
            ensureUniqueIds(item.options, seen);
        }
    });
}

const legacyMountBackfill = (options) => {
    // What the buggy mounted() produced: item.id = i (index 0 => falsy 0)
    options.forEach((item, i) => {
        if (!item.id) {
            item.id = i;
        }
    });
    return options;
};

test('bug doc: option.id || index keys collide when an id-less option is inserted', () => {
    const options = legacyMountBackfill([
        { label: 'Option 1', value: 'Option 1' },
        { label: 'Option 2', value: 'Option 2' },
        { label: 'Option 3', value: 'Option 3' },
    ]);

    // increase(0): createOption() inserted at index 1 with no id
    options.splice(1, 0, { label: 'Option 4', value: 'Option 4' });

    const keys = options.map((option, index) => option.id || index);
    const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i);

    // new option at index 1 keys as 1; legacy option with id=1 (now index 2) also keys as 1
    assert.deepStrictEqual(duplicates, [1]);
});

test('ensureUniqueIds assigns unique truthy ids to id-less options', () => {
    const options = [
        { label: 'Option 1', value: 'Option 1' },
        { label: 'Option 2', value: 'Option 2' },
    ];

    ensureUniqueIds(options);

    const ids = options.map(o => o.id);
    assert.ok(ids.every(Boolean));
    assert.strictEqual(new Set(ids).size, ids.length);
});

test('ensureUniqueIds repairs legacy falsy and duplicated ids', () => {
    const options = [
        { id: 0, label: 'Option 1', value: 'Option 1' },  // falsy legacy id
        { id: 1, label: 'Option 2', value: 'Option 2' },
        { id: 1, label: 'Option 3', value: 'Option 3' },  // duplicate legacy id
        { id: 99, label: 'Option 4', value: 'Option 4' }, // valid id, must be kept
    ];

    ensureUniqueIds(options);

    const ids = options.map(o => o.id);
    assert.ok(ids.every(Boolean));
    assert.strictEqual(new Set(ids).size, ids.length);
    assert.strictEqual(options[3].id, 99);
    assert.strictEqual(options[1].id, 1); // first holder keeps its id
});

test('ensureUniqueIds treats numeric and string ids as the same key (Vue stringifies keys)', () => {
    const options = [
        { id: 7, label: 'Option 1', value: 'Option 1' },
        { id: '7', label: 'Option 2', value: 'Option 2' },
    ];

    ensureUniqueIds(options);

    assert.notStrictEqual(String(options[0].id), String(options[1].id));
});

test('ensureUniqueIds walks nested group options and keeps ids unique across the tree', () => {
    const options = [
        {
            type: 'group',
            label: 'Group 1',
            options: [
                { label: 'Option 1', value: 'Option 1' },
                { id: 5, label: 'Option 2', value: 'Option 2' },
            ],
        },
        {
            type: 'group',
            label: 'Group 2',
            options: [
                { id: 5, label: 'Option 3', value: 'Option 3' }, // dup across groups
            ],
        },
    ];

    ensureUniqueIds(options);

    const flat = [];
    const walk = list => list.forEach(item => {
        flat.push(item.id);
        if (item.options) {
            walk(item.options);
        }
    });
    walk(options);

    assert.ok(flat.every(Boolean));
    assert.strictEqual(new Set(flat).size, flat.length);
});

test('after normalization, strict option.id keys are collision-free even after inserts', () => {
    const options = legacyMountBackfill([
        { label: 'Option 1', value: 'Option 1' },
        { label: 'Option 2', value: 'Option 2' },
        { label: 'Option 3', value: 'Option 3' },
    ]);

    ensureUniqueIds(options);

    // fixed createOption() includes an id at creation
    options.splice(1, 0, { id: nextOptionId(), label: 'Option 4', value: 'Option 4' });

    const keys = options.map(option => option.id);
    assert.strictEqual(new Set(keys).size, keys.length);
});

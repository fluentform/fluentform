/**
 * Standalone regression test for Quiz Module question scores never persisting.
 *
 * Why standalone: the fix lives inline in QuizSettings.vue (getSettings
 * response handler), which node --test cannot import. Same convention as
 * dev/tests/test_pretty_url_bool_cast.php — prove the bug, then prove the
 * fix expression.
 *
 * Bug: QuizController::getSettings() returns saved_quiz_fields as an empty
 * PHP array, which serializes as JSON [] (array, not object). QuizSettings.vue
 * getInput() then $set()s field-name string keys onto that JS Array. The UI
 * renders fine, but JSON.stringify() drops string-keyed properties of Arrays,
 * so the save payload always carries "saved_quiz_fields": [] and every
 * question config is lost on reload.
 *
 * Fix (QuizSettings.vue getSettings handler):
 *   if (Array.isArray(settings.saved_quiz_fields)) {
 *       settings.saved_quiz_fields = Object.assign({}, settings.saved_quiz_fields);
 *   }
 *
 * Run: node --test dev/tests/js/
 */

const { test } = require('node:test');
const assert = require('node:assert');

// Mirrors the fix in resources/assets/admin/components/settings/QuizSettings.vue
function normalizeSavedQuizFields(savedQuizFields) {
    if (Array.isArray(savedQuizFields)) {
        return Object.assign({}, savedQuizFields);
    }
    return savedQuizFields;
}

test('documents the bug: JSON.stringify drops string-keyed props on Arrays', () => {
    const poisoned = [];
    poisoned['input_radio'] = { enabled: true, points: 5 };
    assert.strictEqual(JSON.stringify(poisoned), '[]');
});

test('normalizes the PHP-empty-array payload ([]) to a plain object', () => {
    const normalized = normalizeSavedQuizFields([]);
    assert.strictEqual(Array.isArray(normalized), false);
    assert.deepStrictEqual(normalized, {});
    assert.strictEqual(JSON.stringify({ saved_quiz_fields: normalized }), '{"saved_quiz_fields":{}}');
});

test('salvages string-keyed props from a poisoned Array so they survive stringify', () => {
    const poisoned = [];
    poisoned['input_radio'] = { enabled: true, points: 5 };
    poisoned['input_radio_1'] = { enabled: true, points: 3 };

    const normalized = normalizeSavedQuizFields(poisoned);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(normalized)), {
        input_radio: { enabled: true, points: 5 },
        input_radio_1: { enabled: true, points: 3 }
    });
});

test('keeps an already-correct plain object untouched', () => {
    const settings = { input_radio: { enabled: true, points: 5 } };
    assert.strictEqual(normalizeSavedQuizFields(settings), settings);
});

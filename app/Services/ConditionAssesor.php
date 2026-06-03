<?php

namespace FluentForm\App\Services;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Helpers\Str;
use FluentForm\App\Services\FormBuilder\EditorShortcodeParser;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;

class ConditionAssesor
{
    public static function evaluate(&$field, &$inputs, $form = null, $treatMissingAsEmpty = true)
    {
        $status = Arr::get($field, 'conditionals.status');
        if (!$status) {
            return true;
        }

        $type = Arr::get($field, 'conditionals.type', 'any');

        // Handle group conditions
        if ($type === 'group' && $conditionGroups = Arr::get($field, 'conditionals.condition_groups')) {
            return self::evaluateGroupConditions($conditionGroups, $inputs, $form, $treatMissingAsEmpty);
        }

        // Handle 'any', 'all' conditions
        if ($type !== 'group' && $conditions = Arr::get($field, 'conditionals.conditions')) {
            return self::evaluateConditions($conditions, $inputs, $type, $form, $treatMissingAsEmpty);
        }
        return true;
    }

    /**
     * Cascade-aware field visibility, mirroring the client evaluator
     * (Pro/_ConditionClass.js): a field is visible only when its own condition
     * matches AND every conditional controller it references is itself visible.
     * A hidden controller hides its dependents; a visible-but-empty controller
     * keeps them. Used by the validation path; assess() is left untouched.
     */
    public static function isConditionallyVisible($fieldName, $allConditionals, &$inputs, $form = null, $visited = [])
    {
        $conditionals = Arr::get($allConditionals, $fieldName);

        if (!$conditionals || !Arr::get($conditionals, 'status')) {
            return true;
        }

        if (in_array($fieldName, $visited, true)) {
            return false;
        }
        $visited[] = $fieldName;

        $type = Arr::get($conditionals, 'type', 'any');

        if ($type === 'group') {
            foreach (Arr::get($conditionals, 'condition_groups', []) as $group) {
                $rules = Arr::get($group, 'rules', []);
                if ($rules && self::assessRulesWithCascade($rules, 'all', $allConditionals, $inputs, $form, $visited)) {
                    return true;
                }
            }
            return false;
        }

        $conditions = Arr::get($conditionals, 'conditions', []);
        if (!$conditions) {
            return true;
        }

        return self::assessRulesWithCascade($conditions, $type, $allConditionals, $inputs, $form, $visited);
    }

    private static function assessRulesWithCascade($conditions, $type, $allConditionals, &$inputs, $form, $visited)
    {
        foreach ($conditions as $condition) {
            if (!Arr::get($condition, 'field') || !Arr::get($condition, 'operator')) {
                continue;
            }

            // Treat a missing controller as empty so a visible-but-untouched
            // control still matches "!= value".
            $met = static::assess($condition, $inputs, $form, true);

            // A matched condition only counts if its controller is itself visible.
            if ($met) {
                $controller = Arr::get($condition, 'field');
                if (isset($allConditionals[$controller])) {
                    $met = self::isConditionallyVisible($controller, $allConditionals, $inputs, $form, $visited);
                }
            }

            if ($type === 'any') {
                if ($met) {
                    return true;
                }
            } elseif (!$met) {
                return false;
            }
        }

        return $type !== 'any';
    }

    private static function evaluateGroupConditions($conditionGroups, &$inputs, $form = null, $treatMissingAsEmpty = true)
    {
        $hasGroupConditionsMet = true;
        foreach ($conditionGroups as $group) {
            if ($conditions = Arr::get($group, 'rules')) {
                $hasGroupConditionsMet = self::evaluateConditions($conditions, $inputs, 'all', $form, $treatMissingAsEmpty);
                if ($hasGroupConditionsMet) {
                    return true;
                }
            }
        }
        return $hasGroupConditionsMet;
    }

    private static function evaluateConditions($conditions, &$inputs, $type, $form = null, $treatMissingAsEmpty = true)
    {
        $hasConditionMet = true;

        foreach ($conditions as $condition) {
            if (!Arr::get($condition, 'field') || !Arr::get($condition, 'operator')) {
                continue;
            }

            $hasConditionMet = static::assess($condition, $inputs, $form, $treatMissingAsEmpty);

            if ($hasConditionMet && $type == 'any') {
                return true;
            }

            if ($type === 'all' && !$hasConditionMet) {
                return false;
            }
        }

        return $hasConditionMet;
    }

    // Default treats a missing field as an empty string so admin-configured
    // gating ("send email if X != ''") and [ff_if] templates check intent
    // naturally. Form field visibility (Parser/Extractor) and server-side
    // validation (AdvancedFormValidation) pass false to keep JS parity.
    public static function assess(&$conditional, &$inputs, $form = null, $treatMissingAsEmpty = true)
    {
        if ($conditional['field']) {
            $accessor = rtrim(str_replace(['[', ']', '*'], ['.'], $conditional['field']), '.');

            $isMissing = !Arr::has($inputs, $accessor);

            if ($isMissing && !$treatMissingAsEmpty) {
                // JS parity: missing field is "not equal" to any value.
                if ($conditional['operator'] === '!=') {
                    return true;
                }
                return false;
            }

            $inputValue = $isMissing ? '' : Arr::get($inputs, $accessor);

            if ($numericFormatter = Arr::get($conditional, 'numeric_formatter')) {
                $inputValue = Helper::getNumericValue($inputValue, $numericFormatter);
            }
            $conditionValue = Arr::get($conditional, 'value');
            $isArrayAcceptable = in_array($conditional['operator'], ['=', '!=']);
            if (!empty($conditionValue) && is_string($conditionValue)) {
                $conditionValue = self::processSmartCodesInValue($conditionValue, $inputs, $form, $isArrayAcceptable);
            }

            $conditionValue = is_null($conditionValue) ? '' : $conditionValue;
            
            switch ($conditional['operator']) {
                case '=':
                    if (is_array($inputValue) && is_array($conditionValue)) {
                        $flatInput = Arr::flatten($inputValue);
                        $flatCondition = Arr::flatten($conditionValue);
                        sort($flatInput);
                        sort($flatCondition);
                        return $flatInput == $flatCondition;
                    }
                    
                    if (is_array($conditionValue)) {
                        return in_array($inputValue, Arr::flatten($conditionValue));
                    }
                    if (is_array($inputValue)) {
                        return in_array($conditionValue, Arr::flatten($inputValue));
                    }
                    return $inputValue == $conditionValue;
                case '!=':
                    if (is_array($inputValue) && is_array($conditionValue)) {
                        return count(array_intersect(Arr::flatten($inputValue), Arr::flatten($conditionValue))) == 0;
                    }
                    if (is_array($conditionValue)) {
                        return !in_array($inputValue, Arr::flatten($conditionValue));
                    }
                    if (is_array($inputValue)) {
                        return !in_array($conditionValue, Arr::flatten($inputValue));
                    }
                    return $inputValue != $conditionValue;
                case '>':
                    return $inputValue > $conditionValue;
                case '<':
                    return $inputValue < $conditionValue;
                case '>=':
                    return $inputValue >= $conditionValue;
                case '<=':
                    return $inputValue <= $conditionValue;
                case 'startsWith':
                    return Str::startsWith($inputValue, $conditionValue);
                case 'endsWith':
                    return Str::endsWith($inputValue, $conditionValue);
                case 'contains':
                    return Str::contains($inputValue, $conditionValue);
                case 'doNotContains':
                    return !Str::contains($inputValue, $conditionValue);
                case 'length_equal':
                    if (is_array($inputValue)) {
                        return count($inputValue) == $conditionValue;
                    }
                    $inputValue = (string)$inputValue;
                    return strlen($inputValue) == $conditionValue;
                case 'length_less_than':
                    if (is_array($inputValue)) {
                        return count($inputValue) < $conditionValue;
                    }
                    $inputValue = (string)$inputValue;
                    return strlen($inputValue) < $conditionValue;
                case 'length_greater_than':
                    if (is_array($inputValue)) {
                        return count($inputValue) > $conditionValue;
                    }
                    $inputValue = (string)$inputValue;
                    return strlen($inputValue) > $conditionValue;
                case 'test_regex':
                    if (is_array($inputValue)) {
                        $inputValue = implode(' ', $inputValue);
                    }
                    $pattern = '/' . $conditionValue . '/';
                    $result = @preg_match($pattern, $inputValue);
                    if ($result === false) {
                        // Invalid regex pattern, handle gracefully
                        return false;
                    }
                    return (bool) $result;
            }
        }

        return false;
    }

    private static function processSmartCodesInValue($value, &$inputs, $form = null, $isArrayAcceptable = true)
    {
        if (strpos($value, '{') === false) {
            return $value;
        }

        if (preg_match('/^{inputs\.([^}]+)}$/', $value, $inputMatches)) {
            $fieldName = $inputMatches[1];
            $fieldKey = str_replace(['[', ']'], ['.', ''], $fieldName);
            
            $resolvedValue = Arr::get($inputs, $fieldKey);
            
            if ($resolvedValue === null && $fieldKey !== $fieldName) {
                $resolvedValue = Arr::get($inputs, $fieldName);
            }

            // Return array if it's an array
            if (is_array($resolvedValue) && $isArrayAcceptable) {
                return $resolvedValue;
            }
        }

        try {
            $processedValue = preg_replace_callback('/{+(.*?)}/', function ($matches) use ($inputs, $form) {
                $smartCode = $matches[1];

                if (false !== strpos($smartCode, 'inputs.')) {
                    $fieldName = substr($smartCode, strlen('inputs.'));
                    
                    $fieldKey = str_replace(['[', ']'], ['.', ''], $fieldName);
                    
                    $value = Arr::get($inputs, $fieldKey, '');
                    
                    if ($value === '' && $fieldKey !== $fieldName) {
                        $value = Arr::get($inputs, $fieldName, '');
                    }
                    
                    if (is_array($value)) {
                        $value = fluentImplodeRecursive(', ', $value);
                    }
                    
                    return $value !== null && $value !== '' ? $value : '';
                }

                // @todo Support general shortcodes in future

                // Always return the original value if we don't have a match
                return $matches[0];
            }, $value);

            return $processedValue;
        } catch (\Exception $e) {
            return $value;
        }
    }
}

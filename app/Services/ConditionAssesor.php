<?php

namespace FluentForm\App\Services;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Helpers\Str;
use FluentForm\App\Services\FormBuilder\EditorShortcodeParser;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;

class ConditionAssesor
{
    public static function evaluate(&$field, &$inputs, $form = null)
    {
        $status = Arr::get($field, 'conditionals.status');
        if (!$status) {
            return true;
        }

        $type = Arr::get($field, 'conditionals.type', 'any');

        // Handle group conditions
        if ($type === 'group' && $conditionGroups = Arr::get($field, 'conditionals.condition_groups')) {
            return self::evaluateGroupConditions($conditionGroups, $inputs, $form);
        }

        // Handle 'any', 'all' conditions
        if ($type !== 'group' && $conditions = Arr::get($field, 'conditionals.conditions')) {
            return self::evaluateConditions($conditions, $inputs, $type, $form);
        }
        return true;
    }

    private static function evaluateGroupConditions($conditionGroups, &$inputs, $form = null)
    {
        $hasGroupConditionsMet = true;
        foreach ($conditionGroups as $group) {
            if ($conditions = Arr::get($group, 'rules')) {
                $hasGroupConditionsMet = self::evaluateConditions($conditions, $inputs, 'all', $form);
                if ($hasGroupConditionsMet) {
                    return true;
                }
            }
        }
        return $hasGroupConditionsMet;
    }

    private static function evaluateConditions($conditions, &$inputs, $type, $form = null)
    {
        $hasConditionMet = true;

        foreach ($conditions as $condition) {
            if (!Arr::get($condition, 'field') || !Arr::get($condition, 'operator')) {
                continue;
            }

            $hasConditionMet = static::assess($condition, $inputs, $form);

            if ($hasConditionMet && $type == 'any') {
                return true;
            }

            if ($type === 'all' && !$hasConditionMet) {
                return false;
            }
        }

        return $hasConditionMet;
    }

    public static function assess(&$conditional, &$inputs, $form = null)
    {
        if (empty($conditional['field'])) {
            return false;
        }

        $accessor = rtrim(str_replace(['[', ']', '*'], ['.'], $conditional['field']), '.');

        if (!Arr::has($inputs, $accessor)) {
            return false;
        }

        $inputValue = Arr::get($inputs, $accessor);

        // Numeric formatting
        if ($numericFormatter = Arr::get($conditional, 'numeric_formatter')) {
            $inputValue = Helper::getNumericValue($inputValue, $numericFormatter);
        }

        // Smart Codes
        $processedValue = $conditional['value'] ?? null;
        if (isset($processedValue) && (is_string($processedValue) || is_array($processedValue))) {
            if (is_string($processedValue)) {
                $processedValue = trim($processedValue);
            }
            $processedValue = self::processSmartCodesInValue($processedValue, $inputs, $form);
        }

        $operator = $conditional['operator'];
        $conditionValue = $processedValue;

        // Normalize values for array comparisons
        $normalize = function ($val) {
            if (is_array($val)) {
                $arr = array_values($val);
                sort($arr);
                return implode(', ', $arr);
            }

            if (is_string($val) && strpos($val, ',') !== false) {
                $arr = array_map('trim', explode(',', $val));
                sort($arr);
                return implode(', ', $arr);
            }

            return $val;
        };

        switch ($operator) {
            case '=':
            case '!=':
                if (is_array($inputValue) && !is_array($conditionValue) && is_string($conditionValue) && strpos($conditionValue, ',') === false) {
                    $result = in_array($conditionValue, $inputValue);
                    return $operator === '=' ? $result : !$result;
                }

                $left  = $normalize($inputValue);
                $right = $normalize($conditionValue);

                return $operator === '='
                    ? ($left == $right)
                    : ($left != $right);

            case '>':
                return $inputValue >  $conditionValue;

            case '<':
                return $inputValue <  $conditionValue;

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
                return (is_array($inputValue)
                    ? count($inputValue)
                    : strlen((string) $inputValue)
                ) == $conditionValue;

            case 'length_less_than':
                return (is_array($inputValue)
                    ? count($inputValue)
                    : strlen((string) $inputValue)
                ) < $conditionValue;

            case 'length_greater_than':
                return (is_array($inputValue)
                    ? count($inputValue)
                    : strlen((string) $inputValue)
                ) > $conditionValue;

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

        return false;
    }

    private static function processSmartCodesInValue($value, &$inputs, $form = null)
    {
        if (strpos($value, '{') === false) {
            return $value;
        }

        if (preg_match('/^{inputs\.[^}]+}$/', $value)) {
            $fieldName = substr($value, 8, -1);
            $fieldKey = str_replace(['[', ']'], ['.', ''], $fieldName);
            
            $resolvedValue = Arr::get($inputs, $fieldKey, '');
            
            if ($resolvedValue === '' && $fieldKey !== $fieldName) {
                $resolvedValue = Arr::get($inputs, $fieldName, '');
            }
            
            // Return array if it's an array, otherwise return string
            if (is_array($resolvedValue)) {
                return $resolvedValue;
            }
            
            return $resolvedValue !== null && $resolvedValue !== '' ? $resolvedValue : '';
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
                
                try {
                    $parsed = EditorShortcodeParser::filter('{' . $smartCode . '}', $form);
                    
                    if ($parsed === '' || $parsed === '{' . $smartCode . '}') {
                        return $matches[0];
                    }
                    
                    return $parsed;
                } catch (\Exception $e) {
                    return $matches[0];
                }
            }, $value);
            
            return $processedValue;
        } catch (\Exception $e) {
            return $value;
        }
    }
}

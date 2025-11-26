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
        if ($conditional['field']) {
            $accessor = rtrim(str_replace(['[', ']', '*'], ['.'], $conditional['field']), '.');

            if (!Arr::has($inputs, $accessor)) {
                return false;
            }
            $inputValue = Arr::get($inputs, $accessor);

            if ($numericFormatter = Arr::get($conditional, 'numeric_formatter')) {
                $inputValue = Helper::getNumericValue($inputValue, $numericFormatter);
            }

            if (isset($conditional['value']) && is_string($conditional['value'])) {
                $conditional['value'] = self::processSmartCodesInValue($conditional['value'], $inputs, $form);
            }

            switch ($conditional['operator']) {
                case '=':
                    if(is_array($inputValue)) {
                       return in_array($conditional['value'], $inputValue);
                    }
                    return $inputValue == $conditional['value'];
                    break;
                case '!=':
                    if(is_array($inputValue)) {
                        return !in_array($conditional['value'], $inputValue);
                    }
                    return $inputValue != $conditional['value'];
                    break;
                case '>':
                    return $inputValue > $conditional['value'];
                    break;
                case '<':
                    return $inputValue < $conditional['value'];
                    break;
                case '>=':
                    return $inputValue >= $conditional['value'];
                    break;
                case '<=':
                    return $inputValue <= $conditional['value'];
                    break;
                case 'startsWith':
                    return Str::startsWith($inputValue, $conditional['value']);
                    break;
                case 'endsWith':
                    return Str::endsWith($inputValue, $conditional['value']);
                    break;
                case 'contains':
                    return Str::contains($inputValue, $conditional['value']);
                    break;
                case 'doNotContains':
                    return !Str::contains($inputValue, $conditional['value']);
                    break;
                case 'length_equal':
                    if(is_array($inputValue)) {
                        return count($inputValue) == $conditional['value'];
                    }
                    $inputValue = strval($inputValue);
                    return strlen($inputValue) == $conditional['value'];
                    break;
                case 'length_less_than':
                    if(is_array($inputValue)) {
                        return count($inputValue) < $conditional['value'];
                    }
                    $inputValue = strval($inputValue);
                    return strlen($inputValue) < $conditional['value'];
                    break;
                case 'length_greater_than':
                    if(is_array($inputValue)) {
                        return count($inputValue) > $conditional['value'];
                    }
                    $inputValue = strval($inputValue);
                    return strlen($inputValue) > $conditional['value'];
                    break;
                case 'test_regex':
                    if(is_array($inputValue)) {
                        $inputValue = implode(' ', $inputValue);
                    }
                    $result = preg_match('/'.$conditional['value'].'/', $inputValue);
                    return !!$result;
                    break;
            }
        }

        return false;
    }

    private static function processSmartCodesInValue($value, &$inputs, $form = null)
    {
        if (strpos($value, '{') === false) {
            return $value;
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
                    return $parsed;
                } catch (\Exception $e) {
                    // Continue to return original if parsing fails
                }
                
                // Return original smart code if not handled
                return $matches[0];
            }, $value);
            return $processedValue;
        } catch (\Exception $e) {
            return $value;
        }
    }
}

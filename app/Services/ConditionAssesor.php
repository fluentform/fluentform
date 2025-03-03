<?php

namespace FluentForm\App\Services;

use FluentForm\App\Helpers\Helper;
use FluentForm\App\Helpers\Str;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;

class ConditionAssesor
{
    public static function evaluate(&$field, &$inputs)
    {
        $status = Arr::get($field, 'conditionals.status');
        if (!$status) {
            return true;
        }

        $type = Arr::get($field, 'conditionals.type', 'any');

        // Handle group conditions
        if ($type === 'group' && $conditionGroups = Arr::get($field, 'conditionals.condition_groups')) {
            return self::evaluateGroupConditions($conditionGroups, $inputs);
        }

        // Handle 'any', 'all' conditions
        if ($type !== 'group' && $conditions = Arr::get($field, 'conditionals.conditions')) {
            return self::evaluateConditions($conditions, $inputs, $type);
        }
        return true;
    }

    private static function evaluateGroupConditions($conditionGroups, &$inputs)
    {
        $hasGroupConditionsMet = true;
        foreach ($conditionGroups as $group) {
            if ($conditions = Arr::get($group, 'rules')) {
                $hasGroupConditionsMet = self::evaluateConditions($conditions, $inputs, 'all');
                if ($hasGroupConditionsMet) {
                    return true;
                }
            }
        }
        return $hasGroupConditionsMet;
    }

    private static function evaluateConditions($conditions, &$inputs, $type)
    {
        $hasConditionMet = true;

        foreach ($conditions as $condition) {
            if (!Arr::get($condition, 'field') || !Arr::get($condition, 'operator')) {
                continue;
            }

            $hasConditionMet = static::assess($condition, $inputs);

            if ($hasConditionMet && $type == 'any') {
                return true;
            }

            if ($type === 'all' && !$hasConditionMet) {
                return false;
            }
        }

        return $hasConditionMet;
    }

    public static function assess(&$conditional, &$inputs)
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
}

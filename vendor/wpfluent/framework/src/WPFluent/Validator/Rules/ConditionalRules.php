<?php

namespace FluentForm\Framework\Validator\Rules;

use FluentForm\Framework\Support\Fluent;

class ConditionalRules
{
    /**
     * The boolean condition indicating if the rules should be added to the attribute.
     *
     * @var callable|bool
     */
    protected $condition;

    /**
     * The rules to be added to the attribute.
     *
     * @var array|string
     */
    protected $rules;

    /**
     * The rules to be added to the attribute if the condition fails.
     *
     * @var array|string
     */
    protected $defaults;

    /**
     * Create a new conditional rules instance.
     *
     * @param  callable|bool  $condition
     * @param  array|string  $rules
     * @param  array|string  $defaults
     * @return void
     */
    public function __construct($condition, $rules, $defaults = [])
    {
        $this->condition = $condition;
        $this->rules = $rules;
        $this->defaults = $defaults;
    }

    /**
     * Determine if the conditional rules should be added.
     *
     * @param  array  $data
     * @return bool
     */
    public function passes(array $data = [])
    {
        return is_callable($this->condition)
                    ? call_user_func($this->condition, new Fluent($data))
                    : $this->condition;
    }

    /**
     * Get the rules.
     *
     * @return array
     */
    public function rules()
    {
        if (is_object ($this->rules) && method_exists($this->rules, '__toString')) {
            $this->rules = (string) $this->rules;
        }

        return is_string($this->rules) ? explode('|', $this->rules) : $this->rules;
    }

    /**
     * Get the default rules.
     *
     * @return array
     */
    public function defaultRules()
    {
        if (is_object ($this->defaults) && method_exists($this->defaults, '__toString')) {
            $this->defaults = (string) $this->defaults;
        }

        return is_string($this->defaults) ? explode('|', $this->defaults) : $this->defaults;
    }
}

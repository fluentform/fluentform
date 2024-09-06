<?php

namespace FluentForm\App\Http\Requests;

use FluentForm\Framework\Validator\Rule;
use FluentForm\Framework\Foundation\RequestGuard;

class UserRequest extends RequestGuard
{
    /**
     * Register your custom rules
     */
    public function __construct()
    {
        // Rule::add(CustomRule::class);
    }

    /**
     * Authorize the request
     * 
     * @return bool
     */
    public function authorize()
    {
        return true;
    }

    /**
     * @return Array
     */
    public function rules()
    {
        return [];
    }

    /**
     * @return Array
     */
    public function messages()
    {
        return [];
    }

    /**
     * @return Array
     */
    public function beforeValidation()
    {
        $data = $this->all();
        
        // Modify the $data

        return $data;
    }

    /**
     * @return Array
     */
    public function afterValidation()
    {
        $data = $this->all();
        
        // Modify the $data

        return $data;
    }

    /**
     * @return array
     */
    public function sanitize()
    {
        $data = $this->all();

        $data['age'] = intval($data['age']);

        $data['address'] = wp_kses($data['address']);

        $data['name'] = sanitize_text_field($data['name']);

        return $data;
    }

}

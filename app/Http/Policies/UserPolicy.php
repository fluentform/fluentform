<?php

namespace FluentForm\App\Http\Policies;

use FluentForm\Framework\Request\Request;
use FluentForm\Framework\Foundation\Policy;

class UserPolicy extends Policy
{
    /**
     * Check user permission for any method
     * @param  \FluentForm\Framework\Request\Request $request
     * @return bool
     */
    public function verifyRequest(Request $request)
    {
        return current_user_can('manage_options');
    }

    /**
     * Check user permission for any method
     * @param  \FluentForm\Framework\Request\Request $request
     * @return bool
     */
    public function create(Request $request)
    {
        return current_user_can('manage_options');
    }
}

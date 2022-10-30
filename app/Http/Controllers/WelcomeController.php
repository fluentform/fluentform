<?php

namespace FluentForm\App\Http\Controllers;

use FluentForm\Framework\Request\Request;

class WelcomeController extends Controller
{
    public function index(Request $request)
    {
        return [
            'message' => 'Welcome to WPFluent.',
        ];
    }
}

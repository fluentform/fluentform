<?php

namespace FluentForm\App\Modules\Ai;

/**
 *  Handling Ai Module.
 *
 * @since 6.0.0
 */
class AiController
{

    public function boot()
    {
        new AiFormBuilder();

        // Boot AI Chat module
        $aiChatController = new \FluentForm\App\Modules\AiChat\AiChatController();
        $aiChatController->boot();
    }
}

<?php

namespace FluentForm\App\Modules\MCP\Support;

defined('ABSPATH') || exit;

use FluentForm\App\Modules\Acl\Acl;
use FluentForm\App\Modules\Ai\AiFormBuilder;
use FluentForm\App\Services\Form\FormService;

/**
 * Builds a form from a simple field spec for the create-form MCP tool.
 *
 * Extends AiFormBuilder purely to reuse its (protected) field-mapping + save
 * pipeline, so the MCP concern stays out of the AI builder itself.
 */
class FormCreator extends AiFormBuilder
{
    /**
     * Set up the save pipeline without AiFormBuilder's constructor, which only
     * adds it to register an admin-ajax handler this REST/MCP path never uses.
     */
    public function __construct()
    {
        FormService::__construct();
    }

    /**
     * Create a form from a title + field spec.
     *
     * @param array $form { title: string, fields: array, is_conversational?: bool }.
     * @return \FluentForm\App\Models\Form
     * @throws \Exception
     */
    public function create(array $form)
    {
        Acl::verify('fluentform_forms_manager');

        return $this->prepareAndSaveForm($form);
    }
}

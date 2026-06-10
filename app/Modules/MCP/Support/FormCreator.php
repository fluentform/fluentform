<?php

namespace FluentForm\App\Modules\MCP\Support;

defined('ABSPATH') || exit;

use FluentForm\App\Modules\Acl\Acl;
use FluentForm\App\Modules\Ai\AiFormBuilder;

/**
 * Builds a form from a simple field spec for the create-form MCP tool.
 *
 * Extends AiFormBuilder purely to reuse its (protected) field-mapping + save
 * pipeline, so the MCP concern stays out of the AI builder itself.
 */
class FormCreator extends AiFormBuilder
{
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

<?php

namespace FluentForm\App\Modules\MCP\Support;

defined('ABSPATH') || exit;

use FluentForm\App\Modules\Acl\Acl;
use FluentForm\App\Modules\Ai\AiFormBuilder;
use FluentForm\App\Services\Form\FormService;
use FluentForm\Framework\Support\Arr;

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

        $form['fields'] = $this->assignStorageNames(Arr::get($form, 'fields', []));

        return $this->prepareAndSaveForm($form);
    }

    /**
     * Assign a unique attributes.name to every input field. Submission responses
     * are keyed by field name, and AiFormBuilder keeps the component default when
     * no name is supplied — so two fields of the same type would share one
     * storage key and overwrite each other's submitted values. Idempotent:
     * fields that already carry a unique name pass through unchanged, so the
     * tool boundary can assign names and create() re-running it is a no-op.
     */
    public function assignStorageNames(array $fields)
    {
        $used = [];

        foreach ($fields as &$field) {
            if (!is_array($field)) {
                continue;
            }

            $element = $this->resolveInput($field);
            if (!$element || 'container' === $element) {
                continue;
            }

            $current = Arr::get($field, 'attributes.name');
            $default = Arr::get($this->getDefaultFields(), $element . '.attributes.name');
            if (!$current && !$default) {
                // Element has no storage key (custom_html, section_break, …).
                continue;
            }

            $base = $current ? $current : $this->nameFromLabel(Arr::get($field, 'settings.label', ''), $default ? $default : $element);

            $name  = $base;
            $count = 1;
            while (isset($used[$name])) {
                $name = $base . '_' . $count;
                ++$count;
            }
            $used[$name] = true;

            $field['attributes']['name'] = $name;
        }
        unset($field);

        return $fields;
    }

    private function nameFromLabel($label, $fallback)
    {
        $name = sanitize_key(str_replace([' ', '-'], '_', (string) $label));
        $name = preg_replace('/_+/', '_', trim($name, '_'));
        if (strlen($name) > 40) {
            $name = rtrim(substr($name, 0, 40), '_');
        }

        return '' !== $name ? $name : $fallback;
    }
}

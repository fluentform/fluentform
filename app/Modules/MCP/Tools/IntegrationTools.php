<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') or die;

use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\PermissionGate;
use FluentForm\App\Services\Integrations\FormIntegrationService;

/**
 * Integration tools (read).
 *
 * list-integrations reports the integration feeds configured on one form
 * (provider, name, enabled) so an agent can answer "where do this form's entries
 * go?". It reuses FormIntegrationService::get(), the same source the admin
 * integrations screen reads, and is form-scoped.
 */
class IntegrationTools
{
    public static function definitions()
    {
        return [
            'fluentform/list-integrations' => [
                'label'       => __('List Integrations', 'fluentform'),
                'description' => __('List the integration feeds configured on one form (provider, name, enabled state) — the notifications and third-party connections that fire when the form is submitted. Requires form_id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id' => ['type' => 'integer'],
                    ],
                    'required' => ['form_id'],
                ],
                'execute_callback'    => [self::class, 'listIntegrations'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_forms_manager')
                        || PermissionGate::can('fluentform_settings_manager')
                        || PermissionGate::can('fluentform_dashboard_access');
                },
                'annotations' => ['readonly' => true],
            ],
        ];
    }

    public static function listIntegrations($params = [])
    {
        $formId = isset($params['form_id']) ? (int) $params['form_id'] : 0;
        if (!$formId) {
            return MCPHelper::error('missing_identifier', __('form_id is required.', 'fluentform'), ['fields' => ['form_id']]);
        }
        if (!PermissionGate::canAccessForm($formId)) {
            return MCPHelper::error('forbidden', __('You do not have access to this form.', 'fluentform'));
        }

        $feeds = (new FormIntegrationService())->get($formId);

        $rows = [];
        foreach ((array) $feeds as $feed) {
            $rows[] = [
                'id'       => isset($feed['id']) ? (int) $feed['id'] : null,
                'name'     => isset($feed['name']) ? $feed['name'] : null,
                'provider' => isset($feed['provider']) ? $feed['provider'] : null,
                'enabled'  => !empty($feed['enabled']),
            ];
        }

        return MCPHelper::envelope(
            sprintf(
                /* translators: %d: number of integration feeds */
                _n('%d integration feed configured.', '%d integration feeds configured.', count($rows), 'fluentform'),
                count($rows)
            ),
            ['form_id' => $formId, 'integrations' => $rows]
        );
    }
}

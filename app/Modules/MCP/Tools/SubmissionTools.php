<?php

namespace FluentForm\App\Modules\MCP\Tools;

defined('ABSPATH') || exit;

use FluentForm\App\Models\Submission;
use FluentForm\App\Modules\MCP\Support\ErrorCodes;
use FluentForm\App\Modules\MCP\Support\FormAccess;
use FluentForm\App\Modules\MCP\Support\MCPHelper;
use FluentForm\App\Modules\MCP\Support\Mutation;
use FluentForm\App\Modules\MCP\Support\PermissionGate;
use FluentForm\App\Modules\MCP\Support\WriteGuard;
use FluentForm\App\Services\Form\FormService;
use FluentForm\App\Services\Submission\SubmissionService;
use FluentForm\Framework\Support\Arr;

/**
 * Submission (entry) tools.
 *
 * Read: list-submissions (compact rows, requires form_id) and get-submission
 * (one entry, fields labeled). Write: update-submission-status and
 * add-submission-note — reversible, so they ship without a dry-run guard and
 * rely on the manage-entries permission.
 *
 * SECURITY: every tool resolves the entry's real form_id from the DB and checks
 * it against the user's form scope before returning or mutating — a "specific
 * forms" manager can never reach an entry on a form outside their assignment by
 * passing its id (IDOR-safe).
 */
class SubmissionTools
{
    const BULK_MAX = 200;

    public static function definitions()
    {
        return [
            'fluentform/list-submissions' => [
                'label'       => __('List Submissions', 'fluentform'),
                'group'       => __('Entries', 'fluentform'),
                'description' => __('List and filter entries for one form (form_id required). Compact rows: id, serial, status, favorite, date, and a short value preview. Filter by status, search text, and date range; sort by date. Use get-submission for the full labeled entry.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'form_id'      => ['type' => 'integer', 'description' => 'Required. The form whose entries to list.'],
                        'status'       => ['type' => 'string', 'enum' => ['unread', 'read', 'spam', 'trashed', 'favorites'], 'description' => 'favorites returns favorited entries regardless of read state.'],
                        'search'       => ['type' => 'string', 'description' => 'Matches entry id, response text, status, or date.'],
                        'date_from'    => ['type' => 'string', 'description' => 'YYYY-MM-DD (site timezone).'],
                        'date_to'      => ['type' => 'string', 'description' => 'YYYY-MM-DD (site timezone).'],
                        'sort_by'      => ['type' => 'string', 'enum' => ['ASC', 'DESC'], 'default' => 'DESC'],
                        'page'         => ['type' => 'integer', 'default' => 1],
                        'per_page'     => ['type' => 'integer', 'default' => 15, 'description' => 'Max 100.'],
                    ],
                    'required' => ['form_id'],
                ],
                'execute_callback'    => [self::class, 'listSubmissions'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_entries_viewer');
                },
                'annotations' => ['readonly' => true],
            ],

            'fluentform/get-submission' => [
                'label'       => __('Get Submission', 'fluentform'),
                'group'       => __('Entries', 'fluentform'),
                'description' => __('Full detail for one entry by id: status, serial, dates, the submitting user, and every field as a label/value pair. The form_id is resolved from the entry itself, then checked against your form access.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'entry_id' => ['type' => 'integer', 'description' => 'The submission id (from list-submissions).'],
                    ],
                    'required' => ['entry_id'],
                ],
                'execute_callback'    => [self::class, 'getSubmission'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_entries_viewer');
                },
                'annotations' => ['readonly' => true],
            ],

            'fluentform/update-submission-status' => [
                'label'       => __('Update Submission Status', 'fluentform'),
                'group'       => __('Entries', 'fluentform'),
                'description' => __('Set one entry\'s status (unread, read, spam, trashed). trashed soft-deletes the entry; it can be restored by setting another status. Acts on a single entry by id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'entry_id' => ['type' => 'integer'],
                        'status'   => ['type' => 'string', 'enum' => ['unread', 'read', 'spam', 'trashed']],
                    ],
                    'required' => ['entry_id', 'status'],
                ],
                'execute_callback'    => [self::class, 'updateStatus'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_manage_entries');
                },
            ],

            'fluentform/add-submission-note' => [
                'label'       => __('Add Submission Note', 'fluentform'),
                'group'       => __('Entries', 'fluentform'),
                'description' => __('Add an internal staff note to one entry (not visible to the submitter). Acts on a single entry by id.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'entry_id' => ['type' => 'integer'],
                        'content'  => ['type' => 'string', 'description' => 'Note text (plain text; HTML tags are stripped).'],
                    ],
                    'required' => ['entry_id', 'content'],
                ],
                'execute_callback'    => [self::class, 'addNote'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_manage_entries');
                },
            ],

            'fluentform/delete-submission' => [
                'label'       => __('Delete Submission', 'fluentform'),
                'group'       => __('Entries', 'fluentform'),
                'description' => __('Permanently delete one entry and its uploaded files. This is irreversible — to merely hide an entry, prefer update-submission-status with status:trashed. Call once with dry_run:true to preview and get a confirm_token, then call again with the same entry_id plus confirm_token to execute.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'entry_id'        => ['type' => 'integer'],
                        'dry_run'         => ['type' => 'boolean', 'description' => 'Preview without deleting; returns a confirm_token.'],
                        'confirm_token'   => ['type' => 'string', 'description' => 'The token from the dry_run preview, required to execute.'],
                        'idempotency_key' => ['type' => 'string', 'description' => 'Optional; a retry with the same key will not delete twice.'],
                    ],
                    'required' => ['entry_id'],
                ],
                'execute_callback'    => [self::class, 'deleteSubmission'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_manage_entries');
                },
                'annotations' => ['destructive' => true],
            ],

            'fluentform/bulk-update-submissions' => [
                'label'       => __('Bulk Update Submissions', 'fluentform'),
                'group'       => __('Entries', 'fluentform'),
                'description' => __('Apply one action to many entries at once: read, unread, trashed, favorite, unfavorite, or delete_permanently. Pass entry_ids (max 200). Entries outside your form access are skipped. Call once with dry_run:true to preview the in-scope count and get a confirm_token, then call again with the same entry_ids plus confirm_token to execute. delete_permanently is irreversible. To mark entries as spam, use update-submission-status per entry.', 'fluentform'),
                'input_schema' => [
                    'type'       => 'object',
                    'properties' => [
                        'entry_ids'       => ['type' => 'array', 'items' => ['type' => 'integer'], 'description' => 'Entry ids to act on (max 200).'],
                        'action'          => ['type' => 'string', 'enum' => ['read', 'unread', 'trashed', 'favorite', 'unfavorite', 'delete_permanently']],
                        'dry_run'         => ['type' => 'boolean', 'description' => 'Preview without changing anything; returns a confirm_token.'],
                        'confirm_token'   => ['type' => 'string', 'description' => 'The token from the dry_run preview, required to execute.'],
                        'idempotency_key' => ['type' => 'string', 'description' => 'Optional; a retry with the same key will not act twice.'],
                    ],
                    'required' => ['entry_ids', 'action'],
                ],
                'execute_callback'    => [self::class, 'bulkUpdate'],
                'permission_callback' => function () {
                    return PermissionGate::can('fluentform_manage_entries');
                },
                'annotations' => ['destructive' => true],
                'advanced'    => true,
            ],
        ];
    }

    public static function listSubmissions($params = [])
    {
        $form = FormAccess::resolveForm(isset($params['form_id']) ? $params['form_id'] : 0);
        if (is_wp_error($form)) {
            return $form;
        }
        $formId = (int) $form->id;

        $paging = MCPHelper::pagination($params, 15);

        $attributes = [
            'form_id'    => $formId,
            'entry_type' => !empty($params['status']) ? sanitize_text_field($params['status']) : '',
            'search'     => !empty($params['search']) ? sanitize_text_field($params['search']) : '',
            'sort_by'    => (isset($params['sort_by']) && 'ASC' === strtoupper($params['sort_by'])) ? 'ASC' : 'DESC',
        ];

        if (!empty($params['date_from']) && !empty($params['date_to'])) {
            $dateFrom = sanitize_text_field($params['date_from']);
            $dateTo   = sanitize_text_field($params['date_to']);
            if (!MCPHelper::isYmd($dateFrom) || !MCPHelper::isYmd($dateTo)) {
                return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('date_from and date_to must be valid dates in YYYY-MM-DD format.', 'fluentform'), ['fields' => ['date_from', 'date_to']]);
            }
            if ($dateFrom > $dateTo) {
                return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('date_from must be on or before date_to.', 'fluentform'), ['fields' => ['date_from', 'date_to']]);
            }
            $attributes['date_range'] = [$dateFrom, $dateTo];
        }

        $model = new Submission();
        $query = $model->customQuery($attributes);

        // Defense in depth: customQuery does not apply the user's form scope, so
        // re-assert it even though form_id was already access-checked above.
        FormAccess::applyScope($query, 'fluentform_submissions.form_id');

        $paginator = $query->paginate($paging['per_page'], ['*'], 'page', $paging['page']);
        $total     = MCPHelper::paginatorTotal($paginator);

        $labels = self::formLabels($formId);

        $items = MCPHelper::paginatorItems($paginator);
        $rows = [];
        foreach ($items as $submission) {
            $rows[] = [
                'id'           => (int) $submission->id,
                'serial'       => isset($submission->serial_number) ? (int) $submission->serial_number : null,
                'status'       => $submission->status,
                'is_favorite'  => (bool) $submission->is_favourite,
                'created_at'   => MCPHelper::toIso8601($submission->created_at),
                'preview'      => self::valuePreview($submission->response, $labels),
            ];
        }

        // Augmentation seam: $items is passed so Pro can batch-load a per-row `payment` summary (no N+1).
        $rows = apply_filters('fluentform/mcp_submission_rows', $rows, $items, $formId);

        return MCPHelper::envelope(
            sprintf(
                /* translators: 1: entry count, 2: form title */
                _n('%1$d entry found on "%2$s".', '%1$d entries found on "%2$s".', $total, 'fluentform'),
                $total,
                $form->title
            ),
            ['submissions' => $rows],
            MCPHelper::pagingMeta($paginator)
        );
    }

    public static function getSubmission($params = [])
    {
        $submission = FormAccess::resolveSubmission(isset($params['entry_id']) ? $params['entry_id'] : 0);
        if (is_wp_error($submission)) {
            return $submission;
        }
        $entryId = (int) $submission->id;

        $labels = self::formLabels($submission->form_id);
        $values = self::labeledValues($submission->response, $labels);

        $user = null;
        if ($submission->user_id) {
            $wpUser = get_user_by('ID', $submission->user_id);
            if ($wpUser) {
                $user = ['id' => (int) $wpUser->ID, 'name' => $wpUser->display_name, 'email' => $wpUser->user_email];
            }
        }

        $data = [
            'id'          => (int) $submission->id,
            'form_id'     => (int) $submission->form_id,
            'serial'      => isset($submission->serial_number) ? (int) $submission->serial_number : null,
            'status'      => $submission->status,
            'is_favorite' => (bool) $submission->is_favourite,
            'created_at'  => MCPHelper::toIso8601($submission->created_at),
            'updated_at'  => MCPHelper::toIso8601($submission->updated_at),
            'user'        => $user,
            'fields'      => $values,
        ];

        // Augmentation seam: Pro injects a compact `payment` block; the listener owns the payments capability check.
        $data = apply_filters('fluentform/mcp_submission_data', $data, $submission);

        return MCPHelper::envelope(
            sprintf(
                /* translators: %d: entry id */
                __('Entry #%d loaded.', 'fluentform'),
                $entryId
            ),
            $data
        );
    }

    public static function updateStatus($params = [])
    {
        $status = isset($params['status']) ? sanitize_text_field($params['status']) : '';
        if (!in_array($status, ['unread', 'read', 'spam', 'trashed'], true)) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('status must be one of: unread, read, spam, trashed.', 'fluentform'), ['fields' => ['status']]);
        }

        $submission = FormAccess::resolveSubmission(isset($params['entry_id']) ? $params['entry_id'] : 0);
        if (is_wp_error($submission)) {
            return $submission;
        }
        $entryId = (int) $submission->id;
        $formId  = (int) $submission->form_id;

        return Mutation::run('fluentform/update-submission-status', $params, function () use ($entryId, $status) {
            (new SubmissionService())->updateStatus(['entry_id' => $entryId, 'status' => $status]);

            return MCPHelper::envelope(
                sprintf(
                    /* translators: 1: entry id, 2: new status */
                    __('Entry #%1$d marked as %2$s.', 'fluentform'),
                    $entryId,
                    $status
                ),
                ['id' => $entryId, 'status' => $status]
            );
        }, ['form_id' => $formId, 'entry_id' => $entryId]);
    }

    public static function addNote($params = [])
    {
        $content = isset($params['content']) ? trim((string) $params['content']) : '';
        if ('' === $content) {
            return MCPHelper::error(ErrorCodes::MISSING_PARAM, __('content is required.', 'fluentform'), ['fields' => ['content']]);
        }

        $submission = FormAccess::resolveSubmission(isset($params['entry_id']) ? $params['entry_id'] : 0);
        if (is_wp_error($submission)) {
            return $submission;
        }
        $entryId = (int) $submission->id;
        $formId  = (int) $submission->form_id;

        return Mutation::run('fluentform/add-submission-note', $params, function () use ($entryId, $formId, $content) {
            $result = (new SubmissionService())->storeNote($entryId, [
                'form_id' => $formId,
                'note'    => ['content' => wp_kses_post($content), 'status' => ''],
            ]);

            return MCPHelper::envelope(
                __('Note added.', 'fluentform'),
                ['id' => $entryId, 'note_id' => isset($result['insert_id']) ? (int) $result['insert_id'] : null]
            );
        }, ['form_id' => $formId, 'entry_id' => $entryId]);
    }

    public static function deleteSubmission($params = [])
    {
        // Replay before resolving: once the entry is deleted, a lost-response
        // retry could never resolve it again, so the idempotent result would be
        // unreachable. The replay cache is keyed per user, so no access bypass.
        $replay = WriteGuard::replay(
            'fluentform/delete-submission',
            'submission:' . (isset($params['entry_id']) ? (int) $params['entry_id'] : 0),
            isset($params['idempotency_key']) ? $params['idempotency_key'] : ''
        );
        if (null !== $replay) {
            return $replay;
        }

        $submission = FormAccess::resolveSubmission(isset($params['entry_id']) ? $params['entry_id'] : 0);
        if (is_wp_error($submission)) {
            return $submission;
        }
        $entryId = (int) $submission->id;
        $formId  = (int) $submission->form_id;

        return Mutation::runGuarded(
            'fluentform/delete-submission',
            $params,
            'submission:' . $entryId,
            'status:' . $submission->status . '|fav:' . (int) $submission->is_favourite,
            function () use ($entryId, $formId, $submission) {
                return [
                    'entry_id'   => $entryId,
                    'form_id'    => $formId,
                    'serial'     => isset($submission->serial_number) ? (int) $submission->serial_number : null,
                    'status'     => $submission->status,
                    'created_at' => MCPHelper::toIso8601($submission->created_at),
                    'permanent'  => true,
                ];
            },
            function () use ($entryId, $formId) {
                (new SubmissionService())->deleteEntries([$entryId], $formId);

                return MCPHelper::envelope(
                    sprintf(
                        /* translators: %d: entry id */
                        __('Entry #%d permanently deleted.', 'fluentform'),
                        $entryId
                    ),
                    ['id' => $entryId, 'deleted' => true]
                );
            },
            ['form_id' => $formId, 'entry_id' => $entryId]
        );
    }

    public static function bulkUpdate($params = [])
    {
        // No 'spam' here: Helper::getEntryStatuses() (which handleBulkActions
        // switches on) does not include it, so a bulk spam would silently no-op.
        $actionMap = [
            'read'               => 'read',
            'unread'             => 'unread',
            'trashed'            => 'trashed',
            'favorite'           => 'other.make_favorite',
            'unfavorite'         => 'other.unmark_favorite',
            'delete_permanently' => 'other.delete_permanently',
        ];

        $action = isset($params['action']) ? sanitize_text_field($params['action']) : '';
        if (!isset($actionMap[$action])) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('action must be one of: read, unread, trashed, favorite, unfavorite, delete_permanently.', 'fluentform'), ['fields' => ['action']]);
        }

        $entryIds = isset($params['entry_ids']) ? $params['entry_ids'] : [];
        if (!is_array($entryIds) || empty($entryIds)) {
            return MCPHelper::error(ErrorCodes::MISSING_PARAM, __('entry_ids must be a non-empty array of entry ids.', 'fluentform'), ['fields' => ['entry_ids']]);
        }
        $entryIds = array_values(array_unique(array_filter(array_map('intval', $entryIds))));
        if (empty($entryIds)) {
            return MCPHelper::error(ErrorCodes::INVALID_PARAM, __('entry_ids must contain valid entry ids.', 'fluentform'), ['fields' => ['entry_ids']]);
        }
        if (count($entryIds) > self::BULK_MAX) {
            return MCPHelper::error(
                ErrorCodes::LIMIT_EXCEEDED,
                sprintf(
                    /* translators: %d: max entries per bulk call */
                    __('entry_ids exceeds the limit of %d per call; split into smaller batches.', 'fluentform'),
                    self::BULK_MAX
                ),
                ['fields' => ['entry_ids'], 'limit' => self::BULK_MAX]
            );
        }
        sort($entryIds);

        $entityKey = 'bulk:' . $action . ':' . md5(implode(',', $entryIds));

        // Replay before resolving: after delete_permanently the ids no longer
        // resolve, so a lost-response retry would find zero rows and fail instead
        // of returning the cached result (same rationale as deleteSubmission).
        // The replay cache is keyed per user, so no access bypass.
        $replay = WriteGuard::replay(
            'fluentform/bulk-update-submissions',
            $entityKey,
            isset($params['idempotency_key']) ? $params['idempotency_key'] : ''
        );
        if (null !== $replay) {
            return $replay;
        }

        // Resolve all entries in one query, then re-assert the user's form scope
        // per entry (handleBulkActions trusts its form_id and applies no scope) —
        // a "specific forms" manager can never act on an entry outside their
        // assignment by passing its id. Out-of-scope ids are skipped, not refused.
        $rows = Submission::query()->whereIn('id', $entryIds)->get(['id', 'form_id']);

        $byForm      = [];
        $accessCache = [];
        foreach ($rows as $row) {
            $formId = (int) $row->form_id;
            if (!array_key_exists($formId, $accessCache)) {
                $accessCache[$formId] = PermissionGate::canAccessForm($formId);
            }
            if ($accessCache[$formId]) {
                $byForm[$formId][] = (int) $row->id;
            }
        }

        $inScope = [];
        foreach ($byForm as $ids) {
            $inScope = array_merge($inScope, $ids);
        }
        sort($inScope);
        $skipped = array_values(array_diff($entryIds, $inScope));

        if (empty($inScope)) {
            return MCPHelper::error(ErrorCodes::FORBIDDEN, __('None of the given entries are within your form access.', 'fluentform'), ['fields' => ['entry_ids']]);
        }

        $actionType  = $actionMap[$action];
        $fingerprint = $action . '|n:' . count($inScope) . '|' . md5(implode(',', $inScope));
        $formIds     = array_keys($byForm);

        return Mutation::runGuarded(
            'fluentform/bulk-update-submissions',
            $params,
            $entityKey,
            $fingerprint,
            function () use ($action, $inScope, $skipped, $byForm) {
                return [
                    'action'    => $action,
                    'in_scope'  => count($inScope),
                    'entry_ids' => $inScope,
                    'skipped'   => $skipped,
                    'forms'     => array_map('count', $byForm),
                ];
            },
            function () use ($actionType, $action, $byForm, $inScope, $skipped, $formIds) {
                $service = new SubmissionService();
                foreach ($byForm as $formId => $ids) {
                    $service->handleBulkActions([
                        'form_id'     => $formId,
                        'entries'     => $ids,
                        'action_type' => $actionType,
                    ]);
                }

                return MCPHelper::envelope(
                    sprintf(
                        /* translators: 1: entry count, 2: action */
                        _n('%1$d entry updated (%2$s).', '%1$d entries updated (%2$s).', count($inScope), 'fluentform'),
                        count($inScope),
                        $action
                    ),
                    [
                        'action'  => $action,
                        'updated' => count($inScope),
                        'skipped' => $skipped,
                        'forms'   => $formIds,
                    ]
                );
            },
            ['form_id' => (1 === count($formIds) ? $formIds[0] : null)]
        );
    }

    private static function formLabels($formId)
    {
        try {
            $schema = (new FormService())->getInputsAndLabels($formId);
            return isset($schema['labels']) ? $schema['labels'] : [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    private static function decodeResponse($response)
    {
        if (is_array($response)) {
            return $response;
        }
        $decoded = json_decode((string) $response, true);
        return is_array($decoded) ? $decoded : [];
    }

    private static function labeledValues($response, $labels)
    {
        $data = self::decodeResponse($response);
        $out  = [];
        foreach ($data as $key => $value) {
            if (FormAccess::isInternalKey($key)) {
                continue;
            }
            $out[] = [
                'key'   => $key,
                'label' => Arr::get($labels, $key, $key),
                'value' => self::flattenValue($value),
            ];
        }
        return $out;
    }

    private static function valuePreview($response, $labels, $max = 3)
    {
        $data  = self::decodeResponse($response);
        $parts = [];
        foreach ($data as $key => $value) {
            if (FormAccess::isInternalKey($key)) {
                continue;
            }
            $flat = self::flattenValue($value);
            if ('' === $flat || null === $flat) {
                continue;
            }
            $label   = Arr::get($labels, $key, $key);
            $parts[] = $label . ': ' . MCPHelper::preview($flat, 60);
            if (count($parts) >= $max) {
                break;
            }
        }
        return implode(' | ', $parts);
    }

    private static function flattenValue($value)
    {
        if (is_array($value)) {
            $flat = [];
            array_walk_recursive($value, function ($item) use (&$flat) {
                if (is_scalar($item) && '' !== $item) {
                    $flat[] = $item;
                }
            });
            return implode(', ', $flat);
        }
        if (is_scalar($value)) {
            return (string) $value;
        }
        return '';
    }
}

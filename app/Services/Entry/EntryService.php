<?php

namespace FluentForm\App\Services\Entry;

use Exception;
use FluentForm\App\Models\Form;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Models\Submission;
use FluentForm\Framework\Support\Arr;
use FluentForm\Framework\Support\Collection;
use FluentForm\App\Services\Form\FormService;
use FluentForm\App\Modules\Form\FormDataParser;
use FluentForm\App\Modules\Form\FormFieldsParser;

class EntryService
{
    /**
     * @var \FluentForm\App\Models\Submission|\FluentForm\Framework\Database\Query\Builder
     */
    protected $model;

    protected $formService;

    public function __construct(Submission $submission, FormService $formService)
    {
        $this->model = $submission;
        $this->formService = $formService;
    }

    public function get($attributes = [])
    {
        if (!defined('FLUENTFORM_RENDERING_ENTRIES')) {
            define('FLUENTFORM_RENDERING_ENTRIES', true);
        }

        $wheres = [];

        $paymentStatuses = Arr::get($attributes, 'payment_statuses');

        if ($paymentStatuses) {
            if (is_array($paymentStatuses)) {
                $wheres[] = ['payment_status', $paymentStatuses];
            }
        }

        $entryType = Arr::get($attributes, 'entry_type');
        $dateRange = Arr::get($attributes, 'date_range');
        $isFavorite = false;
        $status = $entryType;

        // We have to handle favorites separately because status and favorites are different
        if ('favorites' === $entryType) {
            $isFavorite = true;
            $status = false;
        }

        $queryAttrs = array_merge($attributes, [
            'is_favourite' => $isFavorite,
            'status'       => $status,
            'start_date'   => Arr::get($dateRange, 0),
            'end_date'     => Arr::get($dateRange, 1),
            'wheres'       => $wheres,
            'sort_by'      => Arr::get($attributes, 'sort_by', 'DESC'),
        ]);

        $entries = $this->model->paginateEntries($queryAttrs);

        if (Arr::get($attributes, 'parse_entry')) {
            $form = Form::find(Arr::get($attributes, 'form_id'));

            $parsedEntries = FormDataParser::parseFormEntries($entries->items(), $form);

            $entries->setCollection(Collection::make($parsedEntries));
        }

        return $entries;
    }

    public function resources($formId)
    {
        $counts = $this->model->countByGroup($formId);

        $formInputsAndLabels = $this->formService->getInputsAndLabels($formId);

        $visibleColumns = Helper::getFormMeta($formId, '_visible_columns', null);
        $columnsOrder = Helper::getFormMeta($formId, '_columns_order', null);

        $resources = [
            'counts'         => $counts,
            'labels'         => $formInputsAndLabels['labels'],
            'visibleColumns' => $visibleColumns,
            'columnsOrder'   => $columnsOrder,
        ];

        return apply_filters('fluentform/entries_resources', $resources);
    }

    public function updateStatus($attributes = [])
    {
        $entryId = intval(Arr::get($attributes, 'entry_id'));

        $status = sanitize_text_field(Arr::get($attributes, 'status'));

        $this->model->amend($entryId, ['status' => $status]);

        return $status;
    }

    public function toggleIsFavorite($attributes = [])
    {
        $entryId = intval(Arr::get($attributes, 'entry_id'));

        $isFavourite = intval(Arr::get($attributes, 'is_favourite'));

        if ($isFavourite) {
            $message = __('The entry has been marked as favorites', 'fluentform');
        } else {
            $message = __('The entry has been removed from favorites', 'fluentform');
        }

        $this->model->amend($entryId, ['is_favourite' => $isFavourite]);

        return [$message, $isFavourite];
    }

    public function storeColumnSettings($attributes = [])
    {
        $formId = Arr::get($attributes, 'form_id');
        $metaKey = sanitize_text_field(Arr::get($attributes, 'meta_key'));
        $metaValue = wp_unslash(Arr::get($attributes, 'settings'));

        FormMeta::persist($formId, $metaKey, $metaValue);
    }

    public function handleBulkActions($attributes = [])
    {
        $formId = Arr::get($attributes, 'form_id');

        $entryIds = fluentFormSanitizer(Arr::get($attributes, 'entries', []));

        $actionType = sanitize_text_field(Arr::get($attributes, 'action_type'));

        if (!$formId || !count($entryIds)) {
            throw new Exception(__('Please select entries first', 'fluentform'));
        }

        $query = $this->model->where('form_id', $formId)->whereIn('id', $entryIds);

        $statuses = Helper::getEntryStatuses($formId);

        $message = '';

        if (isset($statuses[$actionType])) {
            $query->update([
                'status'     => $actionType,
                'updated_at' => current_time('mysql'),
            ]);

            $message = 'Selected entries successfully marked as ' . $statuses[$actionType];
        } elseif ('other.delete_permanently' == $actionType) {
            $this->deleteEntries($entryIds, $formId);

            $message = __('Selected entries successfully deleted', 'fluentform');
        } elseif ('other.make_favorite' == $actionType) {
            $query->update([
                'is_favourite' => 1,
            ]);

            $message = __('Selected entries successfully marked as favorites', 'fluentform');
        } elseif ('other.unmark_favorite' == $actionType) {
            $query->update([
                'is_favourite' => 0,
            ]);

            $message = __('Selected entries successfully removed from favorites', 'fluentform');
        }

        return $message;
    }

    public function deleteEntries($entryIds, $formId)
    {
        $entryIds = (array) $entryIds;

        do_action('fluentform/before_deleting_entries', $entryIds, $formId);

        foreach ($entryIds as $entryId) {
            do_action_deprecated(
                'fluentform_before_entry_deleted',
                [$entryId, $formId],
                FLUENTFORM_FRAMEWORK_UPGRADE,
                'fluentform/before_deleting_entries'
            );
        }

        $this->deleteFiles($entryIds, $formId);

        $this->model->remove($entryIds);

        do_action('fluentform/after_deleting_entries', $entryIds, $formId);

        foreach ($entryIds as $entryId) {
            do_action_deprecated(
                'fluentform_after_entry_deleted',
                [$entryId, $formId],
                FLUENTFORM_FRAMEWORK_UPGRADE,
                'fluentform/after_deleting_entries'
            );
        }
    }

    public function deleteFiles($entryIds, $formId)
    {
        $disableAttachmentDelete = apply_filters(
            'fluentform_disable_attachment_delete', false, $formId
        );

        $shouldDelete = defined('FLUENTFORMPRO') && $formId && !$disableAttachmentDelete;

        if ($shouldDelete) {
            $deletables = $this->getAttachments($entryIds, $formId);

            foreach ($deletables as $file) {
                $file = wp_upload_dir()['basedir'] . FLUENTFORM_UPLOAD_DIR . '/' . basename($file);

                if (is_readable($file) && !is_dir($file)) {
                    @unlink($file);
                }
            }
        }
    }

    public function getAttachments($entryIds, $form)
    {
        $entryIds = (array) $entryIds;

        if (!$form instanceof Form) {
            $form = Form::find($form);
        }

        $fields = FormFieldsParser::getAttachmentInputFields($form, ['element', 'attributes']);

        $attachments = [];

        if ($fields) {
            $fields = Arr::pluck($fields, 'attributes.name');

            $entries = $this->model->whereIn('id', $entryIds)->get();

            foreach ($entries as $entry) {
                $response = json_decode($entry->response, true);

                $files = Arr::collapse(Arr::only($response, $fields));

                $attachments = array_merge($attachments, $files);
            }
        }

        return $attachments;
    }
}

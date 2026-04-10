<?php

namespace FluentForm\App\Services\Compliance;

use FluentForm\App\Models\Form;
use FluentForm\App\Services\FormBuilder\FormFieldsParser;
use FluentForm\App\Services\Submission\SubmissionService;
use FluentForm\Framework\Support\Arr;

class ComplianceService
{
    public function register()
    {
        // Pro already registers its own retention handler on the same cron hook.
        if (defined('FLUENTFORMPRO')) {
            return;
        }

        add_action('fluentform_do_email_report_scheduled_tasks', [$this, 'maybeDeleteOldEntries']);
    }

    public function maybeDeleteOldEntries()
    {
        $autoDeleteFormMetas = wpFluent()->table('fluentform_form_meta')
            ->select(['id', 'form_id', 'value'])
            ->where('meta_key', 'auto_delete_days')
            ->orderBy('id', 'DESC')
            ->get();

        if (!$autoDeleteFormMetas || !count($autoDeleteFormMetas)) {
            return;
        }

        $formGroups = [];
        $processedForms = [];

        foreach ($autoDeleteFormMetas as $meta) {
            $formId = absint($meta->form_id);

            if (!$formId || isset($processedForms[$formId])) {
                continue;
            }

            $processedForms[$formId] = true;
            $delayDays = absint($meta->value);

            if (!$delayDays) {
                continue;
            }

            if (!isset($formGroups[$delayDays])) {
                $formGroups[$delayDays] = [];
            }

            $formGroups[$delayDays][] = $formId;
        }

        if (!$formGroups) {
            return;
        }

        $submissionService = new SubmissionService();

        foreach ($formGroups as $delayDays => $formIds) {
            $formIds = array_filter(array_unique($formIds));

            if (!$formIds) {
                continue;
            }

            // phpcs:ignore WordPress.DateTime.RestrictedFunctions.date_date -- Plugin uses local timezone for scheduled retention
            $date = date('Y-m-d H:i:s', (time() - $delayDays * DAY_IN_SECONDS));

            while (true) {
                $oldEntries = wpFluent()->table('fluentform_submissions')
                    ->select(['id', 'form_id'])
                    ->whereIn('form_id', $formIds)
                    ->where('created_at', '<', $date)
                    ->limit(100)
                    ->get();

                if (!$oldEntries || !count($oldEntries)) {
                    break;
                }

                $entriesByForm = [];

                foreach ($oldEntries as $entry) {
                    $formId = absint($entry->form_id);
                    $entryId = absint($entry->id);

                    if (!$formId || !$entryId) {
                        continue;
                    }

                    if (!isset($entriesByForm[$formId])) {
                        $entriesByForm[$formId] = [];
                    }

                    $entriesByForm[$formId][] = $entryId;
                }

                foreach ($entriesByForm as $formId => $submissionIds) {
                    $attachmentFields = $this->getAttachmentFields($formId);
                    $this->deleteAttachments($submissionIds, $attachmentFields, $formId);
                    $submissionService->deleteEntries($submissionIds, $formId);
                }
            }
        }
    }

    private function getAttachmentFields($formId)
    {
        static $attachmentFields = [];

        if (isset($attachmentFields[$formId])) {
            return $attachmentFields[$formId];
        }

        $form = Form::find($formId);

        if (!$form) {
            $attachmentFields[$formId] = [];
            return $attachmentFields[$formId];
        }

        $fields = FormFieldsParser::getAttachmentInputFields($form, ['element', 'attributes']);
        $attachmentFields[$formId] = $fields ? Arr::pluck($fields, 'attributes.name') : [];

        return $attachmentFields[$formId];
    }

    private function deleteAttachments($submissionIds, $attachmentFields, $formId)
    {
        if (apply_filters('fluentform/disable_attachment_delete', false, $formId)) {
            return;
        }

        $deletables = [];

        if ($attachmentFields) {
            $submissions = wpFluent()->table('fluentform_submissions')
                ->whereIn('id', (array) $submissionIds)
                ->get();

            foreach ($submissions as $submission) {
                $response = json_decode($submission->response, true);
                $files = Arr::collapse(Arr::only($response, $attachmentFields));
                $deletables = array_merge($deletables, $files);
            }
        }

        foreach ($deletables as $file) {
            $file = wp_upload_dir()['basedir'] . FLUENTFORM_UPLOAD_DIR . '/' . basename($file);

            if (is_readable($file) && !is_dir($file)) {
                wp_delete_file($file);
            }
        }

        $tempDir = wp_upload_dir()['basedir'] . FLUENTFORM_UPLOAD_DIR . '/temp/';
        $files = glob($tempDir . '*');
        if (!empty($files)) {
            foreach ($files as $file) {
                if (basename($file) !== 'index.php') {
                    wp_delete_file($file);
                }
            }
        }
    }
}

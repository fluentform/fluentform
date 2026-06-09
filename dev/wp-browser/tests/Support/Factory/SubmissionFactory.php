<?php

namespace Tests\Support\Factory;

use FluentForm\App\Models\Submission;
use FluentForm\App\Models\EntryDetails;

/**
 * Creates a Submission tied to a form, plus one EntryDetails row per field —
 * the same write shape SubmissionHandlerService produces after a real submit.
 */
class SubmissionFactory
{
    /** Process-unique sequence so two submissions in the same second don't collide. */
    private static $seq = 0;

    public function create(int $formId, array $response = [], array $overrides = []): Submission
    {
        if (!$response) {
            $response = ['first_name' => 'Test User'];
        }

        $submission = Submission::query()->create(array_merge([
            'form_id'       => $formId,
            'serial_number' => time() + (++self::$seq),
            'response'      => wp_json_encode($response),
            'source_url'    => 'https://example.com/test',
            'user_id'       => 0,
            'status'        => 'unread',
            'is_favourite'  => 0,
            'browser'       => 'Codeception',
            'device'        => 'cli',
            'ip'            => '127.0.0.1',
        ], $overrides));

        foreach ($response as $fieldName => $fieldValue) {
            EntryDetails::query()->insert([
                'form_id'       => $formId,
                'submission_id' => $submission->id,
                'field_name'    => $fieldName,
                'field_value'   => is_scalar($fieldValue) ? (string) $fieldValue : wp_json_encode($fieldValue),
            ]);
        }

        return $submission;
    }
}

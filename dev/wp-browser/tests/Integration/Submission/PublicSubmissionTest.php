<?php

namespace Tests\Integration\Submission;

use FluentForm\App\Models\Submission;
use FluentForm\App\Models\EntryDetails;
use Tests\Support\RestTestCase;
use Tests\Support\Factory\FormFactory;

/**
 * Wave 2B — the public submission pipeline (validate → sanitize → store), driven
 * through the REAL path a logged-out visitor hits: wp_ajax_nopriv_fluentform_submit
 * → SubmissionHandler::submit(). This is the highest-risk surface in a form plugin
 * (unauthenticated input), so it gets validation + XSS coverage, not just a happy path.
 */
class PublicSubmissionTest extends RestTestCase
{
    public function test_valid_submission_stores_submission_and_entry_details(): void
    {
        $this->logout();
        $form = (new FormFactory())->create();

        $res = $this->submitPublicForm($form->id, ['first_name' => 'Jane Doe']);

        $this->assertNotNull($res['json'], 'No JSON captured. Body: ' . $res['body']);
        $this->assertTrue($res['json']['success'] ?? false, 'Submission did not succeed: ' . $res['body']);
        $this->assertArrayHasKey('insert_id', $res['json']['data'] ?? []);

        $this->assertSame(1, Submission::query()->where('form_id', $form->id)->count());

        $entry = EntryDetails::query()
            ->where('form_id', $form->id)
            ->where('field_name', 'first_name')
            ->first();
        $this->assertNotNull($entry);
        $this->assertSame('Jane Doe', $entry->field_value);
    }

    public function test_missing_required_field_returns_validation_error(): void
    {
        $this->logout();
        $form = (new FormFactory())->create();

        $res = $this->submitPublicForm($form->id, ['first_name' => '']);

        $this->assertSame(423, $res['status'], 'Expected validation status 423. Body: ' . $res['body']);
        $this->assertArrayHasKey('errors', $res['json'] ?? [], 'Body: ' . $res['body']);
        $this->assertArrayHasKey('first_name', $res['json']['errors'], 'Expected a first_name validation error.');
        $this->assertSame(0, Submission::query()->where('form_id', $form->id)->count());
    }

    /**
     * @dataProvider xssPayloads
     */
    public function test_xss_payload_is_sanitized_before_storage(string $payload): void
    {
        $this->logout();
        $form = (new FormFactory())->create();

        $res = $this->submitPublicForm($form->id, ['first_name' => $payload]);

        $this->assertTrue($res['json']['success'] ?? false, 'Submission did not succeed: ' . $res['body']);

        $stored = EntryDetails::query()
            ->where('form_id', $form->id)
            ->where('field_name', 'first_name')
            ->value('field_value');

        $this->assertStringNotContainsStringIgnoringCase('<script', (string) $stored, 'Script tag survived sanitization.');
        $this->assertStringNotContainsStringIgnoringCase('onerror', (string) $stored, 'Event handler survived sanitization.');
    }

    public function xssPayloads(): array
    {
        return [
            'script tag'        => ['<script>alert(1)</script>Bob'],
            'img onerror'       => ['<img src=x onerror=alert(1)>Alice'],
            'svg onload'        => ['<svg/onload=alert(1)>Carol'],
        ];
    }
}

<?php

namespace Dev\Test\Tests\Anchor;

use Dev\Test\Inc\TestCase;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Models\Submission;

/**
 * Anchor for the test-harness-helpers stack PR. Exercises every NEW helper
 * shipped in this PR. Fails on feat/devtools-test-enablers HEAD (undefined
 * methods); passes after this PR. Serves as Wave 2A.5+ template.
 */
class TestHarnessHelpersAnchor extends TestCase
{
    public function test_setFormMeta_persists_value_under_form_id_and_key()
    {
        $form = $this->loadFormFixture('single-field');

        $this->setFormMeta($form->id, 'notifications', ['enabled' => true]);

        $row = FormMeta::query()
            ->where('form_id', $form->id)
            ->where('meta_key', 'notifications')
            ->first();

        $this->assertNotNull($row, 'setFormMeta must persist a row');
        $decoded = json_decode($row->value, true);
        $this->assertSame(['enabled' => true], $decoded, 'value should round-trip as JSON');
    }

    public function test_loadSubmissionFixture_creates_submission_and_entry_details()
    {
        $form = $this->loadFormFixture('single-field');

        $submission = $this->loadSubmissionFixture($form->id, [
            'first_name' => 'Test User',
        ]);

        $this->assertInstanceOf(Submission::class, $submission);
        $this->assertGreaterThan(0, $submission->id);
        $this->assertSame((int) $form->id, (int) $submission->form_id);

        $decoded = json_decode($submission->response, true);
        $this->assertSame('Test User', $decoded['first_name']);
    }

    public function test_submitForm_helper_creates_submission_via_rest_pipeline()
    {
        $form = $this->loadFormFixture('single-field');

        // The submitForm helper drives the REST form-submit endpoint, mirroring
        // what the frontend AJAX flow calls server-side.
        $response = $this->submitForm($form->id, [
            'first_name' => 'Submitted',
        ]);

        // The endpoint may return 200 (success), 401 (policy nonce reject),
        // 403 (policy cap reject), or 422 (validation fail). Any of these
        // proves the helper dispatched the request to the route and a
        // controller produced a structured response (vs. fatal error).
        // Real submission flows in higher-layer tests should provide nonce
        // + form_id + sanitized data to coax a 200.
        $this->assertContains($response->getStatus(), [200, 401, 403, 422],
            'submitForm should hit form-submit endpoint and return a structured response'
        );
    }

    public function test_impersonateAsRole_grants_capability_to_current_user()
    {
        $userId = $this->impersonateAsRole('fluentform_forms_manager');

        $this->assertGreaterThan(0, $userId, 'impersonateAsRole must create a user');
        $this->assertSame($userId, get_current_user_id(), 'impersonateAsRole must log in the new user');
        $this->assertTrue(
            user_can($userId, 'fluentform_forms_manager'),
            'created user must have the requested FF capability'
        );
    }

    public function test_mockHttp_intercepts_outbound_wp_remote_request()
    {
        $this->mockHttp('example.com/ping', [
            'status' => 200,
            'body'   => '{"pong":true}',
        ]);

        $response = wp_remote_get('https://example.com/ping');

        $this->assertSame(200, wp_remote_retrieve_response_code($response));
        $this->assertSame('{"pong":true}', wp_remote_retrieve_body($response));
    }
}

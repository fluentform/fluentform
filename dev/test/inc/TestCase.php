<?php

namespace Dev\Test\Inc;

use WP_REST_Server;
use FluentForm\App\Models\Form;
use FluentForm\App\Models\FormMeta;
use FluentForm\App\Models\Submission;
use FluentForm\App\Models\EntryDetails;
use PHPUnit_Framework_TestCase;

class TestCase extends PHPUnit_Framework_TestCase
{
	use Concerns;
	use RefreshDatabase {
	    RefreshDatabase::setUp as refreshDatabaseSetup;
	    RefreshDatabase::tearDown as refreshDatabaseTearDown;
	}

	protected $plugin = null;

	protected $server = null;

	protected $factory = null;

	public function setUp() : void
	{
		global $wp_rest_server;

        $this->server = $wp_rest_server = new WP_REST_Server;

        $this->plugin = wpFluentForm();

        $this->factory = new Factory;

        App::make('config')->set('app.env', 'testing');

        $this->refreshDatabaseSetup();

        do_action('rest_api_init');
	}

	public function tearDown() : void
	{
		global $wp_rest_server;

        $wp_rest_server = null;

		// Remove every pre_http_request filter installed via mockHttp() so
		// mocks don't leak into the next test.
		$this->clearMockedHttp();

		$this->refreshDatabaseTearDown();
	}

	/**
	 * Load a JSON form fixture from dev/test/fixtures/forms/<name>.json,
	 * persist it as a published form, and return the Form model.
	 *
	 * Fixtures are committed snapshots — use them when the test needs a
	 * realistic, repeatable form shape (multi-step, conditional, payment).
	 * Use factories when the test cares about generated variation instead.
	 */
	protected function loadFormFixture($name)
	{
		$path = realpath(__DIR__ . '/../fixtures/forms/' . $name . '.json');

		if (!$path || !is_readable($path)) {
			throw new \RuntimeException("Form fixture not found: {$name}.json");
		}

		$json = file_get_contents($path);
		$decoded = json_decode($json, true);

		if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
			throw new \RuntimeException(
				"Form fixture {$name}.json is not valid JSON: " . json_last_error_msg()
			);
		}

		if (!is_array($decoded)) {
			throw new \RuntimeException(
				"Form fixture {$name}.json must decode to a JSON object, got " . gettype($decoded)
			);
		}

		$form = Form::query()->create([
			'title'       => $name,
			'status'      => 'published',
			'has_payment' => 0,
			'type'        => 'form',
			'form_fields' => $json,
			'conditions'  => '',
			'appearance_settings' => '',
		]);

		// Mirror production: Updater::store / Form::update inspect the
		// parsed fields and set forms.has_payment from
		// FormFieldsParser::hasPaymentFields. Without this, payment fixtures
		// would persist with has_payment=0 and tests would silently bypass
		// payment-gated branches in production code paths.
		if ($this->fixtureHasPaymentField($json)) {
			Form::query()->where('id', $form->id)->update(['has_payment' => 1]);
			$form->has_payment = 1;
		}

		return $form;
	}

	/**
	 * Scan a fixture's form_fields JSON for any payment-input element.
	 *
	 * We can't rely on FormFieldsParser::hasPaymentFields() in tests because
	 * payment components only register their element keys with the
	 * `fluentform/form_input_types` filter when PaymentHandler->init() runs
	 * AND `isEnabled()` returns true — and the test DB starts with the
	 * payment module disabled. A direct JSON scan is deterministic and
	 * doesn't depend on which modules happen to be wired in the test env.
	 *
	 * Element list is sourced from app/Services/Parser/Form.php
	 * (hasPaymentFields). Keep in sync if production adds a new payment field.
	 */
	private function fixtureHasPaymentField($json)
	{
		$paymentElements = [
			'custom_payment_component',
			'multi_payment_component',
			'payment_method',
			'item_quantity_component',
			'payment_coupon',
			'subscription_payment_component',
		];

		foreach ($paymentElements as $element) {
			if (strpos($json, '"element":"' . $element . '"') !== false
				|| strpos($json, '"element": "' . $element . '"') !== false) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Upsert a row in fluentform_form_meta. Arrays/objects are JSON-encoded
	 * automatically so tests don't need to remember the serialization rule.
	 *
	 * Upsert semantics mirror FormMeta::persist() (the production write
	 * path) — calling setFormMeta() twice with the same (form_id, key)
	 * REPLACES the previous value instead of creating duplicate rows.
	 *
	 * FluentForm's form_meta is multi-purpose (notifications, integrations,
	 * settings, is_conversion_form flag, etc.) — this helper hides the
	 * meta_key+value pattern that every meta-write would otherwise re-implement.
	 */
	protected function setFormMeta($formId, $key, $value)
	{
		if (is_array($value) || is_object($value)) {
			$value = wp_json_encode($value);
		}

		$existing = FormMeta::query()
			->where('form_id', (int) $formId)
			->where('meta_key', $key)
			->first();

		if ($existing) {
			return FormMeta::query()
				->where('id', $existing->id)
				->update(['value' => (string) $value]);
		}

		return FormMeta::query()->insert([
			'form_id'  => (int) $formId,
			'meta_key' => $key,
			'value'    => (string) $value,
		]);
	}

	/**
	 * Insert a Submission row with optional EntryDetails per-field rows.
	 * Mirrors what SubmissionHandlerService writes after a real submission:
	 *   - JSON-encoded response on the submission row
	 *   - One entry_details row per field for queryable lookups
	 *
	 * Returns the Submission model.
	 */
	protected function loadSubmissionFixture($formId, array $response = [])
	{
		$submission = Submission::query()->create([
			'form_id'         => (int) $formId,
			'serial_number'   => time(),
			'response'        => wp_json_encode($response),
			'source_url'      => 'https://example.com/test',
			'user_id'         => 0,
			'status'          => 'unread',
			'is_favourite'    => 0,
			'browser'         => 'PHPUnit',
			'device'          => 'cli',
			'ip'              => '127.0.0.1',
		]);

		foreach ($response as $fieldName => $fieldValue) {
			EntryDetails::query()->insert([
				'form_id'       => (int) $formId,
				'submission_id' => $submission->id,
				'field_name'    => $fieldName,
				'field_value'   => is_scalar($fieldValue) ? (string) $fieldValue : wp_json_encode($fieldValue),
			]);
		}

		return $submission;
	}
}

<?php

namespace Dev\Test\Inc;

use WP_REST_Server;
use FluentForm\App\Models\Form;
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

		return Form::query()->create([
			'title'       => $name,
			'status'      => 'published',
			'has_payment' => 0,
			'type'        => 'form',
			'form_fields' => $json,
			'conditions'  => '',
			'appearance_settings' => '',
		]);
	}
}

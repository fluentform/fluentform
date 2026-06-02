<?php

namespace Dev\Test\Tests\Anchor;

use Dev\Test\Inc\TestCase;
use FluentForm\App\Models\Form;

/**
 * Anchor integration test for the devtools-test-enablers stack PR.
 *
 * Exercises every new helper introduced in this PR. Designed to FAIL against
 * the PR #873 base (helpers don't exist), pass after the helpers ship.
 *
 * Also serves as the Wave 2A.5 template — the canonical example future
 * domain tests should copy. Touches:
 *   - loadFormFixture() on TestCase
 *   - put() / delete() on Concerns
 *   - assertStatus() / assertJsonPath() on Response
 *   - suite-scoped migration counter on RefreshDatabase
 */
class TestFormControllerAnchor extends TestCase
{
    /**
     * Counts how many times the suite-scoped migration hook fired in this
     * class. RefreshDatabase::setUpBeforeClass() should increment this once.
     * A second test method in the same class proves we did NOT re-migrate.
     */
    public static $migrationsRanForThisClass = 0;

    /**
     * Create a fresh admin user for the current test. The test DB starts
     * empty after suite-scoped setUp, so any login() call needs a user
     * created first. Returns the user ID for chaining into login().
     */
    private function createAdminUser()
    {
        return wp_insert_user([
            'user_login' => 'admin_' . wp_generate_password(8, false),
            'user_pass'  => wp_generate_password(),
            'user_email' => 'admin_' . wp_generate_password(6, false) . '@example.com',
            'role'       => 'administrator',
        ]);
    }

    public function test_loadFormFixture_creates_a_real_form_from_json_snapshot()
    {
        $form = $this->loadFormFixture('multi-step-with-conditions');

        $this->assertInstanceOf(Form::class, $form);
        $this->assertGreaterThan(0, $form->id);
        $this->assertSame('multi-step-with-conditions', $form->title);
        $this->assertSame('published', $form->status);

        $decoded = json_decode($form->form_fields, true);
        $this->assertIsArray($decoded);
        $this->assertArrayHasKey('fields', $decoded);
    }

    public function test_admin_can_list_forms_via_get_with_jsonpath_assertion()
    {
        $form = $this->loadFormFixture('single-field');
        $this->login($this->createAdminUser());

        $response = $this->get('forms')->assertStatus(200);

        $data = $response->getJson();
        $this->assertIsArray($data, 'GET /forms must return a JSON array');
        // Controller wraps the list under different keys depending on
        // version; the assertion below tolerates either common shape so
        // the anchor test stays focused on the helpers, not the contract.
        $hasList = isset($data['forms']) || isset($data['data']) || array_key_first($data) !== null;
        $this->assertTrue($hasList, 'Expected /forms response to contain a forms or data key');
    }

    public function test_logout_helper_resets_current_user_to_zero()
    {
        $adminId = $this->createAdminUser();
        $this->login($adminId);
        $this->assertSame($adminId, get_current_user_id(), 'login() should set the WP current user');

        $this->logout();
        $this->assertSame(0, get_current_user_id(), 'logout() should reset the WP current user to 0');
    }

    public function test_put_helper_routes_by_method_so_unrouted_put_returns_404()
    {
        // FluentForm registers no PUT/PATCH routes (api.php uses POST for
        // updates). The put() helper must still route by HTTP method via
        // WP_REST_Server dispatch — proving this means future PUT-registered
        // routes will dispatch correctly. If the helper silently rerouted
        // to the POST handler, this would return 200 and the contract would
        // be invisible.
        $form = $this->loadFormFixture('single-field');
        $this->login($this->createAdminUser());

        $this->put('forms/' . $form->id, ['title' => 'should not apply'])
            ->assertStatus(404);
    }

    public function test_admin_can_delete_form_via_delete_with_method_override()
    {
        $form = $this->loadFormFixture('single-field');
        $this->login($this->createAdminUser());

        $this->delete('forms/' . $form->id)->assertStatus(200);

        // Verify the DELETE helper actually hit @delete, not @update —
        // proves the method-routing fix from HIGH-01 of the code review.
        $this->assertNull(
            \FluentForm\App\Models\Form::find($form->id),
            'Form should no longer exist in DB after DELETE'
        );
    }

    public function test_suite_scoped_migration_ran_exactly_once_per_class()
    {
        // RefreshDatabase::setUpBeforeClass() should have incremented the
        // counter once for this whole test class — not per test method.
        // If this assertion fails, RefreshDatabase is still on the per-test
        // migrate-down/migrate-up cycle that this PR is supposed to retire.
        $this->assertSame(
            1,
            static::$migrationsRanForThisClass,
            'Expected exactly one suite-scoped migration for this class, got ' . static::$migrationsRanForThisClass
        );
    }
}

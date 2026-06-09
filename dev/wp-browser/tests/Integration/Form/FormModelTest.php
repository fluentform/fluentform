<?php

namespace Tests\Integration\Form;

use FluentForm\App\Models\Form;
use Tests\Support\RestTestCase;
use Tests\Support\Factory\FormFactory;

/**
 * Example Integration test: factory → persisted model → REST list round-trip.
 * Demonstrates the FormFactory and the RestTestCase request helpers.
 */
class FormModelTest extends RestTestCase
{
    public function test_factory_persists_a_published_form(): void
    {
        $form = (new FormFactory())->create(['title' => 'Contact Us']);

        $this->assertNotEmpty($form->id);

        $stored = Form::query()->find($form->id);
        $this->assertSame('Contact Us', $stored->title);
        $this->assertSame('published', $stored->status);
    }

    public function test_admin_sees_created_form_in_rest_list(): void
    {
        $this->loginAsAdmin();
        (new FormFactory())->create(['title' => 'Listed Form']);

        [$status, $body] = $this->get('forms');

        $this->assertOk($status);
        $this->assertStringContainsString('Listed Form', wp_json_encode($body));
    }
}

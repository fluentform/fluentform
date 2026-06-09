<?php

namespace Tests\Functional\Rest;

use Tests\Support\FunctionalTester;
use Tests\Support\Factory\FormFactory;

/**
 * Example Functional Cest: the FormPolicy-gated forms list, exercised as an
 * admin (allowed) and as a guest (blocked). Shows the $I->... REST + auth DSL.
 */
class FormsRestCest
{
    public function _before(FunctionalTester $I): void
    {
        $I->resetFluentFormTables();
    }

    public function adminCanListForms(FunctionalTester $I): void
    {
        $I->loginAsAdmin();
        (new FormFactory())->create(['title' => 'Cest Form']);

        [$status, $body] = $I->get('forms');

        $I->assertSame(200, $status);
        $I->assertStringContainsString('Cest Form', wp_json_encode($body));
    }

    public function guestCannotListForms(FunctionalTester $I): void
    {
        $I->logout();

        [$status] = $I->get('forms');

        $I->assertContains($status, [401, 403]);
    }
}

<?php

namespace Tests\Acceptance\Form;

use Tests\Support\AcceptanceTester;

/**
 * Example Acceptance (real-browser) test of the public form submission flow.
 *
 * Requires a served WordPress site (WORDPRESS_URL) with FluentForm active and a
 * running chromedriver. It places a page carrying the [fluentform] shortcode for
 * the form id under FORM_ID, then drives the rendered form like a visitor.
 *
 * The form must already exist (create it once via the admin or a seeder). Set
 * FORM_ID to its id. This is the one test layer PHPUnit cannot cover: it runs
 * the real PHP-rendered HTML + jQuery submission in Chrome.
 */
class PublicFormSubmissionCest
{
    private const FORM_ID = 1;

    public function _before(AcceptanceTester $I): void
    {
        $I->havePageInDatabase([
            'post_name'    => 'ff-acceptance-form',
            'post_title'   => 'FF Acceptance Form',
            'post_status'  => 'publish',
            'post_content' => '[fluentform id="' . self::FORM_ID . '"]',
        ]);
    }

    public function visitorCanSubmitForm(AcceptanceTester $I): void
    {
        $I->amOnPage('/ff-acceptance-form/');
        $I->waitForElement('.fluentform', 10);
        $I->fillField('input[name="first_name"]', 'Jane Tester');
        $I->click('.ff-btn-submit');
        $I->waitForText('Thank you', 15, '.ff-message-success, .ff_submit_success');
    }
}

<?php

namespace Dev\Test\Tests\Conversational;

use Dev\Test\Inc\TestCase;
use FluentForm\App\Helpers\Helper;
use FluentForm\App\Models\FormMeta;

/**
 * Conversational bridge anchor — proves the FluentConversational service is
 * loaded and wired into free's hook surface. Unlike pro-test-bridge, no env
 * flag is needed: boot/app.php:85 calls (new FluentConversational)->boot()
 * unconditionally on every plugin load.
 *
 * If any of these assertions fails, the conversational layer is broken
 * before any conversion or rendering can happen.
 */
class TestConversationalBridgeAnchor extends TestCase
{
    public function test_converter_class_is_autoloaded()
    {
        $this->assertTrue(
            class_exists('FluentForm\\App\\Services\\FluentConversational\\Classes\\Converter\\Converter'),
            'Conversational Converter class must autoload via boot/app.php:82 require'
        );
    }

    public function test_form_boot_registered_design_tab_filter()
    {
        // Form::boot() registers add_filter('fluentform/form_admin_menu', [$this, 'pushDesignTab'], 10, 2)
        // — proves boot() actually ran during free's bootstrap.
        $this->assertGreaterThan(
            0,
            has_filter('fluentform/form_admin_menu'),
            'Conversational Form::boot must register the form_admin_menu filter for the Design tab'
        );
    }

    public function test_helper_isConversionForm_recognizes_meta_flag()
    {
        // Use a fresh fixture-loaded form so the static cache inside
        // Helper::isConversionForm doesn't poison across tests.
        $form = $this->loadFormFixture('single-field');

        // Without the meta flag: returns false.
        $this->assertFalse(
            Helper::isConversionForm($form->id),
            'A form with no is_conversion_form meta must not be detected as conversational'
        );

        // Set the flag via FormMeta and create a SECOND form so the static
        // cache inside isConversionForm doesn't return the false result.
        $form2 = $this->loadFormFixture('single-field');
        $this->assertNotSame(
            $form->id,
            $form2->id,
            'Cache-bypass precondition: the two fixture forms must have distinct IDs'
        );
        FormMeta::query()->insert([
            'form_id'  => $form2->id,
            'meta_key' => 'is_conversion_form',
            'value'    => 'yes',
        ]);

        $this->assertTrue(
            Helper::isConversionForm($form2->id),
            'A form with is_conversion_form=yes meta must be detected as conversational'
        );
    }
}

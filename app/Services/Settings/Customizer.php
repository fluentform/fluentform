<?php

namespace FluentForm\App\Services\Settings;

use Exception;
use FluentForm\App\Models\FormMeta;
use FluentForm\Framework\Support\Arr;

class Customizer
{
    public function get($formId)
    {
        $customizer = FormMeta::where('form_id', $formId)
            ->whereIn('meta_key', ['_custom_form_css', '_custom_form_js'])
            ->get()
            ->keyBy(function ($item) {
                return '_custom_form_css' === $item->meta_key ? 'css' : 'js';
            })
            ->transform(function ($item) {
                return $item->value;
            })->toArray();

        return [
            'css' => Arr::get($customizer, 'css'),
            'js'  => Arr::get($customizer, 'js'),
        ];
    }

    public function store($attributes = [])
    {
        if (!fluentformCanUnfilteredHTML()) {
            throw new Exception(
                __('You need unfiltered_html permission to save Custom CSS & JS', 'fluentform')
            );
        }

        $formId = absint(Arr::get($attributes, 'form_id'));

        $css = fluentformSanitizeCSS(Arr::get($attributes, 'css'));
        $js = fluentform_kses_js(Arr::get($attributes, 'js'));

        FormMeta::persist($formId, '_custom_form_css', $css);
        FormMeta::persist($formId, '_custom_form_js', $js);
    }
}

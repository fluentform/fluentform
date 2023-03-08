<?php

namespace FluentForm\App\Services\Report;

use Exception;
use FluentForm\App\Models\Form;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;


class ReportService
{
    /**
     * @param array $attr
     * @return array|mixed $response
     * @throws Exception
     */
    public function formReport($attr = [])
    {
        $formId = intval(Arr::get($attr, 'form_id'));
        ReportHelper::maybeMigrateData($formId);
        try {
            $form = Form::findOrFail($formId);
        } catch (Exception $e) {
            throw new Exception("The form couldn't be found.");
        }
        $statuses = Arr::get($attr, 'statuses', []);
        return ReportHelper::generateReport($form, $statuses);
    }


}

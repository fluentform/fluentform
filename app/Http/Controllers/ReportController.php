<?php

namespace FluentForm\App\Http\Controllers;

use Exception;
use FluentForm\App\Services\Report\ReportService;

class ReportController extends Controller
{
    public function formReport(ReportService $reportService)
    {
        try {
            return $this->sendSuccess(
                $reportService->formReport($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }
}

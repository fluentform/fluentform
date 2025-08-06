<?php

namespace FluentForm\App\Http\Controllers;

use Exception;
use FluentForm\App\Services\Report\ReportService;

class ReportController extends Controller
{
    public function form(ReportService $reportService)
    {
        try {
            return $this->sendSuccess(
                $reportService->form($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get Submission Report
     * @return \WP_REST_Response
     */
    public function submissions(ReportService $reportService)
    {
        try {
            return $this->sendSuccess(
                $reportService->submissions($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get Reports Data
     * @return \WP_REST_Response
     */
    public function getReports(ReportService $reportService)
    {
        try {
            return $this->sendSuccess(
                $reportService->getReports($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get Forms for Dropdown
     * @return \WP_REST_Response
     */
    public function getFormsDropdown(ReportService $reportService)
    {
        try {
            return $this->sendSuccess(
                $reportService->getFormsDropdown()
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get payment revenue grouped by different criteria
     * @return \WP_REST_Response
     */
    public function netRevenue(ReportService $reportService)
    {
        try {
            return $this->sendSuccess(
                $reportService->netRevenue($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get submission analysis grouped by different criteria
     * @return \WP_REST_Response
     */
    public function submissionsAnalysis(ReportService $reportService)
    {
        try {
            return $this->sendSuccess(
                $reportService->submissionsAnalysis($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }
}

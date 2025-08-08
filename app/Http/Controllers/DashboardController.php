<?php

namespace FluentForm\App\Http\Controllers;

use Exception;
use FluentForm\App\Services\Dashboard\DashboardService;

class DashboardController extends Controller
{
    /**
     * Get Dashboard Data
     * @return \WP_REST_Response
     */
    public function getDashboard(DashboardService $dashboardService)
    {
        try {
            return $this->sendSuccess(
                $dashboardService->getDashboard($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get Dashboard Stats
     * @return \WP_REST_Response
     */
    public function getStats(DashboardService $dashboardService)
    {
        try {
            return $this->sendSuccess(
                $dashboardService->getStats($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get Latest Entries
     * @return \WP_REST_Response
     */
    public function getLatestEntries(DashboardService $dashboardService)
    {
        try {
            return $this->sendSuccess(
                $dashboardService->getLatestEntries($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get API Logs
     * @return \WP_REST_Response
     */
    public function getApiLogs(DashboardService $dashboardService)
    {
        try {
            return $this->sendSuccess(
                $dashboardService->getApiLogs($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get Notifications
     * @return \WP_REST_Response
     */
    public function getNotifications(DashboardService $dashboardService)
    {
        try {
            return $this->sendSuccess(
                $dashboardService->getNotifications($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get Chart Data
     * @return \WP_REST_Response
     */
    public function getChartData(DashboardService $dashboardService)
    {
        try {
            return $this->sendSuccess(
                $dashboardService->getChartData($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }
}

<?php

namespace FluentForm\App\Http\Policies;

use FluentForm\App\Modules\Acl\Acl;
use FluentForm\Framework\Request\Request;
use FluentForm\Framework\Foundation\Policy;

class DashboardPolicy extends Policy
{
    /**
     * Check permission for any method
     *
     * @param  \FluentForm\Framework\Request\Request $request
     * @return bool
     */
    public function verifyRequest(Request $request)
    {
        return Acl::hasPermission('fluentform_dashboard_access');
    }

    /**
     * Check permission for dashboard stats
     *
     * @param  \FluentForm\Framework\Request\Request $request
     * @return bool
     */
    public function getStats(Request $request)
    {
        return Acl::hasPermission('fluentform_dashboard_access');
    }

    /**
     * Check permission for latest entries
     *
     * @param  \FluentForm\Framework\Request\Request $request
     * @return bool
     */
    public function getLatestEntries(Request $request)
    {
        return Acl::hasPermission('fluentform_entries_viewer');
    }

    /**
     * Check permission for API logs
     *
     * @param  \FluentForm\Framework\Request\Request $request
     * @return bool
     */
    public function getApiLogs(Request $request)
    {
        return Acl::hasPermission('fluentform_entries_viewer');
    }

    /**
     * Check permission for notifications
     *
     * @param  \FluentForm\Framework\Request\Request $request
     * @return bool
     */
    public function getNotifications(Request $request)
    {
        return Acl::hasPermission('fluentform_dashboard_access');
    }

    /**
     * Check permission for chart data
     *
     * @param  \FluentForm\Framework\Request\Request $request
     * @return bool
     */
    public function getChartData(Request $request)
    {
        return Acl::hasPermission('fluentform_dashboard_access');
    }
}

<?php

namespace FluentForm\App\Http\Policies;

use FluentForm\App\Modules\Acl\Acl;
use FluentForm\Framework\Http\Request\Request;
use FluentForm\Framework\Foundation\Policy;

class ReportPolicy extends Policy
{
    private function canAccessRequestedForm(Request $request)
    {
        $formId = intval($request->get('form_id'));

        return Acl::hasPermission('fluentform_entries_viewer', $formId);
    }

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

    public function form(Request $request)
    {
        return $this->canAccessRequestedForm($request);
    }

    public function submissions(Request $request)
    {
        return $this->canAccessRequestedForm($request);
    }

    public function getOverviewChart(Request $request)
    {
        return $this->canAccessRequestedForm($request);
    }

    public function getRevenueChart(Request $request)
    {
        return $this->canAccessRequestedForm($request);
    }

    public function getFormStats(Request $request)
    {
        return $this->canAccessRequestedForm($request);
    }

    public function getApiLogs(Request $request)
    {
        return $this->canAccessRequestedForm($request);
    }

    public function getPaymentTypes(Request $request)
    {
        return $this->canAccessRequestedForm($request);
    }
}

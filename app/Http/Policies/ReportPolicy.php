<?php

namespace FluentForm\App\Http\Policies;

use FluentForm\App\Modules\Acl\Acl;
use FluentForm\Framework\Http\Request\Request;
use FluentForm\Framework\Foundation\Policy;
use FluentForm\Framework\Support\Arr;

class ReportPolicy extends Policy
{
    private function canAccessRequestedForm(Request $request)
    {
        $formId = $this->resolveFormId($request);

        return $formId && Acl::hasPermission('fluentform_entries_viewer', $formId);
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

    private function resolveFormId(Request $request)
    {
        $route = $request->route();
        $routeFormId = $route ? Arr::get($route->getParameter(), 'form_id') : null;
        $routeFormId = Acl::normalizeFormId($routeFormId);

        if ($routeFormId) {
            return $routeFormId;
        }

        return Acl::normalizeFormId($request->get('form_id'));
    }
}

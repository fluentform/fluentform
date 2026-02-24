<?php

namespace FluentForm\App\Modules\Entries;

use FluentForm\App\Services\Transfer\TransferService;
use FluentForm\Framework\Foundation\Application;

/**
 * @deprecated Use TransferService::exportEntries() instead.
 * @todo Remove in next major version.
 */
class Export
{
    protected $app;
    protected $request;
    protected $tableName;

    public function __construct(Application $application, $tableName = 'fluentform_submissions')
    {
        _deprecated_function(__CLASS__, '5.3', 'TransferService::exportEntries()');
        $this->app = $application;
        $this->request = $application->request;
        $this->tableName = $tableName;
    }

    /**
     * @deprecated Use TransferService::exportEntries() instead.
     */
    public function index()
    {
        _deprecated_function(__METHOD__, '5.3', 'TransferService::exportEntries()');

        $args = $this->request->get();

        if ($this->tableName !== 'fluentform_submissions') {
            $args['table'] = $this->tableName;
        }

        TransferService::exportEntries($args);
    }
}

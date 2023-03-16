<?php

namespace FluentForm\App\Http\Controllers;

use Exception;
use FluentForm\App\Services\Form\FormService;

class TransferController extends Controller
{
    /**
     * Export forms as JSON.
     */
    public function export(FormService $formService)
    {
        try {
            $formIds = $this->request->get('forms');
            return $formService->export($formIds);
        } catch (Exception $exception) {
            return $this->sendError([
                'message' => $exception->getMessage(),
            ]);
        }
    }
    
    /**
     * Import forms from a previously exported JSON file.
     */
    public function import(FormService $formService)
    {
        try {
            $file = $this->request->file('file');
            return $this->sendSuccess($formService->import($file), 200);
        } catch (Exception $exception) {
            return $this->sendError([
                'message' => $exception->getMessage(),
            ], 403);
        }
    }
}

<?php

namespace FluentForm\App\Http\Controllers;

use Exception;
use FluentForm\App\Services\Entry\EntryService;

class EntryController extends Controller
{
    public function index(EntryService $entryService)
    {
        try {
            return $this->sendSuccess(
                $entryService->get($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function resources(EntryService $entryService)
    {
        try {
            return $this->sendSuccess(
                $entryService->resources($this->request->get('form_id'))
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function updateStatus(EntryService $entryService)
    {
        try {
            $status = $entryService->updateStatus($this->request->all());

            return $this->sendSuccess([
                'message' => __('The entry has been marked as ' . $status, 'fluentform'),
                'status'  => $status,
            ]);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function toggleIsFavorite(EntryService $entryService)
    {
        try {
            [$message, $isFavourite] = $entryService->toggleIsFavorite($this->request->all());

            return $this->sendSuccess([
                'message'      => $message,
                'is_favourite' => $isFavourite,
            ]);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function handleBulkActions(EntryService $entryService)
    {
        try {
            $message = $entryService->handleBulkActions($this->request->all());

            return $this->sendSuccess(['message' => $message]);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }
}

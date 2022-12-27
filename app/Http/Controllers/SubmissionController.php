<?php

namespace FluentForm\App\Http\Controllers;

use Exception;
use FluentForm\App\Models\Submission;
use FluentForm\App\Services\Submission\SubmissionService;

class SubmissionController extends Controller
{
    public function index(SubmissionService $submissionService)
    {
        try {
            return $this->sendSuccess(
                $submissionService->get($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function find(SubmissionService $submissionService, $submissionId)
    {
        try {
            return $this->sendSuccess(
                $submissionService->find($submissionId)
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function resources(SubmissionService $submissionService)
    {
        try {
            return $this->sendSuccess(
                $submissionService->resources($this->request->all())
            );
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function updateStatus(SubmissionService $submissionService)
    {
        try {
            $status = $submissionService->updateStatus($this->request->all());

            return $this->sendSuccess([
                'message' => __('The submission has been marked as ' . $status, 'fluentform'),
                'status'  => $status,
            ]);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }

    public function toggleIsFavorite(SubmissionService $submissionService)
    {
        try {
            [$message, $isFavourite] = $submissionService->toggleIsFavorite(
                $this->request->get('entry_id')
            );

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

    public function handleBulkActions(SubmissionService $submissionService)
    {
        try {
            $message = $submissionService->handleBulkActions($this->request->all());

            return $this->sendSuccess(['message' => $message]);
        } catch (Exception $e) {
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }
    
    public function remove(Submission $submission, $submissionId)
    {
        try {
            $submission::remove([$submissionId]);
            return $this->sendSuccess([
                'message' => __('Selected submission successfully deleted Permanently', 'fluentform'),
            ]);
    
        } catch (Exception $e){
            return $this->sendError([
                'message' => $e->getMessage(),
            ]);
        }
    }
}

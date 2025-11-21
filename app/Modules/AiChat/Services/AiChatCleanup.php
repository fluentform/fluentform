<?php

namespace FluentForm\App\Modules\AiChat\Services;

use FluentForm\App\Models\Submission;
use FluentForm\App\Models\SubmissionMeta;
use FluentForm\App\Models\EntryDetails;
use FluentForm\Framework\Helpers\ArrayHelper as Arr;

/**
 * AI Chat Cleanup Service
 * 
 * Handles cleanup of orphaned and incomplete AI chat submissions
 */
class AiChatCleanup
{
    /**
     * Clean up incomplete AI chat submissions
     * 
     * Removes submissions that:
     * - Are from AI chat (have ai_chat_session meta)
     * - Are incomplete (status = 'unread' or 'read')
     * - Are older than the specified hours
     * 
     * @param int $olderThanHours Delete submissions older than this many hours (default: 24)
     * @return array Cleanup statistics
     */
    public function cleanupIncompleteSubmissions($olderThanHours = 24)
    {
        $stats = [
            'submissions_deleted' => 0,
            'messages_deleted' => 0,
            'meta_deleted' => 0,
        ];

        // Calculate cutoff time
        $cutoffTime = date('Y-m-d H:i:s', strtotime("-{$olderThanHours} hours"));

        // Find incomplete AI chat submissions using Eloquent
        // Note: SubmissionMeta uses 'response_id' as foreign key, not 'submission_id'
        $incompleteSubmissions = Submission::whereHas('submissionMeta', function ($query) {
            $query->where('meta_key', 'ai_chat_session');
        })
        ->whereIn('status', ['unread', 'read'])
        ->where('created_at', '<', $cutoffTime)
        ->get(['id', 'form_id', 'created_at']);

        if ($incompleteSubmissions->isEmpty()) {
            return $stats;
        }

        foreach ($incompleteSubmissions as $submission) {
            $deleted = $this->deleteSubmissionWithChatData($submission->id, $submission->form_id);

            if ($deleted) {
                $stats['submissions_deleted']++;
                $stats['messages_deleted'] += $deleted['messages'];
                $stats['meta_deleted'] += $deleted['meta'];
            }
        }

        return $stats;
    }
    
    /**
     * Delete a submission and all its AI chat data
     *
     * @param int $submissionId Submission ID
     * @param int $formId Form ID
     * @return array|false Deletion statistics or false on failure
     */
    public function deleteSubmissionWithChatData($submissionId, $formId)
    {
        $stats = [
            'messages' => 0,
            'meta' => 0,
        ];

        // Delete conversation messages using Eloquent
        // Note: SubmissionMeta uses 'response_id' as foreign key
        $messagesDeleted = SubmissionMeta::where('response_id', $submissionId)
            ->where('meta_key', 'ai_chat_message')
            ->delete();

        if ($messagesDeleted !== false) {
            $stats['messages'] = $messagesDeleted;
        }

        // Delete all AI chat related meta
        $aiChatMetaKeys = [
            'ai_chat_session',
            'ai_chat_field_mapping',
            'ai_chat_completed',
        ];

        foreach ($aiChatMetaKeys as $metaKey) {
            $deleted = SubmissionMeta::where('response_id', $submissionId)
                ->where('meta_key', $metaKey)
                ->delete();

            if ($deleted !== false) {
                $stats['meta'] += $deleted;
            }
        }

        // Delete entry details using Eloquent
        EntryDetails::where('submission_id', $submissionId)->delete();

        // Delete the submission itself using Eloquent
        $submission = Submission::find($submissionId);
        if (!$submission) {
            return false;
        }

        $deleted = $submission->delete();

        if (!$deleted) {
            return false;
        }

        return $stats;
    }
    
    /**
     * Delete AI chat data when a submission is deleted
     *
     * This is called via WordPress action hook when a submission is deleted
     *
     * @param int $submissionId Submission ID
     * @param int $formId Form ID
     * @return void
     */
    public function onSubmissionDeleted($submissionId, $formId)
    {
        // Check if this was an AI chat submission using Eloquent
        // Note: SubmissionMeta uses 'response_id' as foreign key
        $hasAiChat = SubmissionMeta::where('response_id', $submissionId)
            ->where('meta_key', 'ai_chat_session')
            ->exists();

        if (!$hasAiChat) {
            return; // Not an AI chat submission, nothing to clean up
        }

        // Delete conversation messages
        SubmissionMeta::where('response_id', $submissionId)
            ->where('meta_key', 'ai_chat_message')
            ->delete();

        // Delete all AI chat related meta
        $aiChatMetaKeys = [
            'ai_chat_session',
            'ai_chat_field_mapping',
            'ai_chat_completed',
        ];

        foreach ($aiChatMetaKeys as $metaKey) {
            SubmissionMeta::where('response_id', $submissionId)
                ->where('meta_key', $metaKey)
                ->delete();
        }
    }
    
    /**
     * Get cleanup statistics
     *
     * @return array Statistics about AI chat data
     */
    public function getCleanupStats()
    {
        // Count incomplete AI chat submissions using Eloquent models
        // Note: SubmissionMeta uses 'response_id' as foreign key, not 'submission_id'
        $incompleteCount = Submission::whereHas('submissionMeta', function ($query) {
            $query->where('meta_key', 'ai_chat_session');
        })
        ->whereIn('status', ['unread', 'read'])
        ->count();

        // Count completed AI chat submissions
        $completedCount = Submission::whereHas('submissionMeta', function ($query) {
            $query->where('meta_key', 'ai_chat_completed');
        })
        ->count();

        // Count total AI chat messages
        $messagesCount = SubmissionMeta::where('meta_key', 'ai_chat_message')->count();

        // Count old incomplete submissions (>24 hours)
        $cutoffTime = date('Y-m-d H:i:s', strtotime('-24 hours'));
        $oldIncompleteCount = Submission::whereHas('submissionMeta', function ($query) {
            $query->where('meta_key', 'ai_chat_session');
        })
        ->whereIn('status', ['unread', 'read'])
        ->where('created_at', '<', $cutoffTime)
        ->count();

        return [
            'incomplete_submissions' => (int) $incompleteCount,
            'completed_submissions' => (int) $completedCount,
            'total_messages' => (int) $messagesCount,
            'old_incomplete_submissions' => (int) $oldIncompleteCount,
        ];
    }
}


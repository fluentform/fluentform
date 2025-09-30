<?php
namespace FluentForm\App\Services\Scheduler;

class IntegrationRetrySupervisor {
    public function init() {
        add_action('fluentform_do_scheduled_tasks', [$this, 'run'], 20);
    }
    public function run() {
        $defaultMaxRetries = 3;
        $defaultTimeoutMinutes = 15;


        $maxRetries = (int) apply_filters('fluentform/integration_max_retries', $defaultMaxRetries, null, null);
        $timeoutMinutes = (int) apply_filters('fluentform/integration_processing_timeout', $defaultTimeoutMinutes);
        if ($timeoutMinutes < 1) {
            $timeoutMinutes = $defaultTimeoutMinutes;
        }

        // Scan rows updated within the last H minutes but older than M minutes
        $scanRecentMinutes = (int) apply_filters('fluentform/integration_processing_scan_recent_minutes', 60); // last 60 minutes
        $minAgeMinutes = (int) apply_filters('fluentform/integration_processing_min_age_minutes', 10); // older than 10 minutes
        if ($minAgeMinutes >= $scanRecentMinutes) { $minAgeMinutes = max(1, $scanRecentMinutes - 1); }

        $recentCutoff = date_i18n('Y-m-d H:i:s', current_time('timestamp') - ($scanRecentMinutes * 60));
        $minAgeCutoff = date_i18n('Y-m-d H:i:s', current_time('timestamp') - ($minAgeMinutes * 60));
        $scanLimit    = (int) apply_filters('fluentform/integration_processing_scan_limit', 200);

        $stuckRows = wpFluent()->table('ff_scheduled_actions')
            ->where('status', 'processing')
            ->where('updated_at', '>', $recentCutoff)
            ->where('updated_at', '<', $minAgeCutoff)
            ->orderBy('updated_at', 'ASC')
            ->limit($scanLimit)
            ->get();

        if (!$stuckRows) {
            return;
        }

        foreach ($stuckRows as $row) {
            $feed = maybe_unserialize($row->data);
            $formId = is_array($feed) && isset($feed['form_id']) ? $feed['form_id'] : $row->form_id;
            $rowMaxRetries = (int) apply_filters('fluentform/integration_max_retries', $maxRetries, $feed, $formId);
            $rowTimeout = (int) apply_filters('fluentform/integration_processing_timeout', $timeoutMinutes, $feed, $formId);

       
            if ($rowTimeout < 1) {
                $rowTimeout = $defaultTimeoutMinutes;
            }

            $cutoffLocal = date_i18n('Y-m-d H:i:s', current_time('timestamp') - ($rowTimeout * 60));

            // Skip if not yet timed out for this integration
            if ($row->updated_at >= $cutoffLocal) {
                continue;
            }


            if ((int) $row->retry_count < $rowMaxRetries) {
                // Requeue for another attempt with backoff
                $attempt = (int) $row->retry_count;
                $defaultDelay = 30 * max(1, $attempt);
                $delay = (int) apply_filters('fluentform/integration_retry_delay', $defaultDelay, $feed, $formId);
                // Always delay retries: if filter returned <= 0, fall back to defaultDelay
                if ($delay <= 0) {
                    $delay = $defaultDelay;
                }

                wpFluent()->table('ff_scheduled_actions')
                    ->where('id', $row->id)
                    ->update([
                        'status'     => 'pending',
                        'note'       => 'IntegrationRetrySupervisor: processing timeout; retrying (attempt ' . $attempt . ' of ' . $rowMaxRetries . ', next in ' . $delay . 's) [scheduled unique]',
                        'updated_at' => current_time('mysql')
                    ]);

                if (function_exists('as_schedule_single_action')) {
                    as_schedule_single_action(time() + $delay, 'fluentform/schedule_feed', ['queueId' => $row->id], 'fluentform', true);
                }
            } else {
                // Mark as failed after max retries
                $attempt = (int) $row->retry_count;
                wpFluent()->table('ff_scheduled_actions')
                    ->where('id', $row->id)
                    ->update([
                        'status'     => 'failed',
                        'note'       => 'processing timeout after max retries (attempt ' . $attempt . ' of ' . $rowMaxRetries . ')',
                        'updated_at' => current_time('mysql')
                    ]);
                do_action('fluentform/integration_failed_final', $row->id);
            }
        }
    }
}

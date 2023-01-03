<?php

namespace FluentForm\App\Hooks\Handlers;



use FluentForm\App\Databases\Migrations\ScheduledActions;
use FluentForm\App\Services\FormBuilder\ShortCodeParser;
use FluentForm\Framework\Foundation\Application;
use FluentForm\Framework\Helpers\ArrayHelper;
Use FluentForm\App\Services\Integrations\GlobalNotificationService;

class GlobalNotificationHandler
{
    
    /**
     * @param \FluentForm\Framework\Foundation\Application $app
     */
    protected $app;
    /**
     * @var GlobalNotificationService
     */
    private $globalNotificationService;
    
    public function __construct(Application $app)
    {
        $this->app = $app;
        $this->globalNotificationService = new GlobalNotificationService();
    }
    
    public function globalNotify($insertId, $formData, $form)
    {
        // Let's find the feeds that are available for this form
        $feedKeys = apply_filters('fluentform_global_notification_active_types', [], $form->id);
        
        if (! $feedKeys) {
            do_action('fluentform_global_notify_completed', $insertId, $form);
            return;
        }
        
        $feedMetaKeys = array_keys($feedKeys);
        $feeds = $this->globalNotificationService->getNotificationFeeds($form, $feedMetaKeys);
        
        if (! $feeds) {
            do_action('fluentform_global_notify_completed', $insertId, $form);
            return;
        }
        
        // Now we have to filter the feeds which are enabled
        $enabledFeeds = $this->globalNotificationService->getEnabledFeeds($feeds, $formData, $insertId);
    
        if (!$enabledFeeds) {
            do_action('fluentform_global_notify_completed', $insertId, $form);
            return;
        }
        
        $entry = false;
        $asyncFeeds = [];
        
        foreach ($enabledFeeds as $feed) {
            // We will decide if this feed will run on async or sync
            $integrationKey = ArrayHelper::get($feedKeys, $feed['meta_key']);
            
            $action = 'fluentform_integration_notify_' . $feed['meta_key'];
            
            if (! $entry) {
                $entry = $this->globalNotificationService->getEntry($insertId, $form);
            }
            // skip emails which will be sent on payment form submit otherwise email is sent after payment success
            if (! ! $form->has_payment && ('notifications' == $feed['meta_key'])) {
                if (('payment_form_submit' == ArrayHelper::get($feed, 'settings.feed_trigger_event'))) {
                    continue;
                }
            }
            
            // It's sync
            $processedValues = $feed['settings'];
            unset($processedValues['conditionals']);
            $processedValues = ShortCodeParser::parse($processedValues, $insertId, $formData, $form, false, $feed['meta_key']);
            $feed['processedValues'] = $processedValues;
            
            if (apply_filters('fluentform_notifying_async_' . $integrationKey, true, $form->id)) {
                // It's async
                $asyncFeeds[] = [
                    'action'     => $action,
                    'form_id'    => $form->id,
                    'origin_id'  => $insertId,
                    'feed_id'    => $feed['id'],
                    'type'       => 'submission_action',
                    'status'     => 'pending',
                    'data'       => maybe_serialize($feed),
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                ];
            } else {
                do_action($action, $feed, $formData, $entry, $form);
            }
        }
        
        if (! $asyncFeeds) {
            do_action('fluentform_global_notify_completed', $insertId, $form);
            return;
        }
        
        // Now we will push this async feeds
        $handler = $this->app['fluentFormAsyncRequest'];
        $handler->queueFeeds($asyncFeeds);
        
        $handler->dispatchAjax(['origin_id' => $insertId]);
    }
    
}

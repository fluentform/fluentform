# Workflow: Notifications & Integrations

Read this when working on email notifications, integrations, webhooks, or post-submission actions.

## Key Files

- `app/Services/FormBuilder/Notifications/EmailNotification.php` — Email sending
- `app/Services/FormBuilder/Notifications/EmailNotificationActions.php` — Email notification hooks
- `app/Services/FormBuilder/NotificationParser.php` — Parse notifications after submission
- `app/Services/FormBuilder/ShortCodeParser.php` — Replace shortcodes in notification templates
- `app/Services/Integrations/GlobalNotificationService.php` — Global notification management
- `app/Services/Integrations/GlobalNotificationManager.php` — Integration feed processing
- `app/Services/Integrations/FormIntegrationService.php` — Per-form integration management
- `app/Services/Integrations/GlobalIntegrationService.php` — Site-wide integration settings
- `app/Services/Integrations/BaseIntegration.php` — Base class for integrations
- `app/Services/Integrations/MailChimp/` — MailChimp integration
- `app/Services/Integrations/Slack/` — Slack integration
- `app/Http/Controllers/GlobalIntegrationController.php` — Site-wide integration API
- `app/Http/Controllers/FormIntegrationController.php` — Per-form integration API
- `app/Hooks/Handlers/GlobalNotificationHandler.php` — Hook handler for notifications

## Notification System

### Storage

Notifications are stored in `fluentform_form_meta` with `meta_key = 'notifications'`. The value is a JSON array of notification configs:

```php
[
    [
        'sendTo' => [
            'type' => 'email',      // 'email' (static) or 'field' (from form data)
            'email' => 'admin@example.com',
            'field' => 'email_field_name'  // used when type='field'
        ],
        'subject' => 'New submission from {form_title}',
        'message' => 'Hello {input.name}, ...',
        'fromName' => 'Site Name',
        'fromEmail' => 'noreply@example.com',
        'replyTo' => '{input.email}',
        'bcc' => '',
        'conditionals' => [...],
        'enabled' => true,
        'name' => 'Admin Notification'
    ]
]
```

### Notification Flow

1. Form submitted → `fluentform/submission_inserted` fires
2. `fluentform/notify_on_form_submit` fires with `($entryId, $formData, $form)`
3. `NotificationParser::parse()` processes each notification config:
   - Checks conditional logic (if enabled)
   - Resolves dynamic recipients from form fields
   - Parses shortcodes in subject, message, from, reply-to via `ShortCodeParser`
4. `EmailNotification` sends via `wp_mail()`

### ShortCode System

ShortCodes are placeholders in notification templates that get replaced with submission data:

```
{inputs.field_name}         — Field value from submission
{form_title}                — Form title
{submission.serial_number}  — Entry number
{submission.id}             — Entry ID
{submission.admin_view_url} — Admin link to entry
{submission.source_url}     — Page where form was submitted
{all_data}                  — All submitted fields formatted
{user.display_name}         — Current user display name
{user.email}                — Current user email
{date.m/d/Y}                — Current date in format
```

Parser: `ShortCodeParser::parse($template, $submission, $formData, $form)`

## Integration System

### Architecture

Integrations are modular. Each integration:
1. Registers itself via hooks
2. Provides a settings UI (Vue component)
3. Subscribes to `fluentform/submission_inserted` to process submissions
4. Stores config in `fluentform_form_meta` (per-form) or WordPress options (global)

### Built-in Integrations (Free)

| Integration | Directory | Purpose |
|------------|-----------|---------|
| **Email Notifications** | `Services/FormBuilder/Notifications/` | Send emails on submission |
| **MailChimp** | `Services/Integrations/MailChimp/` | Subscribe to mailing lists |
| **Slack** | `Services/Integrations/Slack/` | Post to Slack channels |

### Integration Storage

**Global settings** (API keys, connection configs):
- Stored as WordPress options via `GlobalIntegrationService`
- Retrieved via `/wp-json/fluentform/v1/integrations`

**Per-form feeds** (what to do on each form submission):
- Stored in `fluentform_form_meta` with integration name as `meta_key`
- Each "feed" is a config that maps form fields to integration fields
- Retrieved via `/wp-json/fluentform/v1/integrations/{form_id}/form-integrations`

### Integration API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/integrations` | GET | List all registered integrations |
| `/integrations` | POST | Update a global integration setting |
| `/integrations/update-status` | POST | Enable/disable an integration module |
| `/integrations/{form_id}/form-integrations` | GET | List form's integration feeds |
| `/integrations/{form_id}` | GET | Get single integration feed |
| `/integrations/{form_id}` | POST | Create/update integration feed |
| `/integrations/{form_id}` | DELETE | Delete integration feed |
| `/integrations/{form_id}/integration-list-component` | GET | Get feed list component |

### Creating a New Integration

1. Create a class (typically in `app/Services/Integrations/YourIntegration/`)
2. Register on `fluentform/loaded` hook
3. Add global settings component (Vue) and API key storage
4. Add per-form feed settings (field mapping UI)
5. Subscribe to `fluentform/submission_inserted` to process submissions
6. Store feeds in `fluentform_form_meta`

### Integration Feed Processing

On submission, `GlobalNotificationManager` iterates registered integrations:
1. Gets all feeds for the form from `fluentform_form_meta`
2. For each feed:
   - Checks if integration is enabled
   - Checks conditional logic
   - Maps form field values to integration fields
   - Calls the integration's processing method
   - Logs success/failure to `fluentform_logs`

## Post-Submission Actions Pipeline

After `fluentform/submission_inserted` fires, these run in order:

1. **Notifications:** Email notifications via `NotificationParser`
2. **Integrations:** MailChimp, Slack, webhook feeds via `GlobalNotificationManager`
3. **Confirmation:** Response sent back to user (message, redirect, or custom page)

### Key Hooks for Integrations

```php
// Subscribe to process submissions
add_action('fluentform/submission_inserted', [$this, 'processSubmission'], 20, 4);

// Register integration in admin
add_filter('fluentform/global_integration_drivers', [$this, 'addIntegration']);
add_filter('fluentform/global_integration_settings_' . $key, [$this, 'getSettings']);
add_action('fluentform/save_global_integration_settings_' . $key, [$this, 'saveSettings']);

// Per-form feed UI
add_filter('fluentform/form_integration_feed_' . $key, [$this, 'getFeed']);
add_filter('fluentform/form_integration_components_' . $key, [$this, 'getComponents']);
```

## Webhook System

Webhooks are configured as integration feeds. On submission:
1. Form data mapped to webhook payload
2. POST/GET request sent to configured URL
3. Response logged in `fluentform_logs`

Webhook settings stored in `fluentform_form_meta` like other integrations.

## Common Tasks

### Adding a notification condition

Notifications support conditional logic (same system as form fields). Conditions are stored in the notification config's `conditionals` array and evaluated by `ConditionAssesor`.

### Debugging notification delivery

1. Check `fluentform_logs` table for send status
2. Check notification config in `fluentform_form_meta` (meta_key='notifications')
3. Verify conditional logic isn't blocking
4. Check `wp_mail` function works (test with another plugin)
5. Check shortcode parsing — invalid shortcodes silently return empty strings

### Debugging integration feeds

1. Check `fluentform_form_meta` for the integration's feeds
2. Check global settings (API key, connection) in WordPress options
3. Check `fluentform_logs` for error messages
4. Verify the integration module is enabled
5. Check conditional logic on the feed

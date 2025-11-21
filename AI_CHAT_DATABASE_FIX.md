# AI Chat Database Column Name Fix

## Date: 2025-11-24

## Issue

**Error:**
```
WordPress database error Unknown column 'm.submission_id' in 'on clause' 
for query made by fluentform_ai_get_cleanup_stats
```

**Root Cause:**
The `AiChatCleanup.php` service was using incorrect column name `submission_id` when querying the `fluentform_submission_meta` table. The correct column name is `response_id`.

---

## Database Schema

### `fluentform_submission_meta` Table Structure

```sql
CREATE TABLE fluentform_submission_meta (
  `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `response_id` BIGINT(20) UNSIGNED NULL,  -- ✅ Correct column name
  `form_id` INT UNSIGNED NULL,
  `meta_key` VARCHAR(45) NULL,
  `value` LONGTEXT NULL,
  `status` VARCHAR(45) NULL,
  `user_id` INT UNSIGNED NULL,
  `name` VARCHAR(45) NULL,
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  KEY `response_id_meta_key` (`response_id`, `meta_key`)
);
```

**Key Point:** The foreign key column is `response_id`, NOT `submission_id`.

---

## Eloquent Models

### `SubmissionMeta` Model
```php
class SubmissionMeta extends Model
{
    protected $table = 'fluentform_submission_meta';
    
    // Relationship uses 'response_id' as foreign key
    public function submission()
    {
        return $this->belongsTo(Submission::class, 'response_id', 'id');
    }
    
    // Methods use 'response_id'
    public static function retrieve($key, $submissionId = null, $default = null)
    {
        $meta = static::when($submissionId, function ($q) use ($submissionId) {
            return $q->where('response_id', $submissionId);  // ✅ Correct
        })
        ->where('meta_key', $key)
        ->first();
        
        return $meta ? Helper::safeUnserialize($meta->value) : $default;
    }
    
    public static function persist($submissionId, $metaKey, $metaValue, $formId = null)
    {
        return static::updateOrCreate(
            ['response_id' => $submissionId, 'meta_key' => $metaKey],  // ✅ Correct
            ['value' => maybe_serialize($metaValue), 'form_id' => $formId]
        );
    }
}
```

### `Submission` Model
```php
class Submission extends Model
{
    protected $table = 'fluentform_submissions';
    
    // Relationship uses 'response_id' as foreign key
    public function submissionMeta()
    {
        return $this->hasMany(SubmissionMeta::class, 'response_id', 'id');
    }
}
```

---

## Fix Applied

### File: `app/Modules/AiChat/Services/AiChatCleanup.php`

#### Change 1: Added Model Imports
```php
use FluentForm\App\Models\Submission;
use FluentForm\App\Models\SubmissionMeta;
use FluentForm\App\Models\EntryDetails;
```

#### Change 2: Fixed `getCleanupStats()` Method

**Before (WRONG - Raw SQL with wrong column name):**
```php
public function getCleanupStats()
{
    global $wpdb;
    
    $submissionsTable = $wpdb->prefix . 'fluentform_submissions';
    $metaTable = $wpdb->prefix . 'fluentform_submission_meta';
    
    // ❌ WRONG: Uses 'm.submission_id' which doesn't exist
    $incompleteCount = $wpdb->get_var("
        SELECT COUNT(DISTINCT s.id)
        FROM {$submissionsTable} s
        INNER JOIN {$metaTable} m ON s.id = m.submission_id
        WHERE m.meta_key = 'ai_chat_session'
        AND s.status IN ('unread', 'read')
    ");
    
    // ... more queries with same issue
}
```

**After (CORRECT - Using Eloquent models):**
```php
public function getCleanupStats()
{
    // ✅ CORRECT: Uses Eloquent relationship which knows about 'response_id'
    $incompleteCount = Submission::whereHas('submissionMeta', function ($query) {
        $query->where('meta_key', 'ai_chat_session');
    })
    ->whereIn('status', ['unread', 'read'])
    ->count();
    
    $completedCount = Submission::whereHas('submissionMeta', function ($query) {
        $query->where('meta_key', 'ai_chat_completed');
    })
    ->count();
    
    $messagesCount = SubmissionMeta::where('meta_key', 'ai_chat_message')->count();
    
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
```

#### Change 3: Fixed `cleanupIncompleteSubmissions()` Method

**Before:**
```php
$query = "
    SELECT DISTINCT s.id, s.form_id, s.created_at
    FROM {$submissionsTable} s
    INNER JOIN {$metaTable} m ON s.id = m.submission_id  -- ❌ WRONG
    WHERE m.meta_key = 'ai_chat_session'
    AND s.status IN ('unread', 'read')
    AND s.created_at < %s
";
```

**After:**
```php
$incompleteSubmissions = Submission::whereHas('submissionMeta', function ($query) {
    $query->where('meta_key', 'ai_chat_session');
})
->whereIn('status', ['unread', 'read'])
->where('created_at', '<', $cutoffTime)
->get(['id', 'form_id', 'created_at']);
```

#### Change 4: Fixed `deleteSubmissionWithChatData()` Method

**Before:**
```php
$messagesDeleted = $wpdb->delete(
    $wpdb->prefix . 'fluentform_submission_meta',
    [
        'submission_id' => $submissionId,  // ❌ WRONG column name
        'meta_key' => 'ai_chat_message',
    ],
    ['%d', '%s']
);
```

**After:**
```php
$messagesDeleted = SubmissionMeta::where('response_id', $submissionId)  // ✅ CORRECT
    ->where('meta_key', 'ai_chat_message')
    ->delete();
```

#### Change 5: Fixed `onSubmissionDeleted()` Method

**Before:**
```php
$hasAiChat = $wpdb->get_var(
    $wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->prefix}fluentform_submission_meta 
        WHERE submission_id = %d AND meta_key = 'ai_chat_session'",  // ❌ WRONG
        $submissionId
    )
);
```

**After:**
```php
$hasAiChat = SubmissionMeta::where('response_id', $submissionId)  // ✅ CORRECT
    ->where('meta_key', 'ai_chat_session')
    ->exists();
```

---

## Benefits of Using Eloquent Models

1. **Type Safety**: Eloquent relationships ensure correct column names
2. **Maintainability**: Changes to schema are reflected in one place (the model)
3. **Readability**: More expressive and easier to understand
4. **Consistency**: Follows FluentForm's existing patterns
5. **Less Error-Prone**: No manual SQL string concatenation

---

## Other AI Chat Files

### Files That Use Correct Approach

✅ **`AiMetaStorage.php`** - Uses `Helper::setSubmissionMeta()` and `Helper::getSubmissionMeta()` which internally use the `SubmissionMeta` model with correct column names.

✅ **`AiConversationEngine.php`** - Uses `AiMetaStorage` service, which uses Helper methods.

✅ **All other AI Chat files** - Use the Helper methods or Eloquent models correctly.

---

## Testing

After this fix, the following should work without errors:

1. **Admin cleanup stats endpoint:**
   ```
   wp_ajax_fluentform_ai_get_cleanup_stats
   ```

2. **Scheduled cleanup:**
   ```
   fluentform_do_email_report_scheduled_tasks
   ```

3. **Submission deletion hook:**
   ```
   fluentform_before_submission_deleted
   ```

---

## Summary

**Problem:** Raw SQL queries used wrong column name `submission_id` instead of `response_id`

**Solution:** Replaced raw SQL with Eloquent models that know the correct column names

**Files Changed:** `app/Modules/AiChat/Services/AiChatCleanup.php`

**Impact:** All cleanup operations now work correctly without database errors

---

# AI Chat Data Request Flow

## Complete Request/Response Flow with Parameters

### Overview

This section documents the complete data flow from user input through the frontend, backend, OpenAI API, and back to the user.

---

## 1. User Sends Message

### Frontend: `AiChatInterface.vue`

**User Action:** Types message and clicks send or presses Enter

**Method Called:** `sendMessage(messageText)`

**Request Payload to Backend:**
```javascript
// File: resources/assets/public/AiChat/AiChatService.js
// Method: sendMessage(conversationId, message)

POST /wp-admin/admin-ajax.php
{
    action: 'fluentform_ai_chat_message',
    conversation_id: '4099',           // Submission ID
    message: 'Robin',                  // User's message text
    _ajax_nonce: 'abc123...'          // WordPress nonce for security
}
```

**Frontend State Before Request:**
```javascript
{
    conversationId: 4099,
    messages: [
        {
            id: 1732441234567,
            text: "Hello! What's your name?",
            sender: 'assistant',
            timestamp: Date,
            options: null,
            validationError: null
        }
    ],
    isLoading: false,
    currentFieldDetails: null
}
```

---

## 2. Backend Receives Request

### Controller: `AiChatController.php`

**WordPress Hook:** `wp_ajax_fluentform_ai_chat_message`

**Method:** `handleMessage()`

**Parameters Received:**
```php
$_POST = [
    'action' => 'fluentform_ai_chat_message',
    'conversation_id' => '4099',
    'message' => 'Robin',
    '_ajax_nonce' => 'abc123...'
];
```

**Validation:**
```php
// 1. Verify nonce
check_ajax_referer('fluentform_ai_chat', '_ajax_nonce');

// 2. Sanitize inputs
$conversationId = intval($_POST['conversation_id']);
$userMessage = sanitize_textarea_field($_POST['message']);

// 3. Load submission and form
$submission = Submission::find($conversationId);
$form = Form::find($submission->form_id);
```

---

## 3. Backend Processes Message

### Service: `AiConversationEngine.php`

**Method:** `processUserResponse($submissionId, $formId, $userMessage)`

**Step 1: Load Session State**
```php
// From: fluentform_submission_meta table
// meta_key: 'ai_session_state'
$session = [
    'session_id' => 'uuid-1234',
    'mode' => 'ai_chat',
    'form_id' => 315,
    'submission_id' => 4099,
    'started_at' => '2025-11-24 09:00:00',
    'current_field' => 'input_text',      // Current field being asked
    'fields_completed' => []               // Empty array (first field)
];
```

**Step 2: Load Conversation History**
```php
// From: fluentform_submission_meta table
// meta_key: 'ai_chat_message'
$conversation = [
    [
        'role' => 'assistant',
        'content' => "Hello! What's your name?"
    ]
];
```

**Step 3: Load Form Questions**
```php
// From: Converter::convert($form)
$questions = [
    [
        'name' => 'input_text',
        'title' => 'Name',
        'type' => 'FlowFormTextType',
        'ff_input_type' => 'input_text',
        'required' => true,
        'help_text' => '',
        'placeholder' => 'Enter your name'
    ],
    [
        'name' => 'phone',
        'title' => 'Phone Number',
        'type' => 'FlowFormPhoneType',
        'ff_input_type' => 'phone',
        'required' => true
    ],
    [
        'name' => 'address1',
        'title' => 'Address',
        'type' => 'FlowFormAddressType',
        'ff_input_type' => 'address',
        'required' => false,
        'fields' => [
            // Sub-fields for address
        ]
    ],
    [
        'name' => 'checkbox',
        'title' => 'How did you hear about us?',
        'type' => 'FlowFormMultipleChoiceType',
        'ff_input_type' => 'input_checkbox',
        'required' => false,
        'options' => [
            ['label' => 'Website', 'value' => 'website'],
            ['label' => 'Friend/Colleague', 'value' => 'friend'],
            ['label' => 'Online Search', 'value' => 'online_search']
        ]
    ]
];
```

**Step 4: Extract Field Value**
```php
// Current field: 'input_text' (Name)
$currentField = $questions[0];
$extractedValue = $this->extractFieldValue('Robin', $currentField, null);
// Result: 'Robin'
```

---

## 4. Backend Calls OpenAI API (Extraction)

### Service: `OpenAiService.php`

**Method:** `chat($messages)`

**Request to OpenAI API:**
```json
POST https://api.openai.com/v1/chat/completions
Headers:
{
    "Authorization": "Bearer sk-...",
    "Content-Type": "application/json"
}

Body:
{
    "model": "gpt-4",
    "messages": [
        {
            "role": "system",
            "content": "You are a data extraction assistant. Extract only the requested value from user messages."
        },
        {
            "role": "user",
            "content": "Extract ONLY the value for the field 'Name' from this user message: \"Robin\"\n\nIMPORTANT: Return ONLY the user's actual answer from their message. Do NOT return field types, labels, or any other metadata.\nReturn ONLY the extracted value, nothing else. No explanations, no extra text.\n\nExtract only the text value from the user's message.\n"
        }
    ],
    "temperature": 0.3,
    "max_tokens": 500
}
```

**Response from OpenAI:**
```json
{
    "id": "chatcmpl-...",
    "object": "chat.completion",
    "created": 1732441234,
    "model": "gpt-4",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Robin"
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 85,
        "completion_tokens": 2,
        "total_tokens": 87
    }
}
```

**Extracted Value:** `"Robin"`

---

## 5. Backend Validates Field Value

### Service: `AiConversationEngine.php`

**Method:** `validateFieldValue($form, $fieldName, $value, $submissionId)`

**Validation Process:**
```php
// 1. Get field from form
$field = $this->getFieldFromForm($form, 'input_text');

// 2. Prepare validation data
$data = [
    'input_text' => 'Robin'
];

// 3. Call FluentForm validator
$validator = new ValidationManager();
$errors = $validator->validate($data, $field, $form);

// Result: No errors (valid name)
$validationError = null;
```

**If Validation Passes:**
```php
// Save to database
// Table: fluentform_submission_meta
// meta_key: 'ai_field_mapping'
$mapping = [
    'input_text' => [
        'user_message' => 'Robin',
        'extracted_value' => 'Robin',
        'timestamp' => '2025-11-24 09:00:15'
    ]
];

// Update submission response
// Table: fluentform_submissions
// Column: response (JSON)
$submission->response = json_encode([
    'input_text' => 'Robin'
]);
$submission->save();

// Update session state
$session['fields_completed'] = ['input_text'];
$session['current_field'] = 'phone';  // Next field
```

---

## 6. Backend Calls OpenAI API (Response Generation)

### Service: `AiConversationEngine.php`

**Method:** `buildMessages($conversation, $userMessage, $questions, $session, $aiConfig)`

**Request to OpenAI API:**
```json
POST https://api.openai.com/v1/chat/completions

Body:
{
    "model": "gpt-4",
    "messages": [
        {
            "role": "system",
            "content": "You are a friendly form assistant helping users fill out a form through natural conversation.\n\nFORM FIELDS TO COLLECT:\n1. Name (required)\n   Type: text\n2. Phone Number (required)\n   Type: phone\n3. Address\n   Type: address\n4. How did you hear about us?\n   Type: checkbox\n   Valid options: Website, Friend/Colleague, Online Search\n   (Accept partial or informal answers - e.g., 'online' for 'Online Search', 'friend' for 'Friend/Colleague')\n\nRULES:\n- Ask for ONE field at a time\n- Be conversational and friendly\n- Acknowledge user's answers\n- If validation fails, politely explain the error\n- Keep responses concise (2-3 sentences max)"
        },
        {
            "role": "system",
            "content": "✅ ALREADY COLLECTED VALUES - DO NOT ASK AGAIN:\n✓ Name: Robin\n\n🚫 CRITICAL RULES:\n- NEVER ask for these fields again\n- If user mentions these values, acknowledge but don't re-collect\n- Only ask for the NEXT unanswered field\n- These values are permanently saved and cannot be changed in this conversation"
        },
        {
            "role": "assistant",
            "content": "Hello! What's your name?"
        },
        {
            "role": "user",
            "content": "Robin"
        },
        {
            "role": "system",
            "content": "Successfully collected value for 'Name'."
        },
        {
            "role": "system",
            "content": "CURRENT FOCUS: The system is currently waiting for the value of the field 'Phone Number'.\nYour PRIMARY GOAL is to get the user to provide a valid answer for this specific field.\nDo NOT change the subject. Do NOT ask about other fields yet."
        }
    ],
    "temperature": 0.7,
    "max_tokens": 150
}
```

**Response from OpenAI:**
```json
{
    "id": "chatcmpl-...",
    "object": "chat.completion",
    "created": 1732441235,
    "model": "gpt-4",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Thank you for sharing your name, Robin! Could you please provide me with your phone number?"
            },
            "finish_reason": "stop"
        }
    ],
    "usage": {
        "prompt_tokens": 245,
        "completion_tokens": 18,
        "total_tokens": 263
    }
}
```

**AI Response:** `"Thank you for sharing your name, Robin! Could you please provide me with your phone number?"`

---

## 7. Backend Prepares Response

### Service: `AiConversationEngine.php`

**Method:** `processUserResponse()` (continued)

**Calculate Progress:**
```php
// Get all field mappings
$fieldMappings = [
    'input_text' => [
        'user_message' => 'Robin',
        'extracted_value' => 'Robin',
        'timestamp' => '2025-11-24 09:00:15'
    ]
];

// Count completed fields
$completedFields = ['input_text'];  // 1 field

// Count total input fields (exclude section breaks, HTML blocks)
$totalInputFields = 4;  // input_text, phone, address1, checkbox

// Calculate completion
$isAllCompleted = false;  // Still have 3 fields to go
```

**Get Current Field Details:**
```php
// For showing clickable buttons (if applicable)
$currentFieldDetails = [
    'name' => 'phone',
    'title' => 'Phone Number',
    'type' => 'phone',
    'options' => []  // No options for phone field
];
```

**Save AI Response to Database:**
```php
// Table: fluentform_submission_meta
// meta_key: 'ai_chat_message'
$this->metaStorage->saveConversationMessage(
    $submissionId,
    $formId,
    'assistant',
    'Thank you for sharing your name, Robin! Could you please provide me with your phone number?'
);
```

**Prepare Response Payload:**
```php
return [
    'message' => 'Thank you for sharing your name, Robin! Could you please provide me with your phone number?',
    'field_completed' => true,           // Successfully extracted 'input_text'
    'all_completed' => false,            // Still have more fields
    'current_field' => 'phone',          // Next field to collect
    'current_field_details' => [
        'name' => 'phone',
        'title' => 'Phone Number',
        'type' => 'phone',
        'options' => []
    ],
    'progress' => [
        'completed' => 1,                // 1 field completed
        'total' => 4                     // 4 total fields
    ],
    'validation_errors' => []            // No errors
];
```

---

## 8. Backend Sends Response to Frontend

### Controller: `AiChatController.php`

**Method:** `handleMessage()` (continued)

**Response to Frontend:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
    "success": true,
    "data": {
        "message": "Thank you for sharing your name, Robin! Could you please provide me with your phone number?",
        "field_completed": true,
        "all_completed": false,
        "current_field": "phone",
        "current_field_details": {
            "name": "phone",
            "title": "Phone Number",
            "type": "phone",
            "options": []
        },
        "progress": {
            "completed": 1,
            "total": 4
        },
        "validation_errors": []
    }
}
```

---

## 9. Frontend Receives and Displays Response

### Frontend: `AiChatInterface.vue`

**Method:** `sendMessage()` (continued)

**Processing Response:**
```javascript
// 1. Store current field details for quick replies
this.currentFieldDetails = data.current_field_details;

// 2. Prepare message data
const messageData = {
    text: data.message,
    options: null,
    validationError: null
};

// 3. Add options for choice fields (if applicable)
if (this.currentFieldDetails &&
    this.currentFieldDetails.options &&
    this.currentFieldDetails.options.length > 0) {

    const fieldType = this.currentFieldDetails.type;
    if (fieldType === 'input_checkbox' ||
        fieldType === 'input_radio' ||
        fieldType === 'select') {
        messageData.options = this.currentFieldDetails.options;
    }
}

// 4. Add validation errors (if any)
if (data.validation_errors &&
    Object.keys(data.validation_errors).length > 0) {
    const firstError = Object.values(data.validation_errors)[0];
    messageData.validationError = firstError.error;
}

// 5. Add assistant message to UI
this.addMessage(
    messageData.text,
    'assistant',
    messageData.options,
    messageData.validationError
);

// 6. Update progress bar
this.updateProgress(data.progress.completed, data.progress.total);
```

**Updated Frontend State:**
```javascript
{
    conversationId: 4099,
    messages: [
        {
            id: 1732441234567,
            text: "Hello! What's your name?",
            sender: 'assistant',
            timestamp: Date,
            options: null,
            validationError: null
        },
        {
            id: 1732441234568,
            text: "Robin",
            sender: 'user',
            timestamp: Date
        },
        {
            id: 1732441235000,
            text: "Thank you for sharing your name, Robin! Could you please provide me with your phone number?",
            sender: 'assistant',
            timestamp: Date,
            options: null,              // No options for phone field
            validationError: null       // No validation errors
        }
    ],
    isLoading: false,
    currentFieldDetails: {
        name: 'phone',
        title: 'Phone Number',
        type: 'phone',
        options: []
    },
    progress: {
        completed: 1,
        total: 4
    }
}
```

---

## 10. Special Case: Choice Fields with Clickable Buttons

### Example: User reaches "How did you hear about us?" field

**Backend Response:**
```json
{
    "success": true,
    "data": {
        "message": "Great! Now, how did you hear about the workshop? Was it through the website, a friend/colleague, or an online search?",
        "field_completed": true,
        "all_completed": false,
        "current_field": "checkbox",
        "current_field_details": {
            "name": "checkbox",
            "title": "How did you hear about us?",
            "type": "input_checkbox",
            "options": [
                {"label": "Website", "value": "website"},
                {"label": "Friend/Colleague", "value": "friend"},
                {"label": "Online Search", "value": "online_search"}
            ]
        },
        "progress": {
            "completed": 3,
            "total": 4
        },
        "validation_errors": []
    }
}
```

**Frontend Renders:**
```html
<div class="ff-ai-chat-message assistant">
    <div class="message-text">
        Great! Now, how did you hear about the workshop?
        Was it through the website, a friend/colleague, or an online search?
    </div>

    <!-- Clickable buttons -->
    <div class="ff-ai-chat-quick-replies">
        <button class="ff-ai-chat-quick-reply-btn" @click="handleOptionSelect('Website')">
            Website
        </button>
        <button class="ff-ai-chat-quick-reply-btn" @click="handleOptionSelect('Friend/Colleague')">
            Friend/Colleague
        </button>
        <button class="ff-ai-chat-quick-reply-btn" @click="handleOptionSelect('Online Search')">
            Online Search
        </button>
    </div>
</div>
```

**User Clicks Button:**
```javascript
// Method: handleOptionSelect(optionLabel)
handleOptionSelect('Online Search') {
    // Sends "Online Search" as a regular message
    this.sendMessage('Online Search');
}
```

---

## 11. Special Case: Validation Error

### Example: User enters invalid email

**Backend Response:**
```json
{
    "success": true,
    "data": {
        "message": "I'm sorry, but 'notanemail' doesn't appear to be a valid email address. Could you please provide a valid email address?",
        "field_completed": false,        // Validation failed
        "all_completed": false,
        "current_field": "email",        // Same field (retry)
        "current_field_details": {
            "name": "email",
            "title": "Email Address",
            "type": "input_email",
            "options": []
        },
        "progress": {
            "completed": 2,              // No progress made
            "total": 4
        },
        "validation_errors": {
            "email": {
                "label": "Email Address",
                "error": "The given data was invalid",
                "value": "notanemail"
            }
        }
    }
}
```

**Frontend Renders:**
```html
<div class="ff-ai-chat-message assistant">
    <div class="message-text">
        I'm sorry, but 'notanemail' doesn't appear to be a valid email address.
        Could you please provide a valid email address?
    </div>

    <!-- Validation error box -->
    <div class="ff-ai-chat-validation-error">
        <svg><!-- Error icon --></svg>
        <span>The given data was invalid</span>
    </div>
</div>
```

---

## Database Tables Used

### 1. `fluentform_submissions`
```sql
-- Stores main submission data
id: 4099
form_id: 315
response: '{"input_text":"Robin","phone":"0112312312"}'  -- JSON
status: 'unread'
created_at: '2025-11-24 09:00:00'
updated_at: '2025-11-24 09:02:48'
```

### 2. `fluentform_submission_meta`
```sql
-- Stores AI chat session state
id: 1001
response_id: 4099
form_id: 315
meta_key: 'ai_session_state'
value: 'a:7:{s:10:"session_id";s:36:"uuid-1234";...}'  -- Serialized PHP array
created_at: '2025-11-24 09:00:00'

-- Stores conversation messages
id: 1002
response_id: 4099
form_id: 315
meta_key: 'ai_chat_message'
value: 'a:2:{s:4:"role";s:9:"assistant";s:7:"content";s:22:"Hello! What\'s your name?";}'
created_at: '2025-11-24 09:00:00'

id: 1003
response_id: 4099
form_id: 315
meta_key: 'ai_chat_message'
value: 'a:2:{s:4:"role";s:4:"user";s:7:"content";s:5:"Robin";}'
created_at: '2025-11-24 09:00:15'

-- Stores field mappings (canonical source of truth)
id: 1004
response_id: 4099
form_id: 315
meta_key: 'ai_field_mapping'
value: 'a:1:{s:10:"input_text";a:3:{s:12:"user_message";s:5:"Robin";...}}'
created_at: '2025-11-24 09:00:15'
```

### 3. `fluentform_entry_details`
```sql
-- Stores individual field values for validation
id: 5001
submission_id: 4099
form_id: 315
field_name: 'input_text'
sub_field_name: NULL
field_value: 'Robin'
created_at: '2025-11-24 09:00:15'
```

---

## Key Parameters Summary

### Frontend → Backend
- `conversation_id`: Submission ID
- `message`: User's text input
- `_ajax_nonce`: Security token

### Backend → OpenAI (Extraction)
- `model`: "gpt-4" or "gpt-3.5-turbo"
- `messages`: Array of conversation context
- `temperature`: 0.3 (low for consistent extraction)
- `max_tokens`: 500

### Backend → OpenAI (Response)
- `model`: "gpt-4" or "gpt-3.5-turbo"
- `messages`: Full conversation history + system prompts
- `temperature`: 0.7 (higher for natural responses)
- `max_tokens`: 150

### Backend → Frontend
- `message`: AI's response text
- `field_completed`: Boolean (was field successfully extracted?)
- `all_completed`: Boolean (are all fields done?)
- `current_field`: String (next field name)
- `current_field_details`: Object (field metadata for UI)
- `progress`: Object {completed, total}
- `validation_errors`: Object (field errors if any)

---

## Performance Considerations

1. **OpenAI API Calls**: 2 calls per user message
   - 1 for extraction (~87 tokens)
   - 1 for response generation (~263 tokens)
   - Total: ~350 tokens per exchange

2. **Database Queries**: ~10-15 queries per request
   - Load session state
   - Load conversation history
   - Load field mappings
   - Save new message
   - Update session state
   - Update submission response

3. **Caching**: Form questions are cached in memory during request

4. **Optimization Opportunities**:
   - Cache form structure in Redis
   - Batch database writes
   - Use streaming for OpenAI responses
   - Implement rate limiting


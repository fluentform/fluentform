# AI Chat Feature - Technical Documentation

**Version**: 1.1.0
**Last Updated**: 2025-11-24
**Status**: Production Ready

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     AI CHAT SYSTEM                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐         ┌──────────────────┐         │
│  │   Admin UI      │────────▶│   Backend API    │         │
│  │  (Vue.js)       │         │   (PHP/AJAX)     │         │
│  └─────────────────┘         └──────────────────┘         │
│         │                             │                     │
│         │                             ▼                     │
│         │                    ┌──────────────────┐         │
│         │                    │  OpenAI Service  │         │
│         │                    │  (GPT-3.5/4)     │         │
│         │                    └──────────────────┘         │
│         │                             │                     │
│         ▼                             ▼                     │
│  ┌─────────────────┐         ┌──────────────────┐         │
│  │  Chat Interface │────────▶│ Conversation     │         │
│  │  (Vue.js)       │         │ Engine           │         │
│  └─────────────────┘         └──────────────────┘         │
│         │                             │                     │
│         │                             ▼                     │
│         │                    ┌──────────────────┐         │
│         └───────────────────▶│   Database       │         │
│                              │   (Form Meta)    │         │
│                              └──────────────────┘         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
app/Modules/AiChat/
├── AiChatController.php              # AJAX endpoints & request handling
├── Classes/
│   └── AiChatForm.php                # AI Chat form rendering (extends BaseForm)
├── Services/
│   ├── OpenAiService.php             # OpenAI API integration
│   ├── AiMetaStorage.php             # Database operations
│   ├── AiConversationEngine.php      # Main conversation logic
│   └── AiChatCleanup.php             # Automatic cleanup service
└── Helpers/
    └── AiChatHelper.php              # Utility functions

resources/assets/
├── admin/
│   ├── ai_chat_settings.js           # Admin settings entry point
│   ├── ai_chat_settings.scss         # Admin styles
│   └── components/
│       └── AiChatSettings.vue        # Settings UI component
└── public/
    ├── ai-chat-main.js               # Public entry point
    ├── AiChatApp.vue                 # Main app component
    ├── scss/
    │   └── ai-chat.scss              # Public styles
    └── AiChat/
        ├── AiChatInterface.vue       # Chat interface
        ├── AiChatInput.vue           # Input component
        └── AiChatMessage.vue         # Message component

src/form/services/
└── AiChatService.js                  # AJAX service for frontend
```

---

## Core Components

### Backend (PHP)

#### 1. AiConversationEngine.php (~1,174 lines)
**Purpose**: Orchestrates AI-powered conversations

**Key Methods**:
- `startConversation($formId)` - Initializes new conversation
- `processUserResponse($submissionId, $formId, $userMessage)` - Handles user messages (single-field extraction only)
- `completeSubmission($submissionId, $formId)` - Finalizes submission
- `buildMessages($conversation, $userMessage, $questions, $session, $aiConfig)` - Builds OpenAI context
- `extractFieldValue($userMessage, $field, $aiResponse)` - Extracts single field value from natural language
- `validateFieldValue($form, $fieldName, $value, $submissionId)` - Validates extracted values
- `cleanFieldValue($value, $field)` - Cleans and normalizes field values based on field type

**Key Features**:
- Uses existing `Converter` class for form parsing
- Tracks conversation state in submission meta
- Extracts single field value per turn using AI (strict single-field mode)
- Validates extracted values using FluentForm's native validation
- Handles multi-turn conversations with context
- Supports all FluentForm field types
- Maintains conversation history (last 10 messages)
- Handles validation errors gracefully with AI feedback
- Progress tracking based on canonical field mappings (`ai_field_mapping` meta)
- Deterministic completion detection (data-driven, not phrase-based)

#### 2. OpenAiService.php (~286 lines)
**Purpose**: Direct OpenAI API integration

**Key Methods**:
- `chat($messages, $options = [])` - Sends chat completion request
- `validateApiKey($apiKey)` - Validates API key
- `extractMessage($response)` - Extracts message from API response

**Supported Models**:
- GPT-3.5 Turbo
- GPT-4
- GPT-4 Turbo

#### 3. AiMetaStorage.php (~280 lines)
**Purpose**: Database operations using existing FluentForm tables

**Key Methods**:
- `saveConversationMessage($submissionId, $formId, $role, $message)` - Saves chat messages
- `getConversationHistory($submissionId)` - Retrieves conversation
- `saveFieldMapping($submissionId, $formId, $fieldName, $userMessage, $extractedValue)` - Saves field mappings
- `getAiConfig($formId)` - Gets AI configuration
- `saveAiConfig($formId, $config)` - Saves AI configuration

**Database Tables Used**:
- `fluentform_submissions` - Submission records
- `fluentform_submission_meta` - Conversation history, field mappings, session state

#### 4. AiChatController.php (~340 lines)
**Purpose**: AJAX endpoint handlers

**Endpoints**:
- `fluentform_ai_start_conversation` - Start new conversation
- `fluentform_ai_send_message` - Send user message
- `fluentform_ai_complete_submission` - Complete submission
- `fluentform_ai_get_conversation` - Get conversation history
- `fluentform_ai_save_config` - Save AI configuration (admin)
- `fluentform_ai_validate_key` - Validate API key (admin)

#### 5. AiChatForm.php (~273 lines)
**Purpose**: AI Chat form rendering (extends BaseForm)

**Key Methods**:
- `boot()` - Registers hooks and shortcode
- `renderAiChatPage()` - Handles `?fluent-form-ai={id}` URL
- `renderAiChatShortcode()` - Handles `[fluentform_ai_chat]` shortcode
- `renderAiChatSettings($formId)` - Renders admin settings page

**Inheritance**:
- Extends `FluentForm\App\Services\FluentConversational\Classes\Form`
- Reuses shared methods: `getMetaSettings()`, `getDesignSettings()`, etc.

#### 6. AiChatCleanup.php
**Purpose**: Automatic cleanup of incomplete submissions

**Features**:
- Deletes incomplete AI chat submissions older than 24 hours
- Cascade deletes related meta data
- Provides cleanup statistics for admin dashboard

---

### Frontend (Vue.js)

#### 1. AiChatInterface.vue (~400 lines)
**Purpose**: Main chat interface component

**Features**:
- Message display with user/AI avatars
- Progress bar showing completion
- Input field with send button
- Completion screen
- Error handling
- Loading states

**Props**:
- `formId` - Form ID
- `formTitle` - Form title
- `language` - Localized strings
- `isFullscreen` - Fullscreen mode flag

**Events**:
- `@chat-completed` - Emitted when form is completed

#### 2. AiChatInput.vue (~200 lines)
**Purpose**: Message input component

**Features**:
- Text input field
- Send button
- Enter key to send
- Disabled state during loading

#### 3. AiChatMessage.vue (~150 lines)
**Purpose**: Message display component

**Features**:
- User/AI message styling
- Avatar display
- Markdown support (optional)
- Timestamp display

#### 4. AiChatSettings.vue (~430 lines)
**Purpose**: Admin settings UI

**Features**:
- Enable/Disable toggle
- API key input with validation
- Model selection (GPT-3.5/4/4-Turbo)
- Conversation style presets
- Custom system prompts
- Display mode selection
- Save/Reset functionality

---

## Data Flow

### 1. Start Conversation
```
User visits ?fluent-form-ai=54
    ↓
AiChatInterface.vue mounted
    ↓
Call startConversation()
    ↓
AiChatController::startConversation()
    ↓
AiConversationEngine::startConversation()
    ↓
Create submission record
Save initial session state
Generate first AI message
    ↓
Return: {message, submission_id, progress}
    ↓
Display first message in UI
```

### 2. Send Message
```
User types message and clicks Send
    ↓
AiChatInterface.vue::sendMessage()
    ↓
AiChatController::sendMessage()
    ↓
AiConversationEngine::processUserResponse()
    ↓
Load canonical progress from ai_field_mapping meta
Determine current field using getNextField()
Build context with conversation history (last 10 messages)
Call OpenAI API
Extract single field value from response
Validate extracted value
Save to ai_field_mapping meta (canonical source)
Recalculate progress from canonical mappings
    ↓
Return: {message, field_completed, all_completed, current_field, progress}
    ↓
Update UI with AI response
Update progress bar
Check if all fields completed
```

### 3. Complete Submission
```
All fields completed (all_completed: true)
    ↓
AiChatInterface.vue::completeSubmission()
    ↓
AiChatController::completeSubmission()
    ↓
AiConversationEngine::completeSubmission()
    ↓
Finalize submission
Run FluentForm submission hooks
    ↓
Return: {success, submission_id, redirect_url}
    ↓
Show completion screen
Redirect if configured
```

---

## Configuration

### AI Chat Config Structure
```php
[
    'enabled' => true,                    // Enable/disable AI chat
    'model' => 'gpt-4',                   // OpenAI model
    'api_key' => 'sk-...',                // OpenAI API key (encrypted)
    'conversation_style' => 'friendly',   // Conversation style
    'system_prompt' => '...',             // Custom system prompt
    'display_mode' => 'overlay',          // Display mode (overlay/inline)
    'auto_submit' => false,               // Auto-submit when complete
]
```

### Session State Structure
```php
[
    'current_field' => 'email',           // Current field being asked
    'fields_completed' => ['name', ...],  // Completed field names
    'started_at' => '2025-11-21 10:00:00',
    'last_activity' => '2025-11-21 10:05:00',
]
```

---

## Key Technical Decisions

### 1. Form Parsing
- **Uses existing `Converter` class** instead of custom parser
- Ensures consistency with Conversational Forms
- Single source of truth for form structure

### 2. Database Storage
- **Uses existing FluentForm tables** (`fluentform_submissions`, `fluentform_submission_meta`)
- No new database migrations required
- Leverages existing Helper methods for meta operations

### 3. Class Inheritance
- **AiChatForm extends BaseForm** to reuse conversational form methods
- Proper separation of concerns
- Follows SOLID principles

### 4. Field Extraction
- **Single-field extraction only** - extracts one field per turn
- No fallback to multi-field extraction (removed for reliability)
- Uses field-specific extraction prompts based on field type
- Cleans and normalizes values based on field type (`cleanFieldValue()`)

### 5. Completion Detection
- **Backend determines completion purely from field mappings**, not AI message content
- Completion logic: `getNextField() === null AND count(completedFields) === count(questions)`
- Progress calculated from canonical `ai_field_mapping` meta
- When complete, engine always appends standard completion message
- No phrase-based detection (methods like `aiMessageIndicatesCompletion()` removed)

### 6. Field Type Key Structure
Questions from `Converter::convert()` have a specific structure that's critical for field type detection:

**Keys in Question Array:**
- `type`: Conversational field type (e.g., `'FlowFormEmailType'`, `'FlowFormTextType'`, `'FlowFormLongTextType'`)
- `ff_input_type`: Original FluentForm element type (e.g., `'input_email'`, `'input_text'`, `'textarea'`)
- **Note:** Questions do NOT have a `field_type` key

**Field Type Mapping (from Converter::fieldTypes()):**
```
FluentForm Element Type → Conversational Type
'input_text'           → 'FlowFormTextType'
'input_email'          → 'FlowFormEmailType'
'textarea'             → 'FlowFormLongTextType'
'input_number'         → 'FlowFormNumberType'
'phone'                → 'FlowFormPhoneType'
'input_url'            → 'FlowFormUrlType'
'input_date'           → 'FlowFormDateType'
'address'              → 'FlowFormAddressType'
'select'               → 'FlowFormDropdownType'
'select_country'       → 'FlowFormDropdownType'
'input_radio'          → 'FlowFormMultipleChoiceType'
'input_checkbox'       → 'FlowFormMultipleChoiceType'
```

**⚠️ CRITICAL:** When checking field types in code:
- ✅ **DO** use `$field['ff_input_type']` to check against FluentForm element types
- ❌ **DON'T** use `$field['type']` to check against FluentForm element types (it contains conversational types)
- ❌ **DON'T** use `$field['field_type']` (this key doesn't exist in questions)

**Example (CORRECT):**
```php
if ($field['ff_input_type'] === 'input_email') {
    // Handle email field
}
```

**Example (WRONG):**
```php
if ($field['type'] === 'email') {  // WRONG: $field['type'] is 'FlowFormEmailType', not 'email'
    // This will never match
}

$fieldType = Arr::get($field, 'field_type');  // WRONG: Returns null, key doesn't exist
```

---

## Testing Checklist

### Backend
- [ ] Start conversation creates submission
- [ ] Messages are saved to database
- [ ] Field values are extracted correctly
- [ ] Validation works for all field types
- [ ] Completion triggers submission hooks
- [ ] Cleanup deletes old incomplete submissions

### Frontend
- [ ] Chat interface loads correctly
- [ ] Messages display properly
- [ ] Progress bar updates
- [ ] Completion screen appears
- [ ] Error handling works
- [ ] Mobile responsive

### Admin
- [ ] Settings page loads
- [ ] API key validation works
- [ ] Configuration saves correctly
- [ ] Model selection works

---

## Known Issues & Solutions

### Issue: Field Type Key Mismatch in extractFieldValue()
**Symptom**: Field-specific extraction prompts never applied, extraction less accurate
**Cause**: Code checked `$field['type']` against values like `'email'`, `'input_text'`, but actual values are conversational types like `'FlowFormEmailType'`, `'FlowFormTextType'`
**Solution**: ✅ **FIXED** - Now uses `$field['ff_input_type']` which contains the original FluentForm element type (`'input_email'`, `'input_text'`, etc.)
**Fixed in**: Lines 851-859 in AiConversationEngine.php

### Issue: Field Type Key Mismatch in cleanFieldValue()
**Symptom**: Field values not cleaned/normalized properly, switch statement always hits default case
**Cause**: Code accessed `Arr::get($field, 'field_type')` but questions don't have `field_type` key
**Solution**: ✅ **FIXED** - Now uses `Arr::get($field, 'ff_input_type')` instead
**Fixed in**: Line 888 in AiConversationEngine.php

### Issue: Field Type Key Mismatch in isAddressField()
**Symptom**: Address field detection always fails
**Cause**: Code accessed `Arr::get($field, 'field_type', '')` but questions don't have `field_type` key
**Solution**: ✅ **FIXED** - Now uses `Arr::get($field, 'ff_input_type', '')` instead
**Fixed in**: Line 1002 in AiConversationEngine.php

### Issue: Progress Always Showing 0
**Symptom**: `progress.completed` always returns 0 even when fields are answered
**Cause**: Progress was calculated from session state instead of canonical field mappings
**Solution**: ✅ **FIXED** - Progress now calculated from `ai_field_mapping` meta (canonical source)

### Issue: Unreliable Completion Detection
**Symptom**: Completion detection based on phrases like "have a", "good day" was brittle
**Cause**: Phrase-based detection (`aiMessageIndicatesCompletion()`) was language/style-dependent
**Solution**: ✅ **FIXED** - Removed phrase-based detection entirely, now purely data-driven from field mappings

### Issue: Multi-field Extraction Fallback
**Symptom**: Unpredictable behavior when current field extraction failed
**Cause**: Fallback to `extractAllFieldValues()` could extract wrong fields
**Solution**: ✅ **FIXED** - Removed multi-field extraction entirely, strict single-field mode only

---

## Maintenance Notes

### Adding New Field Types
1. Update `Converter` class (shared with Conversational Forms) to map new FluentForm element type to conversational type
2. Ensure `Converter::buildBaseQuestion()` includes both `type` (conversational) and `ff_input_type` (original) keys
3. Add validation logic in `AiConversationEngine::validateFieldValue()` if needed
4. Add field-specific extraction prompt in `AiConversationEngine::extractFieldValue()` using `$field['ff_input_type']`
5. Add field-specific cleaning logic in `AiConversationEngine::cleanFieldValue()` using `$field['ff_input_type']`

### Changing AI Behavior
1. Update system prompt in `AiConversationEngine::buildMessages()`
2. Adjust extraction prompts in `extractFieldValue()` (single-field only, no multi-field method)
3. Test thoroughly with various user inputs
4. Remember: Completion message is always appended by engine when `isAllCompleted` is true

### Performance Optimization
- Conversation history is limited to last 10 messages
- API calls are cached where possible
- Cleanup runs automatically to prevent database bloat

---

## Code Examples

### Enable AI Chat for a Form

```php
use FluentForm\App\Modules\AiChat\Services\AiMetaStorage;

$storage = new AiMetaStorage();
$storage->saveAiConfig($formId, [
    'enabled' => true,
    'model' => 'gpt-4',
    'api_key' => 'sk-your-openai-api-key',
    'conversation_style' => 'friendly',
    'auto_submit' => false,
]);
```

### Start a Conversation Programmatically

```php
use FluentForm\App\Modules\AiChat\Services\AiConversationEngine;

$engine = new AiConversationEngine();
$response = $engine->startConversation($formId, $userId);

// Returns: ['submission_id' => 123, 'message' => '...', 'progress' => [...]]
```

### Process User Message

```php
$response = $engine->processUserResponse($submissionId, $formId, $userMessage);

// Returns: [
//   'message' => '...',
//   'field_completed' => true,
//   'all_completed' => false,
//   'current_field' => 'phone',
//   'progress' => ['completed' => 2, 'total' => 5],
//   'validation_errors' => []
// ]
```

### Get Conversation History

```php
use FluentForm\App\Modules\AiChat\Services\AiMetaStorage;

$storage = new AiMetaStorage();
$history = $storage->getConversationHistory($submissionId);

// Returns array of messages: [['role' => 'user', 'content' => '...'], ...]
```

### Validate API Key

```php
use FluentForm\App\Modules\AiChat\Services\OpenAiService;

$service = new OpenAiService($apiKey, 'gpt-3.5-turbo');
$isValid = $service->validateApiKey($apiKey);
```

### Access AI Chat Page

```
# Standalone page
https://yoursite.com/?fluent-form-ai=54

# Shortcode
[fluentform_ai_chat id="54"]
```

---

## Support & Resources

- **OpenAI API Docs**: https://platform.openai.com/docs
- **FluentForm Docs**: https://fluentforms.com/docs
- **Vue.js Docs**: https://vuejs.org

---

**End of Technical Documentation**


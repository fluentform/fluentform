# AI Chat Extraction API Call Evaluation

## Current Architecture: 2 API Calls Per User Message

### Call 1: Extraction (~87 tokens)
**Purpose:** Parse natural language into structured field value

**Example Request:**
```
System: "You are a data extraction assistant. Extract only the requested value from user messages."
User: "Extract ONLY the value for the field 'Email' from this user message: 'My email is john@example.com'
       Return ONLY the extracted value, nothing else."
```

**Example Response:**
```
john@example.com
```

**Token Cost:** ~87 tokens

---

### Call 2: Response Generation (~263 tokens)
**Purpose:** Generate conversational response for next field

**Example Request:**
```
System: [Full system prompt with form context, rules, etc.]
Progress: "2 out of 4 fields completed"
Already Collected: "✓ Name: John, ✓ Email: john@example.com"
Current Focus: "The field 'Phone Number' is next"
History: [Previous conversation]
User: "My email is john@example.com"
```

**Example Response:**
```
Thank you, John! I've saved your email address. Now, could you please provide your phone number?
```

**Token Cost:** ~263 tokens

---

## Alternative Architecture: 1 API Call (Combined)

### Single Call: Extraction + Response (~300 tokens)

**Approach:** Use structured output (JSON) to get both extraction and response

**Example Request:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "system",
      "content": "You are a conversational form assistant. For each user message:\n1. Extract the field value from their message\n2. Generate a conversational response\n\nReturn JSON: {\"extracted_value\": \"...\", \"response\": \"...\"}"
    },
    {
      "role": "user",
      "content": "Current field: Email\nUser message: 'My email is john@example.com'\n\nExtract the email and generate next response."
    }
  ],
  "response_format": { "type": "json_object" }
}
```

**Example Response:**
```json
{
  "extracted_value": "john@example.com",
  "response": "Thank you, John! I've saved your email address. Now, could you please provide your phone number?"
}
```

**Token Cost:** ~300 tokens (slightly less than 2 separate calls)

---

## Real-World Scenario Comparison

### Scenario 1: Simple Text Field (Name)

**User Input:** "My name is Robin"

| Architecture | API Calls | Tokens | Cost | Latency |
|--------------|-----------|--------|------|---------|
| Current (2 calls) | 2 | 350 | $0.00053 | 1.5-2.5s |
| Combined (1 call) | 1 | 300 | $0.00045 | 0.8-1.2s |

**Savings:** 14% cost, 40-50% latency

---

### Scenario 2: Email Field with Validation

**User Input:** "john@example.com"

| Architecture | API Calls | Tokens | Cost | Latency | Notes |
|--------------|-----------|--------|------|---------|-------|
| Current (2 calls) | 2 | 350 | $0.00053 | 1.5-2.5s | Extraction cleans email |
| Combined (1 call) | 1 | 300 | $0.00045 | 0.8-1.2s | Must handle cleaning in code |

**Trade-off:** Combined approach requires more regex/code-based cleaning

---

### Scenario 3: Choice Field with Partial Match

**User Input:** "online" (should match "Online Search")

| Architecture | API Calls | Tokens | Cost | Latency | Accuracy |
|--------------|-----------|--------|------|---------|----------|
| Current (2 calls) | 2 | 350 | $0.00053 | 1.5-2.5s | High - dedicated extraction |
| Combined (1 call) | 1 | 300 | $0.00045 | 0.8-1.2s | Medium - may miss edge cases |

**Risk:** Combined approach may have lower accuracy for fuzzy matching

---

### Scenario 4: Address Field (Complex)

**User Input:** "Lukman Nakib, 47, Jallarpar Sylhet Sadar, Sylhet, 01711429264"

| Architecture | API Calls | Tokens | Cost | Latency | Accuracy |
|--------------|-----------|--------|------|---------|----------|
| Current (2 calls) | 2 | 350 | $0.00053 | 1.5-2.5s | High - focused extraction |
| Combined (1 call) | 1 | 300 | $0.00045 | 0.8-1.2s | Medium - may truncate |

**Risk:** Combined approach may not extract full address correctly

---

### Scenario 5: Validation Error (Invalid Email)

**User Input:** "john.com" (invalid email)

| Architecture | API Calls | Tokens | Cost | Latency | Notes |
|--------------|-----------|--------|------|---------|-------|
| Current (2 calls) | 2 | 350 | $0.00053 | 1.5-2.5s | Extraction + validation + error response |
| Combined (1 call) | 1 + 1 retry | 600 | $0.00090 | 2.0-3.0s | Must retry after validation fails |

**Problem:** Combined approach requires retry, doubling cost for errors

---

## Cost Analysis (100 Form Submissions)

**Assumptions:**
- Average form: 5 fields
- 20% validation errors (1 retry per form)
- GPT-4o-mini pricing: $0.150 per 1M input tokens, $0.600 per 1M output tokens

### Current Architecture (2 Calls)
```
Normal exchanges: 5 fields × 100 forms = 500 exchanges
Error retries: 100 forms × 1 retry = 100 exchanges
Total exchanges: 600

Tokens per exchange: 350
Total tokens: 600 × 350 = 210,000 tokens
Cost: 210,000 × $0.0015 / 1000 = $0.315
```

### Combined Architecture (1 Call)
```
Normal exchanges: 5 fields × 100 forms = 500 exchanges
Error retries: 100 forms × 2 calls (extract + retry) = 200 exchanges
Total exchanges: 700

Tokens per exchange: 300
Total tokens: 700 × 300 = 210,000 tokens
Cost: 210,000 × $0.0015 / 1000 = $0.315
```

**Result:** Similar cost, but combined has worse latency for errors

---

## Pros and Cons

### Current Architecture (2 Calls)

**✅ Pros:**
1. **Separation of concerns** - Extraction is focused and accurate
2. **Better error handling** - Can validate before generating response
3. **Easier debugging** - Can see exactly what was extracted
4. **Higher accuracy** - Dedicated extraction prompt for each field type
5. **Cleaner code** - Each call has single responsibility

**❌ Cons:**
1. **Higher latency** - 2 sequential API calls (1.5-2.5s total)
2. **Slightly higher cost** - ~14% more tokens
3. **More complex flow** - Two separate API interactions

---

### Combined Architecture (1 Call)

**✅ Pros:**
1. **Lower latency** - Single API call (0.8-1.2s)
2. **Slightly lower cost** - ~14% fewer tokens (when no errors)
3. **Simpler flow** - One API interaction

**❌ Cons:**
1. **Lower accuracy** - AI must do two tasks at once
2. **Worse error handling** - Must retry entire call if extraction fails
3. **Higher cost on errors** - Validation errors require full retry
4. **More complex prompt** - Must handle both extraction and response
5. **Harder debugging** - Can't see intermediate extraction result
6. **JSON parsing overhead** - Must parse structured output

---

## Recommendation

### Keep Current Architecture (2 Calls) ✅

**Reasons:**

1. **Accuracy is Critical**
   - Form data must be extracted correctly
   - Validation errors are costly (user frustration)
   - Dedicated extraction call ensures high accuracy

2. **Error Handling**
   - Can validate BEFORE generating response
   - Don't waste tokens on response if extraction fails
   - Better user experience (immediate validation feedback)

3. **Debugging & Maintenance**
   - Can log extraction results separately
   - Easier to debug extraction vs response issues
   - Cleaner code with single responsibility

4. **Cost is Negligible**
   - $0.315 per 100 submissions is very low
   - 14% savings ($0.04) not worth accuracy trade-off
   - Latency matters more than $0.04

5. **Latency Can Be Optimized**
   - Can parallelize extraction + response in future
   - Can use streaming for response generation
   - Can cache common extractions

---

## Optimization Opportunities (Keep 2 Calls)

### 1. Reduce Extraction Tokens
**Current:** 87 tokens
**Optimized:** 50 tokens

```
System: "Extract field value only."
User: "Field: Email\nMessage: 'john@example.com'\nExtract:"
```

**Savings:** 37 tokens per exchange (42% reduction)

---

### 2. Reduce Response Tokens
**Current:** 263 tokens
**Optimized:** 180 tokens

- Remove redundant context
- Shorten system prompt
- Use conversation history more efficiently

**Savings:** 83 tokens per exchange (32% reduction)

---

### 3. Use Cheaper Model for Extraction
**Current:** GPT-4o-mini for both
**Optimized:** GPT-3.5-turbo for extraction only

**Savings:** 50% cost on extraction calls

---

### 4. Cache Extraction Patterns
**Idea:** Cache common extraction patterns (email, phone, name)
**Savings:** Skip API call for simple fields

---

## Final Verdict

**KEEP 2 API CALLS** but optimize token usage:

1. ✅ Keep separate extraction call for accuracy
2. ✅ Reduce extraction prompt from 87 to ~50 tokens
3. ✅ Reduce response prompt from 263 to ~180 tokens
4. ✅ Consider GPT-3.5-turbo for extraction only
5. ✅ Add caching for simple field types

**Expected Result:**
- Tokens: 350 → 230 (34% reduction)
- Cost: $0.315 → $0.207 per 100 submissions
- Latency: Same (1.5-2.5s)
- Accuracy: Same (high)

**Best of both worlds:** Lower cost while maintaining accuracy and error handling.


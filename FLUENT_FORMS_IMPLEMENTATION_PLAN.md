# Fluent Forms - 3-Person Team Implementation Plan

**Duration:** 24 weeks (~6 months)
**Team Size:** 3 developers
**Priority:** Block-Based Email → Balanced approach across all initiatives

## Team Structure

- **Developer A (Lead)**: Vue 3 migration, complex components, state management
- **Developer B**: Frontend/Vanilla JS, accessibility implementation, testing
- **Developer C**: Backend/PHP, block email system, integrations

## Overview of Initiatives

1. **Vanilla JS Rewrite** - Remove jQuery from frontend forms (~4,000 lines)
2. **Block-Based Email** - Build from scratch (HIGH PRIORITY)
3. **Vue 3 Migration** - All apps except global settings
4. **Integration Page Redesign** - Modern UI refresh
5. **Accessibility** - 100% WCAG 2.1 AA with phased rollout
6. **Dropdown Grouping** - Extend existing feature to all selects

---

## Phase 1: Foundation & Groundwork (Weeks 1-4)

### Developer A - Vue 3 Infrastructure

**1. Dual Build System [COMPLEX]**
- Modify `webpack.mix.js` for Vue 2 & Vue 3 simultaneously
- Create `resources/assets/admin-v3/` folder for Vue 3 apps
- Install Vue 3, Element Plus, Pinia alongside Vue 2 dependencies
- Configure separate build targets with isolated configs
- Test build isolation (no conflicts)
- **Files:** `webpack.mix.js`, `package.json`
- **Risk:** Build conflicts - use separate entry points and test thoroughly

**2. Pinia Store Setup [MEDIUM]**
- Install Pinia for Vue 3 state management
- Create base store structure in `resources/assets/admin-v3/stores/`
- Mirror current Vuex structure for consistency
- Document Options API usage patterns with Pinia (team preference)
- **Files:** New `stores/editor.js`, `stores/forms.js`
- **Dependencies:** Task 1 complete

**3. Component Library Mapping [SIMPLE]**
- Audit all 183+ Vue components for Element UI usage
- Map Element UI → Element Plus equivalents
- Document breaking changes in migration guide
- Create component migration checklist
- **Deliverable:** Migration guide document

### Developer B - Vanilla JS & Accessibility Foundation

**1. Frontend JS Architecture Design [MEDIUM]**
- Analyze `resources/assets/public/form-submission.js` (1,808 lines)
- Design modular ES6 class structure: FormHandler, Validator, Submission
- Plan event system without jQuery (CustomEvents, EventTarget)
- Document backward compatibility requirements
- **Files:** Create architecture docs
- **Risk:** Must maintain 100% API compatibility

**2. Payment Handler Rewrite [MEDIUM]**
- Rewrite `resources/assets/public/payment_handler.js` (913 lines)
- Remove all jQuery dependencies (`$` → `querySelector`, `fetch` → API calls)
- Convert to ES6 modules with classes
- Add JSDoc documentation
- Write unit tests (Jest)
- Test with Stripe, PayPal integrations
- **Files:** `resources/assets/public/payment_handler.js`
- **Risk:** Payment gateway breakage - extensive testing required

**3. Accessibility Audit [SIMPLE]**
- Audit forms for WCAG 2.1 AA compliance gaps
- Document current ARIA usage (aria-required, aria-invalid, aria-label found)
- Create testing checklist (keyboard nav, screen readers, focus management)
- Identify quick wins vs structural changes
- Test with NVDA, VoiceOver
- **Deliverable:** Accessibility gap analysis document

### Developer C - Block-Based Email System (PRIORITY)

**1. Block Editor Architecture Design [COMPLEX]**
- Research block libraries: GrapesJS, Unlayer, or custom solution
- Design block system architecture (drag-drop editor, block registry, renderer)
- Design block types: Text, Button, Image, Spacer, Form Data, Conditional
- Plan JSON schema for block storage
- Plan backward compatibility with current template system
- **Deliverable:** Technical design document
- **Risk:** Complex new system - thorough planning critical

**2. Database Schema & Migration [MEDIUM]**
- Design `wp_fluentform_email_templates` table schema
  - Columns: id, form_id, name, blocks (JSON), settings (JSON), created_at, updated_at
- Create migration scripts for existing email templates
- Plan conversion: plain text → single text block, HTML → parsed blocks
- Write rollback procedures
- **Files:** New migration in `database/migrations/`
- **Risk:** Data loss - extensive testing and backups required

**3. Core Block System Backend [COMPLEX]**
- Create block registry system in PHP
- Build block rendering engine: JSON → HTML email
- Implement shortcode parser for dynamic content (`{all_data}`, `{inputs.field}`)
- Create template-to-blocks converter for legacy emails
- Integrate with existing `EmailNotification.php`
- **Files:** New `app/Services/EmailBuilder/`, modify `app/Services/FormBuilder/Notifications/EmailNotification.php`
- **Dependencies:** Task 2 complete
- **Critical Files:**
  - `/app/Services/FormBuilder/Notifications/EmailNotification.php:292` - getEmailWithTemplate() method
  - Create new `/app/Services/EmailBuilder/BlockRenderer.php`

### Phase 1 Deliverables
✓ Dual Vue 2/3 build system functional
✓ payment_handler.js rewritten in vanilla JS
✓ Block email architecture finalized
✓ Database migrations ready
✓ Accessibility audit complete

---

## Phase 2: Core Block Email + First Vue 3 App (Weeks 5-8)

### Developer C - Block Email UI (Vue 3) [PRIORITY]

**1. Block Email Editor Component [COMPLEX]**
- Build drag-and-drop email editor using Vue 3 + Element Plus
- Create main editor component: `EmailBlockEditor.vue`
- Implement block toolbar, settings panels
- Add preview mode (desktop/mobile/plain text)
- Real-time HTML output preview
- **Files:** `resources/assets/admin-v3/email-editor/EmailBlockEditor.vue`
- **Dependencies:** Phase 1 backend complete
- **Risk:** Complex UI - allocate 2 weeks

**2. Standard Block Components [MEDIUM]**
- Text block with rich text editor (TinyMCE or Quill)
- Button block with styling options (colors, borders, padding)
- Image block with upload/media library
- Spacer/divider blocks
- Create block settings panels for each type
- **Files:** `resources/assets/admin-v3/email-editor/blocks/`
- **Dependencies:** Task 1 structure complete

**3. Dynamic Content Blocks [COMPLEX]**
- Form field data blocks with variable picker
- Conditional logic blocks (if payment status = completed, show X)
- Payment info blocks (amount, transaction ID)
- Entry URL block, admin URL block
- Dynamic data preview in editor
- **Files:** Same blocks folder, add dynamic rendering
- **Dependencies:** Task 2 complete
- **Risk:** Complex data binding and preview logic

### Developer A - First Vue 3 Migration

**1. Migrate Payment Entries App [MEDIUM]**
- Simplest app to start: `resources/assets/admin/payment_entries.js` (~300 lines)
- Convert to Vue 3 with Composition API for learning experience
- Replace Element UI components with Element Plus
- Update API calls if needed
- Test payment listing, filtering, sorting, detail view
- **Files:** `resources/assets/admin-v3/payment_entries.js`, `views/PaymentEntries.vue`
- **Dependencies:** Phase 1 infrastructure
- **Risk:** Low - isolated app, good learning opportunity

**2. Create Shared Vue 3 Components [MEDIUM]**
- Migrate common components: Notification, Pagination, LoadingSpinner
- Create base layout components for admin pages
- Build reusable component library structure
- Document component usage patterns
- **Files:** `resources/assets/admin-v3/components/common/`
- **Dependencies:** Task 1 learnings

**3. Document Vue 3 Patterns [SIMPLE]**
- Document migration lessons learned
- Create code snippets for common patterns (Options API with Pinia)
- Update team development guidelines
- Create troubleshooting guide
- **Deliverable:** Vue 3 migration handbook

### Developer B - Form Submission Rewrite + Accessibility

**1. Form Submission Core Rewrite Part 1 [COMPLEX]**
- Rewrite first 900 lines of `form-submission.js`
- Create `FormApp` main class structure
- Build validation engine (remove jQuery validation)
- Implement form serialization (FormData API)
- Remove jQuery from core logic
- **Files:** `resources/assets/public/form-submission.js`
- **Dependencies:** Phase 1 architecture
- **Risk:** HIGH - Most critical file, extensive testing required

**2. Feature Flag System [MEDIUM]**
- Add feature flag options table or use wp_options
- Create PHP helper: `FluentFormFeatures::isEnabled('accessibility_mode')`
- Add admin UI toggle in Global Settings → Advanced
- Implement frontend detection (data attribute or JS variable)
- **Files:**
  - New `app/Services/GlobalSettings/Features.php`
  - Modify `app/Http/Controllers/GlobalSettingsController.php`
  - Update `resources/assets/admin/settings/GlobalSettings.vue`
- **Risk:** Low - additive change

**3. Accessibility - Basic Form Fields [SIMPLE]**
- Fix all label associations (for/id already present - verify)
- Ensure aria-required on all required fields (line 206 BaseComponent.php)
- Add aria-invalid on error states (already present, verify JS updates it)
- Add aria-describedby for help text (MISSING - add to BaseComponent.php:280-288)
- Behind feature flag
- **Files:**
  - `app/Services/FormBuilder/Components/BaseComponent.php:280-288` (label markup)
  - `resources/assets/public/form-submission.js` (error state updates)
- **Risk:** Low - mostly additive changes behind flag

### Phase 2 Deliverables
✓ Block email editor functional with standard blocks
✓ Payment Entries app migrated to Vue 3
✓ 50% of form submission rewritten
✓ Feature flag system operational
✓ Basic accessibility improvements deployed

---

## Phase 3: Complete Block Email + Second Vue 3 App (Weeks 9-12)

### Developer C - Block Email Completion [PRIORITY]

**1. Email Template Management UI [MEDIUM]**
- Template library (save, load, duplicate templates)
- Template categories (Welcome, Notification, Payment, etc.)
- Import/export templates (JSON format)
- Preview and test email sending
- **Files:** `resources/assets/admin-v3/email-editor/TemplateLibrary.vue`
- **Dependencies:** Phase 2 editor complete

**2. Template Marketplace [MEDIUM]**
- Create 10-15 pre-built professional templates
- Template preview gallery with screenshots
- One-click template import
- Template search and filtering
- **Files:** `resources/assets/admin-v3/email-editor/TemplateGallery.vue`
- **Deliverable:** 15 production-ready email templates

**3. Migration Tools [COMPLEX]**
- Auto-convert plain text emails → single text block
- Auto-convert HTML emails → parsed blocks (use HTML parser)
- Batch migration UI for all forms
- Rollback functionality (revert to old template)
- Progress tracking during migration
- **Files:** New `app/Services/EmailBuilder/TemplateMigrator.php`
- **Dependencies:** All block features complete
- **Risk:** HIGH - data integrity critical, extensive testing required

**4. Testing & Polish [MEDIUM]**
- Cross-email client testing: Gmail, Outlook, Apple Mail, Yahoo, ProtonMail
- Mobile responsiveness testing
- Email size optimization (inline CSS, image optimization)
- Performance optimization
- Write user documentation
- **Dependencies:** All features complete
- **Risk:** Email rendering inconsistencies - use Litmus or Email on Acid

### Developer A - Reports App Migration

**1. Migrate Reports App to Vue 3 [COMPLEX]**
- Larger app: `resources/assets/admin/Reports/reports.js` (~867 lines)
- Convert to Options API (team preference)
- Migrate ECharts integration (update vue-echarts package)
- Update all report components (views, submissions, payments)
- Test data visualization rendering
- **Files:** `resources/assets/admin-v3/Reports/`
- **Dependencies:** Phase 2 Vue 3 infrastructure
- **Risk:** Medium - complex data visualization, verify ECharts compatibility

**2. Implement Pinia Stores [MEDIUM]**
- Create Pinia stores for reports data (useReportsStore)
- Add caching layer for report data
- Handle API interactions (axios → fetch or keep axios)
- Implement data refresh logic
- **Files:** `resources/assets/admin-v3/stores/reports.js`
- **Dependencies:** Task 1 in progress

**3. Testing & Performance [SIMPLE]**
- Test all report types (form views, submissions, conversion rates)
- Verify chart interactions (zoom, filter, export)
- Performance comparison vs Vue 2 version
- Fix any rendering issues
- **Dependencies:** Tasks 1-2 complete

### Developer B - Complete Vanilla JS + Expand Accessibility

**1. Form Submission Rewrite Part 2 [COMPLEX]**
- Complete remaining 900 lines of `form-submission.js`
- Multi-step form logic (step navigation, validation)
- Conditional logic handling (show/hide fields based on values)
- File upload handling (with progress)
- Form reset and repopulation
- **Files:** `resources/assets/public/form-submission.js`
- **Dependencies:** Phase 2 Part 1 complete
- **Risk:** HIGH - complex features, thorough testing required

**2. Advanced Form Features Rewrite [MEDIUM]**
- Rewrite `fluentform-advanced.js` (220 lines)
- Quiz functionality (scoring, results)
- Calculations (numeric field operations)
- Conditional redirects
- Integration with rewritten form-submission.js
- **Files:** `resources/assets/public/fluentform-advanced.js`
- **Dependencies:** Task 1 complete

**3. Accessibility - WCAG AA Compliance Phase 1 [COMPLEX]**
- Focus management after form submission
- Keyboard navigation improvements (Tab, Shift+Tab, Enter, Escape)
- Error announcements to screen readers (aria-live regions)
- Skip links for multi-step forms
- High contrast mode support (CSS @media prefers-contrast)
- **Files:**
  - `resources/assets/public/form-submission.js` (focus management)
  - `resources/assets/public/scss/fluent-forms-public.scss` (a11y styles)
  - `app/Services/FormBuilder/Components/BaseComponent.php` (aria-live regions)
- **Dependencies:** Phase 2 basic accessibility
- **Risk:** Medium - must not break existing custom styles

**4. Accessibility Testing Suite [MEDIUM]**
- Set up automated tests: axe-core, pa11y
- Create manual testing checklist
- Write screen reader test scripts (NVDA, JAWS, VoiceOver)
- Integrate into CI/CD pipeline
- **Files:** New `tests/accessibility/` directory
- **Deliverable:** Automated accessibility testing in CI/CD

### Phase 3 Deliverables
✓ Block-Based Email system 100% complete
✓ Reports app migrated to Vue 3
✓ All frontend vanilla JS rewrites complete (jQuery removed!)
✓ WCAG AA compliance ~60% complete
✓ Accessibility testing automated

---

## Phase 4: Form Builder + Integration Page (Weeks 13-16)

### Developer A - Form Editor Migration (Most Complex)

**1. Form Editor Core Migration [COMPLEX]**
- Migrate `FormEditor.vue` (1,489 lines - LARGEST component)
- Replace vddl (Vue 2 drag-drop) with Vue 3 alternative:
  - Option 1: Sortable.js with vue3-sortable
  - Option 2: @vueuse/integrations with Sortable.js
- Migrate element sidebar (field library)
- Form dropzone functionality with drag-drop
- **Files:** `resources/assets/admin-v3/views/FormEditor.vue`
- **Dependencies:** All previous Vue 3 migrations complete
- **Risk:** VERY HIGH - most critical app, allocate 2 weeks minimum
- **Critical:** Line 32-36 shows vddl-list usage to replace

**2. Form Editor Settings Migration [COMPLEX]**
- Migrate field settings panels (editor-field-settings folder)
- Conditional logic editor
- Advanced field options
- Field validation rules
- Element customization panels
- **Files:** `resources/assets/admin-v3/components/editor-field-settings/`
- **Dependencies:** Task 1 core complete
- **Risk:** High - many components to migrate

**3. Form Editor Components [MEDIUM]**
- Migrate 30+ editor-specific components
- Element customization components
- Field templates and previews
- Sidebar components
- **Files:** `resources/assets/admin-v3/components/editor/`
- **Dependencies:** Tasks 1-2 complete
- **Risk:** Medium - time-consuming but straightforward

### Developer C - Integration Page Redesign

**1. Integration UI/UX Design [SIMPLE]**
- Enhance current card-based layout (already good structure)
- Add search and filtering by category
- Category grouping (CRM, Email Marketing, Payments, etc.)
- Connection status indicators (connected/disconnected/error)
- Quick setup wizard UI
- **Deliverable:** UI mockups and component specs

**2. Integration Page Implementation Vue 3 [MEDIUM]**
- Build new integration cards with modern design
- Implement search/filter functionality
- Add quick connection flow (modal or drawer)
- Migrate integration settings components
- Update API endpoints if needed
- **Files:**
  - `resources/assets/admin-v3/views/Integrations.vue` (replaces 42-line current version)
  - `resources/assets/admin-v3/components/integrations/`
- **Dependencies:** Task 1 complete
- **Risk:** Medium - complex state management for connections

**3. Integration API Improvements [MEDIUM]**
- Standardize integration API endpoints (RESTful)
- Add webhooks management UI
- Connection health monitoring (test connection button)
- Integration logs and debugging
- **Files:**
  - `app/Http/Controllers/IntegrationController.php`
  - New `app/Services/Integrations/IntegrationHealthCheck.php`
- **Dependencies:** Task 2 structure ready

### Developer B - Dropdown Grouping + Accessibility

**1. Dropdown Option Grouping Extension [MEDIUM]**
- Review existing implementation in `SelectCountry.php:59-68`
- Extend to all select fields: Select, Multi-select, Dropdown
- Update PHP rendering in `Select.php`, `MultiSelect.php`
- Add `<optgroup>` support with label attribute
- Test with Choices.js library (used for enhanced selects)
- **Files:**
  - `app/Services/FormBuilder/Components/Select.php`
  - `app/Services/FormBuilder/Components/MultiSelect.php`
- **Risk:** Low - pattern already exists in SelectCountry.php

**2. Option Group UI in Form Builder [MEDIUM]**
- Add "Group" column in options editor (select-options.vue)
- Enable drag-and-drop group reordering
- Group label customization
- Live preview in editor
- Bulk edit support for grouping
- **Files:** `resources/assets/admin-v3/components/editor-field-settings/templates/select-options.vue`
- **Dependencies:** Task 1 backend complete
- **Risk:** Low - UI enhancement

**3. Accessibility - Forms & Controls Phase 2 [MEDIUM]**
- Accessible date pickers (keyboard navigation, aria-labels)
- Proper fieldset/legend for radio/checkbox groups (currently missing - see Checkable.php:95-99 commented)
- Select/multiselect screen reader improvements
- File upload accessibility (progress announcements)
- Range slider accessibility
- **Files:**
  - `app/Services/FormBuilder/Components/Checkable.php:95-99` (uncomment and implement fieldset)
  - `app/Services/FormBuilder/Components/DateTime.php`
  - `app/Services/FormBuilder/Components/FileUpload.php`
- **Dependencies:** Phase 3 accessibility
- **Risk:** Medium - fieldset may affect layout, behind feature flag

**4. Accessibility - Error Handling [SIMPLE]**
- Aria-live regions for dynamic error messages
- Focus management on validation errors (focus first invalid field)
- Clear, descriptive error messages
- Error summary at top of form
- **Files:**
  - `resources/assets/public/form-submission.js`
  - `resources/assets/public/scss/fluent-forms-public.scss`
- **Dependencies:** Task 3 in progress
- **Risk:** Low - behind feature flag

### Phase 4 Deliverables
✓ Form Editor migrated to Vue 3 (full functionality)
✓ Integration page redesigned and modernized
✓ Dropdown grouping available for all select types
✓ WCAG AA compliance ~80% complete

---

## Phase 5: Remaining Apps + Final Accessibility (Weeks 17-20)

### Developer A - Form Entries Migration

**1. Migrate Form Entries App [COMPLEX]**
- Large app: `Entries.vue` (1,287 lines)
- Entry list with filtering, sorting, pagination
- Entry detail view with notes
- Entry editor (inline editing)
- Bulk actions (delete, export)
- **Files:** `resources/assets/admin-v3/form_entries_app.js`, `views/Entries.vue`
- **Dependencies:** Form Editor migration complete
- **Risk:** High - complex data handling and state management

**2. Entry Components Migration [MEDIUM]**
- Entry notes system
- Entry filters (date range, status, field values)
- Visual reports in entries view
- Entry export functionality
- **Files:** `resources/assets/admin-v3/components/entries/`
- **Dependencies:** Task 1 core complete

### Developer C - Remaining Vue 3 Apps

**1. Migrate All Forms App [MEDIUM]**
- `AllForms.vue` (747 lines)
- Form listing and management
- Bulk actions (duplicate, delete, export)
- Form analytics preview
- Quick edit functionality
- **Files:** `resources/assets/admin-v3/all_forms_app.js`
- **Dependencies:** Previous migrations complete
- **Risk:** Low - straightforward CRUD interface

**2. Migrate Transfer App [SIMPLE]**
- Form import/export functionality
- File upload and processing
- API logs and debugging
- Small, isolated app
- **Files:** `resources/assets/admin-v3/transfer/transfer.js`
- **Risk:** Low

**3. Migrate Conversion Templates App [MEDIUM]**
- Conversational form designer
- Step-by-step form builder
- Preview and settings
- Unique UI but moderate complexity
- **Files:** `resources/assets/admin-v3/conversion_templates/conversational_design.js`
- **Dependencies:** Form Editor migration patterns
- **Risk:** Medium - specialized UI

### Developer B - Accessibility Completion

**1. Accessibility - Multi-step Forms Phase 3 [COMPLEX]**
- Step indicator accessibility (aria-current, role="progressbar")
- Progress announcements (aria-live for step changes)
- Step navigation keyboard support (arrow keys)
- Previous/Next button focus management
- Step validation before progression
- **Files:**
  - `resources/assets/public/form-submission.js`
  - `app/Services/FormBuilder/Components/FormStep.php`
- **Dependencies:** Phase 4 accessibility
- **Risk:** Medium - complex user flow

**2. Accessibility - Payment Forms [MEDIUM]**
- Payment field accessibility (Stripe, PayPal iframes)
- Secure field handling (screen reader announcements)
- Payment summary accessibility
- Receipt/confirmation announcements
- **Files:**
  - `resources/assets/public/payment_handler.js`
  - Payment integration components
- **Dependencies:** Task 1 complete

**3. Complete WCAG 2.1 AA Compliance [MEDIUM]**
- Color contrast fixes for all themes (4.5:1 minimum)
- Text resize support up to 200% (responsive em/rem units)
- Target size minimum 44x44px for all clickable elements
- Focus visible improvements (clear focus indicators)
- Landmarks and regions (header, main, footer roles)
- **Files:**
  - `resources/assets/public/scss/fluent-forms-public.scss`
  - `resources/assets/public/scss/default/_global.scss`
- **Dependencies:** All previous accessibility tasks
- **Risk:** Medium - may require theme style adjustments

**4. Accessibility Testing & Documentation [SIMPLE]**
- Full WCAG audit with automated tools (axe-core, pa11y)
- Manual screen reader testing: NVDA (Windows), JAWS (Windows), VoiceOver (macOS/iOS)
- Keyboard-only navigation testing
- Write accessibility documentation for users
- Create accessibility statement
- **Deliverable:** Accessibility compliance report and user documentation
- **Dependencies:** Task 3 complete

### Phase 5 Deliverables
✓ All admin Vue apps migrated to Vue 3 (except global settings)
✓ 100% WCAG 2.1 AA compliance achieved
✓ Accessibility feature flag ready for promotion to default
✓ Complete accessibility documentation published

---

## Phase 6: Final Polish & Production Release (Weeks 21-24)

### All Developers - Team Effort

**1. Remove Vue 2 Build System [MEDIUM] - Developer A**
- Remove Vue 2 from `webpack.mix.js` (line 65-68)
- Remove Element UI dependencies from `package.json`
- Clean up dual build configuration
- Remove old `resources/assets/admin/` folder (keep backup)
- Update all build scripts
- Verify all admin pages load correctly
- **Files:** `webpack.mix.js`, `package.json`
- **Dependencies:** ALL Vue 3 migrations complete
- **Risk:** Medium - test all admin pages thoroughly

**2. Performance Optimization [MEDIUM] - All**
- Code splitting for Vue 3 apps (lazy load routes and components)
- Implement lazy loading for heavy components
- Bundle size optimization (tree-shaking, minification)
- Vanilla JS file size comparison (should be 20-30% smaller)
- Analyze with webpack-bundle-analyzer
- **Dependencies:** All code complete
- **Risk:** Low

**3. Cross-Browser Testing [MEDIUM] - Developer B**
- Test all features in Chrome, Firefox, Safari, Edge
- Mobile browser testing (iOS Safari, Chrome Mobile)
- IE11 graceful degradation if needed (or drop support)
- Test email rendering in various clients
- Fix compatibility issues
- **Dependencies:** All features complete
- **Risk:** Medium - expect some compatibility issues

**4. Migration Documentation [SIMPLE] - Developer C**
- User-facing changelog (what's new, breaking changes)
- Developer migration guides
- Video tutorials for block email system
- Screenshot/GIF walkthroughs for new features
- Update plugin documentation site
- **Deliverable:** Complete documentation suite

**5. Beta Testing Program [MEDIUM] - All**
- Select 50-100 beta users from community
- Staged rollout strategy:
  - Week 1-2: 10% of sites (early beta)
  - Week 3-4: 25% of sites (expanded beta)
  - Week 5-6: 50% of sites (wide beta)
  - Week 7-8: 100% of sites (full release)
- Monitor error logs and analytics
- Collect feedback via surveys
- Create issue triage system
- **Dependencies:** Testing complete
- **Risk:** Low - staged approach minimizes risk

**6. Production Release [SIMPLE] - All**
- Final QA pass (full regression testing)
- Write comprehensive release notes
- Coordinate with marketing team
- Prepare support documentation
- Staged production rollout
- Monitor performance metrics
- **Dependencies:** Beta testing successful and issues resolved

### Phase 6 Deliverables
✓ Production-ready codebase
✓ Vue 2 completely removed
✓ Complete documentation published
✓ Successful production rollout to all users
✓ Post-launch monitoring established

---

## Risk Management & Mitigation

### Critical Risks

**1. Vue 2/3 Build Conflicts**
- **Risk:** Conflicting dependencies, build errors
- **Mitigation:** Use completely separate entry points and folders (`admin/` vs `admin-v3/`)
- **Fallback:** Keep builds in separate branches until transition complete

**2. Form Submission JS Breaking Changes**
- **Risk:** Forms stop working, data loss, payment failures
- **Mitigation:**
  - Maintain 100% API compatibility
  - Extensive testing with real forms
  - Feature flag for gradual rollout
  - Keep old version as fallback
- **Fallback:** Quick rollback to old JS file if critical issues found

**3. Accessibility Breaking Existing Styles**
- **Risk:** Custom CSS breaks, layout shifts, user complaints
- **Mitigation:**
  - All changes behind feature flag initially
  - CSS scoping for accessibility mode
  - Beta testing with design-heavy users
  - Per-feature flags if needed (e.g., fieldset can be separate flag)
- **Fallback:** Disable specific accessibility features if causing issues

**4. Block Email Data Migration**
- **Risk:** Data loss, corrupted templates, email sending failure
- **Mitigation:**
  - Thorough testing with various template types
  - Automatic backups before migration
  - Rollback scripts ready
  - Keep old email system alongside new for 1 release cycle
- **Fallback:** Manual template recreation if auto-migration fails

**5. Form Editor Migration Complexity**
- **Risk:** Editor becomes unstable, data loss, frustrated users
- **Mitigation:**
  - Split into 3 sub-tasks across 3+ weeks
  - Extensive testing with complex forms
  - Beta testing with power users
  - Backup/restore functionality
- **Fallback:** Keep Vue 2 Form Editor available for 1 extra release if needed

### Testing Strategy

**Per Feature:**
- **Unit Tests:** Jest for JS (target 70% coverage), PHPUnit for PHP
- **Integration Tests:** API endpoints, form submission flow
- **E2E Tests:** Playwright or Cypress for critical user flows
- **Visual Regression:** Percy or Chromatic for UI changes

**Accessibility:**
- **Automated:** axe-core and pa11y in CI/CD (every commit)
- **Manual:** Screen reader testing with NVDA, JAWS, VoiceOver
- **Keyboard:** Comprehensive keyboard navigation testing
- **Color:** Contrast validation with WCAG Color Contrast Checker

**Cross-Browser:**
- **Automated:** BrowserStack for multi-browser testing
- **Manual:** Real device testing on Windows, macOS, iOS, Android
- **Email:** Litmus or Email on Acid for email rendering

**Performance:**
- **Lighthouse CI:** Monitor Core Web Vitals
- **Bundle Size:** Track with bundlesize or similar tool
- **Load Time:** Monitor with Real User Monitoring (RUM)

---

## Feature Flag Implementation

### System Architecture

**1. Storage:**
```php
// wp_options table: 'fluentform_feature_flags'
[
  'accessibility_mode' => false,  // Default off initially
  'block_email_editor' => false,  // Beta only
  'vanilla_js_forms' => false,    // Gradual rollout
  'vue3_admin' => true           // Auto-enabled after migration
]
```

**2. PHP Helper:**
```php
// app/Services/GlobalSettings/Features.php
class Features {
    public static function isEnabled($feature) {
        $flags = get_option('fluentform_feature_flags', []);
        return !empty($flags[$feature]);
    }
}

// Usage in templates
if (Features::isEnabled('accessibility_mode')) {
    // Render accessible version
}
```

**3. Admin UI:**
- Location: Global Settings → Advanced → Feature Flags
- Toggle switches with descriptions
- "Experimental Features" warning banner
- Per-feature documentation links

**4. Frontend Detection:**
```javascript
// Injected in wp_localize_script
window.fluentFormFeatures = {
    accessibility: true,
    vanillaJs: true
}

// Usage in JS
if (window.fluentFormFeatures.accessibility) {
    // Enhanced focus management
}
```

### Rollout Strategy (Per Feature)

**Week 1-2:** Beta users only (5% of sites)
**Week 3-4:** Early adopters (25% of sites)
**Week 5-6:** General rollout (75% of sites)
**Week 7-8:** Full deployment (100% of sites, flag default = true)
**Next major version:** Remove flag, hardcode enabled

---

## Accessibility Implementation Details

### Phase-by-Phase Breakdown

**Phase 1: Additive Changes (Low Risk) - Phase 2**
- Add `aria-describedby` for help text (BaseComponent.php:242-253)
- Verify `aria-required` on required fields (already present line 206)
- Verify `aria-invalid` updated by JS on errors
- Add `aria-label` where missing
- All behind `accessibility_mode` flag

**Phase 2: Structural Changes (Medium Risk) - Phase 3-4**
- Implement focus management (JS in form-submission.js)
- Add keyboard navigation handlers (Tab, Arrow keys, Enter, Escape)
- Error announcement system (aria-live="polite" regions)
- Skip links for multi-step forms (`<a href="#step-2">Skip to step 2</a>`)
- High contrast mode CSS (`@media (prefers-contrast: high)`)

**Phase 3: Form Control Changes (Higher Risk) - Phase 4-5**
- Fieldset/legend for radio/checkbox groups (Checkable.php - currently commented out)
- Accessible date pickers with keyboard nav
- Color contrast fixes (may affect branding)
- Focus visible indicators (clear 2px outline minimum)
- Target size increases (44x44px minimum - may affect compact layouts)

### Testing Protocol (Per Phase)

1. **Automated:** Run axe-core in CI/CD on every commit
2. **Manual Screen Reader:** Test with 2 readers minimum (NVDA + VoiceOver)
3. **Keyboard Only:** Complete form flow without mouse
4. **Beta Testing:** 20-30 users focused on accessibility
5. **External Audit:** WCAG audit by third-party (recommended before Phase 6)

### Rollout Approach

1. **Phases 2-3:** Feature flag disabled by default
2. **Phase 4:** Opt-in beta testing announcement
3. **Phase 5:** Enabled by default for NEW installations only
4. **Phase 6:** Promoted to all users (existing + new)
5. **Next version:** Flag removed, accessibility always on

---

## Vue 3 Migration Details

### App Migration Order (Simple → Complex)

**Week 5:** Payment Entries (simplest, ~300 lines)
**Week 9:** Reports (medium, ~867 lines, chart integration)
**Week 13-15:** Form Editor (most complex, 1,489 lines, 3 weeks)
**Week 17:** Form Entries (large, 1,287 lines)
**Week 18:** All Forms (medium, ~747 lines)
**Week 19:** Transfer (simple, isolated)
**Week 19:** Conversion Templates (medium, unique UI)

**NOT migrated:** Global Settings (stays Vue 2 per requirements)

### Element UI → Element Plus

**Breaking Changes to Watch:**
- `el-form` validation API changes
- `el-table` event naming (`selection-change` → `selectionChange`)
- `el-dialog` close event changes
- `this.$message()` → `import { ElMessage }`
- Color/theme SCSS variables renamed

**Migration Pattern:**
```vue
<!-- Most components are compatible with minor changes -->
<el-button type="primary" @click="handleClick">
  Button Text
</el-button>

<!-- But global methods need imports -->
<script>
import { ElMessage } from 'element-plus'

export default {
  methods: {
    showMessage() {
      // OLD: this.$message.success('Saved')
      // NEW:
      ElMessage.success('Saved')
    }
  }
}
</script>
```

### State Management: Vuex → Pinia (Options API)

**Current Vuex (Simple):**
```javascript
// store/index.js
state: { fieldMode: 'add', editingField: null }
mutations: { setFieldMode, setEditingField }
actions: { async fetchComponents() {...} }
```

**Pinia Equivalent:**
```javascript
// stores/editor.js
import { defineStore } from 'pinia'

export const useEditorStore = defineStore('editor', {
  state: () => ({
    fieldMode: 'add',
    editingField: null
  }),
  actions: {
    setFieldMode(mode) {
      this.fieldMode = mode
    },
    async fetchComponents() {
      // ...
    }
  },
  getters: {
    isEditMode: (state) => state.fieldMode === 'edit'
  }
})
```

**Options API Usage (Team Preference):**
```vue
<script>
import { mapStores } from 'pinia'
import { useEditorStore } from '@/stores/editor'

export default {
  computed: {
    ...mapStores(useEditorStore),
    fieldMode() {
      return this.editorStore.fieldMode
    }
  },
  methods: {
    updateMode(mode) {
      this.editorStore.setFieldMode(mode)
    }
  }
}
</script>
```

### Drag-and-Drop Migration (Critical for Form Editor)

**Current (Vue 2):** vddl library (line 32-36 FormEditor.vue)

**Options for Vue 3:**

**Option 1: Sortable.js + @shopware-ag/vue3-sortable**
```vue
<Sortable
  :list="form.dropzone"
  @end="handleDrop"
  item-key="uniqElKey"
  handle=".drag-handle"
>
  <template #item="{element, index}">
    <!-- field component -->
  </template>
</Sortable>
```

**Option 2: VueDraggable (vue.draggable.next)**
```vue
<draggable
  v-model="form.dropzone"
  @end="handleDrop"
  item-key="uniqElKey"
>
  <template #item="{element, index}">
    <!-- field component -->
  </template>
</draggable>
```

**Recommendation:** VueDraggable (Option 2) - more similar to vddl API, easier migration

---

## Critical Files Reference

### Block-Based Email System
- `/app/Services/FormBuilder/Notifications/EmailNotification.php:292` - Integration point
- `/app/Services/FormBuilder/Notifications/EmailNotificationActions.php`
- `/app/Views/email/template/` - Current templates (reference for migration)
- **NEW:** `/app/Services/EmailBuilder/BlockRenderer.php`
- **NEW:** `/app/Services/EmailBuilder/BlockRegistry.php`
- **NEW:** `/app/Models/EmailTemplate.php`
- **NEW:** `/resources/assets/admin-v3/email-editor/EmailBlockEditor.vue`

### Vanilla JS Rewrite
- `/resources/assets/public/form-submission.js` (1,808 lines) ⭐ CRITICAL
- `/resources/assets/public/fluentform-advanced.js` (220 lines)
- `/resources/assets/public/payment_handler.js` (913 lines)

### Vue 3 Migration - Form Editor
- `/resources/assets/admin/views/FormEditor.vue:32-36` (1,489 lines) ⭐ CRITICAL - vddl replacement
- `/resources/assets/admin/editor_app.js` - Entry point
- `/resources/assets/admin/store/index.js` - Vuex → Pinia
- `/resources/assets/admin/components/editor-field-settings/` - Many components
- `/webpack.mix.js:65-68` - Build config

### Accessibility Implementation
- `/app/Services/FormBuilder/Components/BaseComponent.php:280-288` - Label/aria markup
- `/app/Services/FormBuilder/Components/Checkable.php:95-99` - Fieldset (commented)
- `/resources/assets/public/form-submission.js` - Focus management
- `/resources/assets/public/scss/fluent-forms-public.scss` - A11y styles
- **NEW:** `/app/Services/GlobalSettings/Features.php` - Feature flags

### Integration Page Redesign
- `/resources/assets/admin/views/Integrations.vue` (42 lines - simple current)
- `/app/Http/Controllers/IntegrationController.php`
- **NEW:** `/resources/assets/admin-v3/integrations/IntegrationPage.vue`

### Dropdown Option Grouping
- `/app/Services/FormBuilder/Components/SelectCountry.php:59-68` - Reference implementation
- `/app/Services/FormBuilder/Components/Select.php` - Extend here
- `/resources/assets/admin/components/editor-field-settings/templates/select-options.vue`

---

## Success Metrics

### Per Initiative

**1. Vanilla JS Rewrite**
- ✓ Bundle size reduction: 20-30% smaller
- ✓ Performance: No regression in form submission time
- ✓ Compatibility: 100% backward compatible (all existing forms work)
- ✓ jQuery removal: 0 jQuery dependencies in frontend forms

**2. Block-Based Email**
- ✓ User adoption: 50% of new emails use blocks within 3 months
- ✓ Templates: 100+ community templates within 6 months
- ✓ Compatibility: 95%+ render correctly across email clients
- ✓ Migration: 99%+ automated migrations successful

**3. Vue 3 Migration**
- ✓ Build size: 15-25% reduction (Vue 3 is smaller than Vue 2)
- ✓ Performance: 10-20% faster initial admin page load
- ✓ Developer velocity: No slowdown post-migration
- ✓ Zero regressions in functionality

**4. Integration Page**
- ✓ User satisfaction: 80%+ positive feedback
- ✓ Connection success: 10% improvement in first-time connections
- ✓ Feature discovery: 30% increase in integration usage

**5. Accessibility**
- ✓ WCAG 2.1 AA: 100% compliance (axe-core score 100)
- ✓ Screen readers: Tested on 3+ readers (NVDA, JAWS, VoiceOver)
- ✓ Complaints: Reduce accessibility issues to near-zero
- ✓ Keyboard: 100% keyboard navigable

**6. Dropdown Grouping**
- ✓ Adoption: 20% of forms use grouping feature
- ✓ Satisfaction: 90%+ find it useful
- ✓ Compatibility: Zero issues with existing forms

---

## Timeline Summary

| Phase | Weeks | Focus | Key Deliverables |
|-------|-------|-------|------------------|
| **1** | 1-4 | Foundation | Infrastructure, architecture, planning |
| **2** | 5-8 | Block Email UI + First Vue 3 | Email editor, Payment Entries Vue 3, feature flags |
| **3** | 9-12 | Block Email Complete + Vanilla JS | Email system done, Reports Vue 3, JS rewrite done |
| **4** | 13-16 | Form Editor + Integrations | Editor Vue 3, new integration page, dropdown grouping |
| **5** | 17-20 | Remaining Apps + A11y | All Vue 3 apps, 100% WCAG compliance |
| **6** | 21-24 | Polish + Release | Testing, optimization, production launch |

**Total Duration:** 24 weeks (~6 months)

---

## Next Steps After Plan Approval

1. **Week 1 Day 1:**
   - Set up project management (Jira, Linear, or Trello)
   - Create all tasks from this plan
   - Hold team kickoff meeting
   - Assign Phase 1 tasks to developers

2. **Week 1 Day 2:**
   - Developer A: Start dual build system setup
   - Developer B: Begin payment handler rewrite
   - Developer C: Begin block email architecture design

3. **Weekly Cadence:**
   - Monday: Sprint planning and task assignment
   - Wednesday: Mid-week sync and blocker resolution
   - Friday: Demo progress and retrospective

4. **Communication:**
   - Daily async updates in Slack/Discord
   - Weekly demo to stakeholders
   - Bi-weekly user testing sessions (starting Phase 2)

---

## Conclusion

This plan provides a comprehensive 6-month roadmap for transforming Fluent Forms with:

- **Block-Based Email system** (built from scratch, prioritized)
- **Complete Vue 3 migration** (except global settings)
- **Modern vanilla JavaScript** (jQuery-free frontend)
- **100% WCAG 2.1 AA compliance** (accessible to all users)
- **Enhanced integration page** (modern UI)
- **Extended dropdown grouping** (all select fields)

The phased approach ensures steady progress with manageable risk, feature flags enable safe rollouts, and extensive testing guarantees quality. The plan balances high-priority work (Block Email) with parallel efforts to keep the team engaged and productive.

**Ready to begin implementation upon approval.**

# Fluent Forms - Customizable Contact Forms, Survey, Quiz, & Conversational Form Builder

**Contributors:** techjewel, adreastrian, heera, pyrobd, hrdelwar, dhrupo, wpmanageninja  
**Tags:** contact form, wp forms, forms, form builder, custom form  
**Requires at least:** 4.5  
**Tested up to:** 6.8
**Requires PHP:** 7.4  
**Stable tag:** 6.0.4
**License:** GPLv2 or later  
**License URI:** https://www.gnu.org/licenses/gpl-2.0.html

Get a fast contact form plugin. Create advanced forms using drag and drop form builder with all smart features.

[Download Link](https://wordpress.org/plugins/fluentform/)
## Project Setup

To clone and set up the project, follow these steps:

1. **Clone the repository:**
```bash
git clone https://github.com/fluentform/fluentform.git
```

2. **Navigate into the project directory:**
```bash
cd fluentform
```

3. **Install dependencies:**
```bash
npm install
```

4. **Run the development server:**
```bash
npm run dev | watch
```

5. **For production build:**
```bash
npm run production
```

Make sure you have Node.js and npm installed on your machine before running these commands.

## Directory Structure
```
├── app
│   ├── Api         # PHP API Utility classes
│   ├── Functions   # Global functions
│   ├── Hooks       # Actions and filters handlers
│   ├── Http        # REST API routes, controllers, policies
│   ├── Models      # Database Models
│   ├── Modules     # Ajax & Old Modules Services
│   ├── Services    # Module Services
│   ├── Views       # PHP view files
│   └── App.php
│
├── assets          # CSS, JS, media files
├── boot            # Plugin boot files
├── config          # Plugin framework config 
├── database        # Database migration files
├── guten_block     # Gutenberg block files
├── resources       # Vue & Js resources
├── language        # Language translation files
├── vendor          # Composer dependencies
│
└── fluentform.php  # Plugin entry file
```

## Description

### Fluent Forms is an advanced and lightweight Contact Form Builder

**Fluent Forms** is the ultimate user-friendly, customizable **drag-and-drop WP contact form plugin** that offers you all the powerful features. It is a perfect **no-code form builder** for both beginners and advanced users.

Anything from a simple contact form to a more advanced payment, quiz, or calculator form, Fluent Forms can meet virtually all your needs.

### Powerful Features available in the Free Version

* Drag & drop builder
* Smart conditional logic
* Conversational form
* 25+ ready-to-use input fields
* Reusable form templates
* Adjustable multi-column form layout
* Spam protection using reCAPTCHA, hCaptcha & more
* Email notification
* Form scheduling & restriction
* Export/import forms
* Export entries in CSV/Excel/ODS/JSON format
* Filter entries
* Form Finder
* Form Edit history
* Undo/redo
* Role manager
* Form analytics
* Visual data report
* Set default value for input fields or populate from URL parameters
* Custom CSS & JS
* Fully responsive & accessible for users with special needs
* Migrate from WPForms, Contact Form 7, Gravity Forms, Ninja Forms & Caldera Forms

### Features available in the Pro version

* 55+ input fields
* Payment integration
* Numeric calculation
* Multi-step form
* Advanced form styler
* Quiz & survey module
* Inventory management
* Dynamic field
* Advanced search filter
* Import form entries
* Admin approval
* Conditional confirmation messages
* Double opt-in
* Advanced form validation
* Auto-delete entries
* Landing page
* Geo-location provider
* SMS notifications
* Conditional email routing
* User registration
* Advanced post/CPT creation
* Address autocomplete
* 60+ third-party integrations (and more via Zapier)

## Installation

This section describes how to install the plugin and get it working.

1. Upload the plugin files to the `/wp-content/plugins/fluentform` directory, or install the plugin through the WordPress plugins screen directly.
2. Activate the plugin through the 'Plugins' screen in WordPress
3. Use the `Fluent Forms` -> `Global Settings` screen to configure the plugin

## Frequently Asked Questions

### Do I need coding skill to use Fluent Forms?

No, you don't need any pre-requisite programming knowledge to build beautiful forms. With Powerful drag and drop features you can build any simple or complex form.

### Will Fluent Forms slow down my website?

Absolutely not. We build Fluent Forms very carefully and maintained WP standards as well as we only load styles / scripts in the pages where you will use the Fluent Forms. Fluent Forms is faster than any form builder plugin. Fluent Forms only load less than 30KB css and js combined.

### Can I use conditional logics when building a form?

Yes, with our powerful conditional logic panel you can build any type of complex forms. You can add one or multiple conditional logics to any field and it will work like a charm.

### Can I build multi-column forms?

Yes, you can use 2 column or 3 column containers and you can build forms.

### Can I export/Import the form submission data?

Yes, you can export your data in CSV, Excel, ODS, JSON format. You can also import in pro version.

## Changelog

### 6.0.4 (Date: May 29, 2025) =
- Improve honeypot condition check
- Fix the net promoter score field's zero (0) value in the visual report
- Fix the multi-select values in the submission including commas
- Fix tooltip/help message
- Fix conversational form address field meta smartcode
- Fix conversational form section break image layout position
- Fix email attachment missing for WordPress subdirectory
- Fix conversational form name and address fields prefilled using URL params
- Fix keyword-based restriction if IPInfo access key is provided
- Fix conversational form invisible turnstile autoload
- Fix email notification/integration sending after payment status change to paid
- Fix turnstile with WP Rocket compatibility

### 6.0.3 (Date: April 16, 2025) =
- Adds hooks for disable captcha validation
- Adds filter to control response as html on checkable field
- Adds filter to control Mailchimp timout
- Improves rating field accessibility
- Fixes Cross-Site Scripting vulnerability CVE ID: CVE-2025-3615
- Fixes Textdomain early load
- Fixes cleantalk toggle in misc settings
- Fixes analytics visual report showing empty
- Fixes aria-label separately in address field

### 6.0.0 (Date: March 19, 2025)
- Adds Payment fields for free users (except coupon fields)
- Adds Stripe payment gateway for free users (1.9% fee per transaction)
- Adds Advanced Conditionals group for enhanced form logic
- Adds FluentFormAI for creating AI assisted forms
- Adds New Form Templates
- Improves hCaptcha settings saving method
- Improves Captchas Loading after first interactions on Popups
- Improves CleanTalk API
- Improves spam processing logs
- Fixes Stripe fields language issues
- Fixes "customer_name" issue for Stripe
- Fixes conditional {dynamic.} shortcode in Custom HTML fields
- Fixes front end facing site_url with home_url

### 5.2.12 (Date: February 18, 2025)
- Adds token-based spam protection for enhanced form security
- Adds Italian Language Translation
- Improve Honeypot Security for better bot detection
- Improve Turnstile appearance option names for clarity

[View complete changelog history](https://fluentforms.com/docs/changelog/)

## Support and Documentation

For additional information and support:

- [Demo](https://fluentforms.com/forms/)
- [User Guide](https://wpmanageninja.com/docs/fluent-form/)
- [Youtube Video Tutorials](https://www.youtube.com/playlist?list=PLXpD0vT4thWEY6CbwMISKDiXOd5KPC6wo)
- [Get Support](https://wpmanageninja.com/support-tickets/)
- [Official Facebook Community](https://www.facebook.com/groups/fluentforms/)

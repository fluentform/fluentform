## Phase 1 Discovery and Baseline Mapping

### 1.1 jQuery usage inventory (`resources/assets/public/form-submission.js`)

| Line range | jQuery API used | Category | Vanilla replacement |
|---|---|---|---|
| 1-13 | `jQuery(document).ready`, selector/filter, `animate`, `offset`, `height` | event/DOM/animation | `DOMContentLoaded`, `querySelectorAll`, `Element.getBoundingClientRect`, `window.scrollTo` |
| 27-41 | `$el.hasClass`, `$el.attr`, `$el.val` | DOM | `classList.contains`, `getAttribute`, `value` |
| 54-119 | `$theForm.attr`, `.removeClass`, `.addClass`, `.on`, `$('body').find` | DOM/event | `getAttribute`, `classList`, `addEventListener`, `querySelector` |
| 121-128 | `$theForm.trigger('update_slider', data)` | event | `dispatchEvent(new CustomEvent('update_slider', {detail:data}))` + bridge |
| 130-153 | `jQuery.Deferred`, `jQuery.param`, `jQuery.each`, `jQuery.when` | deferred/network | `Promise`, `URLSearchParams`, `Object.entries`, `Promise.all` |
| 157-200 | `.find(':input').filter`, `.closest`, `.val`, `serializeArray`, `$.param`, `$.map` | DOM/network | `querySelectorAll`, `closest`, `FormData`, `URLSearchParams` |
| 207-227 | `$.each`, `$(fileInput)...find(...).each`, `$.param` | DOM/network | `forEach`, `querySelectorAll`, `URLSearchParams` append |
| 231-247 | `find`, `$('<div/>')`, `.html`, `.show`, click callback using `$()` | DOM/event | `createElement`, `innerHTML/textContent`, `style.display`, `addEventListener` |
| 249-277 | `.find(...).data`, `$.param` | DOM/network | `querySelector`, `dataset`, `URLSearchParams` |
| 279-283 | `$(selector).remove/html`, `.find('.error').html('')`, `.hide()` | DOM | `remove`, `innerHTML=''`, `style.display='none'` |
| 301-320 | `$.post(...).then().fail().always()` | network/deferred | `fetch(...).then().catch().finally()` |
| 322-352 | `$theForm.trigger`, `triggerHandler`, `jQuery(document.body).trigger` | event | centralized bridge emit (native + jQuery when available) |
| 365-400 | `$('<div/>').html().insertAfter().focus()`, `slideUp` | DOM/animation | `createElement`, `insertAdjacentElement`, `focus`, CSS transition or `display:none` |
| 404-418 | `$theForm.hide/addClass/reset`, `jQuery(document.body).trigger('fluentform_reset')`, `animate` | DOM/event/animation | `style.display`, `classList`, `form.reset`, bridge emit, `scrollTo` |
| 421-496 | `.fail/.always`, `.find(...).data`, provider reset calls | network/DOM | `catch/finally`, `querySelector`, `dataset` |
| 499-516 | `.addClass/.removeClass`, `.prop`, `.attr` | DOM | `classList`, `disabled = true/false`, `setAttribute/removeAttribute` |
| 518-566 | nested `.find/.each/.not/.remove/.html/.css/.val/.change`, `$.each` | DOM/event | `querySelectorAll`, loops, `remove`, `innerHTML`, `style`, `value`, `dispatchEvent('change')` |
| 573-616 | delegated `$(document).on('submit'/'reset'/'keydown', selector, ...)`, `$(this).trigger('change')` | event | single delegated `document.addEventListener` + `matches/closest` + `dispatchEvent` |
| 623-641 | `el.prop`, `el.each`, `el.find`, `el.val`, `el.trigger('change')` | DOM/event | properties (`type`, `checked`, `defaultValue`), loops, dispatch change |
| 648-657 | `find('.ff-el-is-error').first`, `$('html, body').delay().animate` | DOM/animation | `querySelector`, `setTimeout + scrollTo` |
| 665-675 | `$(window).height/width` | DOM | `window.innerHeight/innerWidth` |
| 685-699 | `$('form...').find(...).not(...).filter(...)`, `.closest`, `.hasClass` | DOM | `querySelectorAll`, array filter, `closest`, `classList.contains` |
| 720-749 | `.empty`, `.find`, `.removeClass`, `$.each` | DOM | `innerHTML=''`, loops, `classList.remove` |
| 756-819 | `$.isEmptyObject`, `$.each`, `$('<div/>')`, `.append/.show`, delegated `.on('click',...)`, `animate` | DOM/event/animation | object checks, loops, `createElement`, `append`, event listeners, `scrollTo` |
| 827-845 | `getElement` via jQuery selectors, `.closest/.find/.append` | DOM | `querySelector` fallback chain, `closest`, `append` |
| 848-864 | delegated `.on('change', 'input,select,textarea', ...)` | event | event delegation with `closest` and target matching |
| 872-877 | `$('[data-name=...]')`/`[name=...]` querying with jQuery context | DOM | `form.querySelector` + escaped selectors |
| 879-913 | `.find(...).each`, `$(this)`, `.attr/.find` | DOM | `querySelectorAll`, loops, `dataset` |
| 915-919 | `jQuery(document.body).trigger('fluentform_init...')`, `$theForm.trigger('fluentform_init_single')` | event | centralized bridge emit |
| 920-983 | `.on('keypress'/'mouseenter'/'mouseleave'/'fluentform_first_interaction'/'ff_to_next_page ff_to_prev_page')`, `.offset/.outerWidth/.outerHeight/.css` | event/DOM | `addEventListener`, `getBoundingClientRect`, `style` |
| 988-1073 | `.find/.each`, `$(this)`, `.attr`, `.removeAttr`, `.removeData` | DOM | selector loops, `getAttribute/setAttribute/removeAttribute`, dataset cleanup |
| 1079-1094 | `jQuery.each`, `.find`, `$('<input>').attr(...).appendTo` | DOM | loops, `querySelector`, `createElement`, append |
| 1124-1416 | `jQuery('form...')`, `.each`, `.one/.on`, `jQuery.post().done().fail().always()`, delegated `jQuery(document).on`, `$.isFunction`, `$.each`, `$(...).data`, `jQuery.fn.mask`, `$(document).on('change',...)`, `.val/.trim` | event/network/DOM/deferred | `querySelectorAll`, one-time listeners, `fetch`, event delegation, `typeof`, loops, dataset, optional plugin guards |
| 1423-1710 | validation uses `$(element)`, `$.each`, `$.trim`, `$.isNumeric`, selector lookups for checked options | DOM/utility | native element properties, `for...of`, `String.trim`, `Number.isFinite`, `querySelectorAll(':checked')` |
| 1713-1759 | `$('form...')`, `$.each`, `$(document).on('ff_reinit')`, `$(formItem)` | DOM/event | `querySelectorAll`, loops, `document.addEventListener` delegation |
| 1763-1809 | `$('.ff_has_multi_select').each`, `$(this).data('choicesjs')` | DOM | `querySelectorAll`, `dataset`/element property cache |
| 1821-1829 | `jQuery('.fluentform').on('submit', '.ff-form-loading', ...)`, `jQuery('<div/>').insertAfter` | event/DOM | delegated submit listener + `createElement`/insertAfter |

### 1.2 Free consumer matrix (`resources/assets/public/**/*.js`)

| File | Event name | Subscription style |
|---|---|---|
| `resources/assets/public/form-save-progress.js` | `fluentform_init` | `$(document.body).on(...)` |
| `resources/assets/public/form-save-progress.js` | `ff_to_next_page` | `$theForm.on(...)` |
| `resources/assets/public/form-save-progress.js` | `ff_to_prev_page` | `$theForm.on(...)` |
| `resources/assets/public/fluentform-advanced.js` | `fluentform_init` | `$(document.body).on(...)` |
| `resources/assets/public/fluentform-advanced.js` | `update_slider` | `$theForm.on(...)` |
| `resources/assets/public/Pro/file-uploader.js` | `fluentform_reset` | `$(document.body).on(...)` |
| `resources/assets/public/Pro/calculations.js` | `fluentform_reset` | `jQuery(document).on(...)` |
| `resources/assets/public/Pro/form-conditionals.js` | `fluentform_reset` | `jQuery(document.body).on(...)` |
| `resources/assets/public/Pro/slider.js` | `ff_to_next_page` | emits via `self.$theForm.trigger` and `$(document).trigger` |
| `resources/assets/public/Pro/slider.js` | `ff_to_prev_page` | emits via `self.$theForm.trigger` and `$(document).trigger` |
| `resources/assets/public/Pro/slider.js` | `ff_to_next_page`/`ff_to_prev_page` | listens via `this.$theForm.on(...)` |
| `resources/assets/public/payment_handler.js` | `fluentform_submission_success` | `$form.on(...)` |
| `resources/assets/public/payment_handler.js` | `fluentform_submission_failed` | `$form.on(...)` |
| `resources/assets/public/payment_handler.js` | `fluentform_init_single` | `$form.on(...)` |
| `resources/assets/public/payment_handler.js` | `ff_reinit` | `$(document).on(...)` |
| `resources/assets/public/form-submission.js` | `fluentform_init` | emits via `jQuery(document.body).trigger(...)` |
| `resources/assets/public/form-submission.js` | `fluentform_init_<id>` | emits via `jQuery(document.body).trigger(...)` |
| `resources/assets/public/form-submission.js` | `fluentform_init_single` | emits via `$theForm.trigger(...)` |
| `resources/assets/public/form-submission.js` | `fluentform_submission_success` | emits via `triggerHandler`, `jQuery(document.body).trigger`, `CustomEvent` |
| `resources/assets/public/form-submission.js` | `fluentform_submission_failed` | emits via `$theForm.trigger`, `CustomEvent` |
| `resources/assets/public/form-submission.js` | `fluentform_reset` | emits via `jQuery(document.body).trigger(...)` |
| `resources/assets/public/form-submission.js` | `update_slider` | emits via `$theForm.trigger(...)` |
| `resources/assets/public/form-submission.js` | `ff_reinit` | listens via `$(document).on(...)` |

### 1.3 Pro consumer matrix (`../fluentformpro/src/assets/public/**/*.js`, `../fluentformpro/src/assets/js/**/*.js`)

| File | Event name | Subscription style |
|---|---|---|
| `../fluentformpro/src/assets/js/chatFieldScript.js` | `fluentform_init` | `$(document.body).on(...)` |
| `../fluentformpro/src/assets/js/chatFieldScript.js` | `fluentform_submission_success` | `$form.on(...)` |
| `../fluentformpro/src/assets/js/chatFieldScript.js` | `fluentform_submission_failed` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/payment_handler_pro.js` | `fluentform_reset` | `jQuery(document.body).on(...)` |
| `../fluentformpro/src/assets/public/payment_handler_pro.js` | `fluentform_submission_success` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/payment_handler_pro.js` | `fluentform_submission_failed` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/payment_handler_pro.js` | `fluentform_init_single` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/payment_handler_pro.js` | `ff_reinit` | `$(document).on(...)` |
| `../fluentformpro/src/assets/public/payment_handler.js` | `fluentform_submission_success` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/payment_handler.js` | `fluentform_submission_failed` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/payment_handler.js` | `fluentform_init_single` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/payment_handler.js` | `ff_reinit` | `$(document).on(...)` |
| `../fluentformpro/src/assets/public/razorpay_handler.js` | `fluentform_init_single` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/paystack_handler.js` | `fluentform_init_single` | `$form.on(...)` |
| `../fluentformpro/src/assets/public/authorizenet_accept_handler.js` | `fluentform_init_single` | `$form.on(...)` |

### 1.4 Public script dependency graph (`app/Modules/Component/Component.php`)

| Handle | Source | Deps | Has `jquery` dep? |
|---|---|---|---|
| `fluent-form-submission` | `fluentFormMix('js/form-submission.js')` | `['jquery']` | Yes |
| `fluentform-advanced` | `fluentFormMix('js/fluentform-advanced.js')` | `['jquery']` | Yes |
| `flatpickr` | `fluentFormMix('libs/flatpickr/flatpickr.min.js')` | `['jquery']` | Yes |
| `choices` | `fluentFormMix('libs/choices/choices.min.js')` | `[]` | No |
| `form-save-progress` | `fluentFormMix('js/form-save-progress.js')` | `['jquery']` | Yes |
| enqueue call | `wp_enqueue_script('fluent-form-submission')` | uses registered deps | indirect |
| enqueue call | `wp_enqueue_script('fluentform-advanced')` | uses registered deps | indirect |

### Phase 1 self-check

- [x] Table 1.1 covers all jQuery API usage ranges in `form-submission.js`.
- [x] Tables 1.2 and 1.3 include lifecycle + step events and subscription styles.
- [x] Table 1.4 captures current public dependency chain from `Component.php`.
- [x] No runtime JS/PHP source file was modified during discovery.

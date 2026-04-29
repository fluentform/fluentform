const { test } = require('@playwright/test');

test('inspect uploader runtime', async ({ page }) => {
  await page.goto('https://forms.test/?ff_landing=234&ffjqmode=disabled', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Next' }).click();
  await page.waitForTimeout(1000);
  const info = await page.evaluate(() => ({
    hasJquery: typeof window.jQuery === 'function',
    hasFileupload: !!(window.jQuery && window.jQuery.fn && window.jQuery.fn.fileupload),
    fileInputExists: !!document.querySelector('input[name="file-upload"]'),
    uploadHolderExists: !!document.querySelector('.ff_file_upload_holder'),
    uploadedListCount: document.querySelectorAll('.ff-uploaded-list').length,
    formLoaded: !!document.querySelector('form.frm-fluent-form')?.classList.contains('ff-form-loaded'),
    formClasses: document.querySelector('form.frm-fluent-form')?.className || '',
    fluentVarsFormId: window.fluentFormVars?.form_id || null,
    currentStepVisible: !!Array.from(document.querySelectorAll('.fluentform-step')).find((el) => getComputedStyle(el).display !== 'none' && el.querySelector('input[name="file-upload"]'))
  }));
  console.log(JSON.stringify(info));
});

(function () {

  function initElementorHooks() {
    if (!window.elementor || !elementor.hooks) {
      return;
    }

    elementor.hooks.addAction('panel/open_editor/widget/fluent-form-widget', function(panel, model) {
      updateEditLink(model);

      model.get('settings').on('change:form_list', function () {
        updateEditLink(model);
      });
    });
  }

  /**
   * Update edit link URL based on selected form
   */
  function updateEditLink(model) {
    const formId = model.get('settings')?.get('form_list');

    if (!formId || formId === '0') {
      return;
    }

    const panel = document.querySelector('#elementor-panel');

    if (!panel) {
      return;
    }

    const editLinks = panel.querySelectorAll('.fluentform-edit-link');
    const newUrl = getFormEditUrl(formId);

    editLinks.forEach(function (link) {
      link.href = newUrl;
      link.setAttribute('data-form-id', formId);
    });
  }

  /**
   * Build Fluent Forms edit URL
   */
  function getFormEditUrl(formId) {
    const adminUrl = window.fluentformElementor?.adminUrl || '/wp-admin/admin.php';

    const params = new URLSearchParams({
      page: 'fluent_forms',
      route: 'editor',
      form_id: formId
    });

    return adminUrl + '?' + params.toString();
  }

  /**
   * Boot
   */
  document.addEventListener('DOMContentLoaded', function () {
    initElementorHooks();
  });
})();

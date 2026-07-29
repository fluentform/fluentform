jQuery(document).ready(function ($) {
	fluentform_editor_vars.forms.unshift({value:'', text:'--Select Form--'});
    $('#fluent_form_insert_button').on('click', function (e) {
        e.preventDefault();
        var editor = tinyMCE.activeEditor;
        var uid = 'fluentform-forms-popup-error'+(new Date()).getTime();
		editor.windowManager.open({
			width: 400,
			height: 100,
			title: 'Add Form',
			body: [{
				type: 'listbox',
				name: 'form_id',
                label: 'Select a Form:',
                values: fluentform_editor_vars.forms
            }],
			onselect: function(e) {
				$('#'+uid).remove();
			},
			onsubmit: function(e) {
				if (e.data.form_id) {
					editor.insertContent('[fluentform id='+e.data.form_id+']');
				} else {
					e.preventDefault();
					var alert = e.target.$el.find('#'+uid);
					alert = alert.length || $('<div/>', {
						class:'error',
						id: uid,
						style: 'text-align:center;color:#dc3232',
						html: 'No form is selected!'
					}).appendTo(e.target.$el);
				}
			}
		});
    });
});

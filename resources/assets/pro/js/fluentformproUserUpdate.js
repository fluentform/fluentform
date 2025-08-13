(function ($) {
    let $form = getForm();
    if (!$form && !$form.length) return;

    // populate custom meta value
    ['acf_mappings',  'jetengine_mappings', 'metabox_mappings'].forEach(meta => {
        let data = window.fluentformpro_user_update_vars[meta];
        if (data) {
            populateCustomMetas(data, $form);
        }
    })

    //populate custom meta value
    function populateCustomMetas(data, $form) {
        $.each(data, (index, item) => {
            setValue($form, item);
        });
    }

    //set custom meta value
    function setValue($form, item) {
        let name = item.name;
        //handle name field
        if (name.includes('.')) {
            name = name.split('.').join('[') + ']';
        }
        let value = item.value;
        let $itemDom = $form.find('[data-name="' + name + '"]');

        // if data-name attribute not available
        if (!$itemDom.length) {
            $itemDom = $form.find('[name="' + name + '"]');
        }

        if ($itemDom.length) {
            //set custom meta value based on field type
            switch (item.type) {
                case 'image':
                case 'image_upload':
                case 'single_image':
                case 'gallery':
                case 'media':
                    setImageOrFileValue($itemDom, value, name, 'img');
                    break;
                case 'file':
                case 'file_upload':
                case 'file_input':
                case 'file_advanced':
                    setImageOrFileValue($itemDom, value, name, 'file');
                    break;
                case 'select':
                case 'image_select':
                case 'checkbox':
                case 'radio':
                case 'button_group':
                case 'checkbox_list':
                    setSelectOrCheckboxValue($itemDom, value);
                    break;
                case 'date_picker':
                case 'date_time_picker':
                case 'time_picker':
                case 'jetengine_date_type':
                    setDateTimeValue($itemDom, value, item.type);
                    break;
                case 'repeater':
                    setRepeaterValue($itemDom, value);
                    break;
                case 'wysiwyg':
                    if ($itemDom.hasClass('fluentform-post-content')) {
                        const editorId = $itemDom.attr('id') || '';
                        tinyMCE.get(editorId)?.setContent(value);
                    } else {
                        $itemDom.val(value);
                    }
                    break;
                default:
                    if (typeof value === 'string') $itemDom.val(value);
                    break;
            }
            $itemDom.change();
        }
    }

    //return this form
    function getForm () {
        const formId = window.fluentformpro_user_update_vars['form_id']
        if (!formId) return null;
        return $(`form#fluentform_${formId}`);
    }

    //set DateTime value
    function setDateTimeValue($itemDom, value, type) {
        let acfMetaDateFormat;
        if (type === 'date_picker') {
            acfMetaDateFormat = 'Ymd';
        } else if (type === 'date_time_picker') {
            acfMetaDateFormat = 'Y-m-d H:i:s';
        } else if (type === 'time_picker') {
            acfMetaDateFormat = 'H:i:s';
        }
        if ($itemDom.length > 0 && $itemDom[0]._flatpickr) {
            const $input = $itemDom[0]._flatpickr;
            const date = $input.parseDate(value, acfMetaDateFormat) || value;
            $input.setDate(date);
        } else {
            $itemDom.val(value);
        }
    }

    //set select type value
    function setSelectValue($itemDom ,value = '') {
        if (!value) {
            value = '';
        }
        if (typeof value !== 'string') {
            if (value.length > 0) {
                value = value.map(v => v.value ? v.value.toString() : v.toString())
            } else {
                value = value.toString();
            }
        }
        if ($itemDom.hasClass('ff_has_multi_select')) {
            if ($itemDom.data('choicesjs')) {
                $itemDom.data('choicesjs').removeActiveItems(value);
                $itemDom.data('choicesjs').setChoiceByValue(value);
            }
        } else {
            $itemDom.val(value);
        }
    }

    function setSelectOrCheckboxValue($itemDom, value){
        let isSelect = $itemDom.attr('type') === 'select' ||
            $itemDom.prop('nodeName').toLowerCase() === 'select';
        if (isSelect) {
            setSelectValue($itemDom, value);
        } else {
            setCheckboxValue($itemDom, value);
        }
    }

    //set checkbox type value
    function setCheckboxValue($itemDom, value=[]) {
        let gdpr_checkbox = false;
        if (typeof value === 'string' || typeof value === 'number') {
            if (value === "1") {
                gdpr_checkbox = true;
            }

            if (value.includes(',')) {
                value = value.split(',')
            } else {
                value = [value];
            }
        }
        if (typeof value === "object" && !Array.isArray(value)) {
            value = Object.keys(value);
        }
        value = [].concat(...value);
        let values = value.map(v => v.value ? v.value.toString().trim() : v.toString().trim());
        $itemDom.each((i, checkbox) => {
            let $checkbox = $(checkbox);
            if ($.inArray($checkbox.val(), values) !== -1 || ($checkbox.val() === 'on' && gdpr_checkbox)) {
                $checkbox.closest('.ff-el-form-check').addClass('ff_item_selected');
                $checkbox.prop('checked', true);
            } else {
                $checkbox.prop('checked', false);
            }
        });
    }

    //set repeater type value
    function setRepeaterValue($itemDom, repeatValues=[]) {
        if (!repeatValues || !repeatValues?.length) {
            return;
        }
        const $table = $itemDom.find('table');
        const $tr = $table.find('tbody tr');

        let maxRepeat = parseInt($table.attr('data-max_repeat'));

        // make repeater table tow base on repeater values
        repeatValues.forEach(item => {
            const existingCount = $table.find('tbody tr').length - 1; // Repeater field initially have a table row. -1 for exact row count.
            if (maxRepeat && existingCount === maxRepeat) {
                $table.addClass('repeat-maxed');
                return;
            }
            let $freshCopy = $tr.clone();
            const values = Object.values(item);
            $freshCopy.find('td').each(function (i, td) {
                let el = jQuery(this).find('.ff-el-form-control:last-child');
                let dataMask = el.attr('data-mask');
                if (dataMask) {
                    el.mask(dataMask);
                }

                let newId = 'ffrpt-' + (new Date()).getTime() + i;
                const value = values[i] || '';
                let itemProp = {
                    value: value,
                    id: newId
                };
                el.prop(itemProp);
            });
            $freshCopy.insertBefore($tr);
        })
        $tr.remove(); // Remove initial table row

        // Now let's fix the name
        const rootName = $table.attr('data-root_name');
        let firstTabIndex = 0;
        $table.find('tbody tr').each(function (i, td) {
            const els = jQuery(this).find('.ff-el-form-control');
            els.each(function (index, el) {
                let $el = jQuery(el);
                if(i === 0) {
                    firstTabIndex = $el.attr('tabindex');
                }
                $el.prop({
                    'name': rootName+'['+i+'][]'
                });
                $el.attr('data-name',  rootName+'_'+index+'_'+i);
                if(firstTabIndex) {
                    $el.attr('tabindex',  firstTabIndex);
                }
            });
        });
        $table.trigger('repeat_change');
    }

    // show acf image or file
    function setImageOrFileValue($itemDom , value, name, type = 'img') {
        if (Array.isArray(value) && value.length > 0) {
            $.each(value,(i, item) => {
                setImageOrFileValue($itemDom , item, name, type)
            })
        } else {
            const attachmentId = getAttachmentId(value);
            const confirmRemoveInput = `<input type="hidden" name="remove-attachment-key-${name}[]" value="${attachmentId}">`;
            let div = previewImgOrFileWithCloseButton($itemDom, value, confirmRemoveInput, type); // create preview section
            if (attachmentId) {
                $itemDom.closest('.ff-el-input--content').append(`<input type="hidden" name="existing-attachment-key-${name}[]" value="${attachmentId}">`);
            }
            $itemDom.closest('.ff-el-input--content').append(div);
        }
    }

    //return image or file div preview
    function previewImgOrFileWithCloseButton($thumbnailWrap, value, confirmRemoveInput, type= 'img'){
        if (!value || (Array.isArray(value) && !value.length)) {
            return '';
        }
        if (value?.type === 'image') {
            type = 'img';
        }
        let div = $("<div/>", {
            class: 'ff-post-update-thumb-wrapper',
            css: {
                position: "relative",
                "padding-top": "5px",
            }
        });
        let close = $("<span/>", {
            text : "X",
            title :'Remove ' + (type === 'file' ? 'File' : 'Image'),
            'data-attachment-id' : getAttachmentId(value),
            css: {
                position: 'absolute',
                background:'#f00',
                "border-radius":'50%',
                color :'#fff',
                right :'-3px',
                top :'-3px',
                width :'15px',
                height :'15px',
                display :'flex',
                "align-items" :'center',
                "justify-content" :'center',
                "font-weight":"700",
                "font-size":"10px",
                cursor :'pointer',
                'z-index' : 1
            },
            on:{
                click : function () {
                    $(this).closest('.ff-el-input--content').append(confirmRemoveInput);
                    div.remove();
                }
            }
        });
        let preview = '';
        if (typeof value === 'string' && type === 'file') {
            let name = value.split(/(\\|\/)/g).pop();
            let extention = name.split('.').pop().toLowerCase().trim();
            let images = ['png', 'jpg', 'gif' , 'jpeg', 'webp', 'bmp'];

            if (!images.includes(extention)) {
                let fileObj = {};
                fileObj.url = value;
                fileObj.filename = name;
                fileObj.filesize = getFileSize(value);
                value = fileObj
            }
        }
        if(type === 'file' && typeof value !== 'string') {
            preview = filePreviewHtml(value, parseInt($thumbnailWrap.closest('.ff-el-group').width()));
        } else {
            if (typeof value !== 'string') {
                value = value?.url
            }
            preview = '<div style="max-width: 200px;border-radius: 5px;overflow: hidden;"><img class="ff-post-update-thumb" style="width: 100%;" src="' + value + '" ></div>'
        }
        div.append(close);
        div.append(preview);
        return div;
    }

    // get file size
    function getFileSize(url) {
        var fileSize = 0;
        var http = new XMLHttpRequest();
        http.open('HEAD', url, false); // false = Synchronous

        http.send(null); // it will stop here until this http request is complete

        // when we are here, we already have a response, b/c we used Synchronous XHR
        if (http.status === 200) {
            fileSize = http.getResponseHeader('content-length');
        }
        return parseInt(fileSize);
    }

    //return file div preview
    function filePreviewHtml(value, filenameMaxWidth = 140) {
        filenameMaxWidth -= 91; // 91px is preview thumb width
        value.filesize = value?.filesize || value?.filesizeInBytes;
        return `
                    <div class="ff-upload-preview" data-src="">
                        <div class="ff-upload-thumb">
                            <div class="ff-upload-preview-img" style="background-image: url('${value?.url}');">
                            
                            </div>
                        </div>
                        <div class="ff-upload-details">
                            <div class="ff-upload-filename" style="max-width: ${ filenameMaxWidth }px;">${value?.filename? value.filename : value?.name}</div>
                                <div class="ff-upload-progress-inline ff-el-progress">
                                    <div class="ff-el-progress-bar" style="width: 100%;"></div>
                                </div>
                                <div class="ff-upload-filesize ff-inline-block">${value?.filesize ? (value.filesize / 1024).toFixed(2) : 0} KB</div>
                                <div class="ff-upload-error" style="color:red;"></div>
                            </div>
                        </div>
                    </div>
               `;
    }

    function getAttachmentId(value) {
        return typeof value === 'string' ? '' : (value?.ID || value?.id || '');
    }
}(jQuery));


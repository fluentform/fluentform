export default function ($, $form, form, fluentFormVars, formSelector) {
    /**
     * Get translated upload message
     * @param {string} key - Message key
     * @param {string} fallback - Fallback message
     * @return {string}
     */
    var getUploadMessage = function(key, fallback) {
        var messagesVar = 'fluentform_upload_messages_' + form.id;
        if (window[messagesVar] && window[messagesVar][key]) {
            return window[messagesVar][key];
        }
        return fallback;
    };

    /**
     * Register file uploaders
     * @return {void}
     */
    var initUploader = function () {

        if (!jQuery.fn.fileupload) {
            return;
        }

        $form.find('input[type="file"]').each(function (key, el) {
            var element = $(this),
                uploadedList;

            // max width for 4,5,6 column container image
            let elGroup = element.closest('.ff-el-group'),
                maxColumnWidth;
            if (elGroup.closest('.ff-column-container').is('.ff_columns_total_6, .ff_columns_total_5, .ff_columns_total_4')) {
                // Regular image preview width is 162px, width >= 162px image style is not broken
                if (elGroup.width() < 162) {
                    maxColumnWidth = elGroup.width();
                }
            }

            // Set files thumbnail list container
            uploadedList = $('<div/>', {
                class: 'ff-uploaded-list',
                style: 'font-size:12px; margin-top: 15px;' + (maxColumnWidth ? `max-width:${maxColumnWidth}px;` : '')
            });
            element.closest('div').append(uploadedList);
            // original width for preview filename ellipsis
            let maxWidth = uploadedList.width();

            // Set maximum allowed files count protection
            var rules = form.rules[element.prop('name')];
            var maxFiles = rules['max_file_count']['value'];
            var fieldName = element.data('name') || element.prop('name');

            if ('max_file_count' in rules) {
                rules['max_file_count']['remaining'] = Number(maxFiles);
            }

            // Set html accept property for file types
            var acceptedFileTypes = '';
            if ('allowed_file_types' in rules) {
                acceptedFileTypes = rules.allowed_file_types.value.join('|');
                element.prop('accept', '.' + acceptedFileTypes.replace(/\|/g, ',.'));
            } else {
                acceptedFileTypes = rules.allowed_image_types.value.join('|');
                if (acceptedFileTypes) {
                    element.prop('accept', '.' + acceptedFileTypes.replace(/\|/g, ',.'));
                } else {
                    element.prop('accept', 'image/*');
                }
            }

            function showUploadError(msg) {
                let elName = element.prop('name');
                $form.trigger('show_element_error', {
                    element: elName,
                    message: msg
                });
            }

            function changeValidation(e, data) {
                if (!data || !data.files || !data.files.length) {
                    return;
                }

                $form.find('.ff-upload-preview-elem').remove();
                // return true;
                if ('max_file_count' in rules) {
                    $(formSelector + '_errors').empty();
                    $(this).closest('div').find('.error').html('');
                    var remaining = rules['max_file_count']['remaining'];
                    if (!remaining || data.files.length > remaining) {
                        var msg = 'Maximum 1 file is allowed!';
                        msg = maxFiles > 1 ? 'Maximum ' + maxFiles + ' files are allowed!' : msg;
                        if (rules.max_file_count && rules.max_file_count.message) {
                            msg = rules.max_file_count.message;
                        }
                        showUploadError(msg);
                        return false;
                    }
                }

                var validationErrors = validateFile(
                    data.files[0], form.rules[element.prop('name')]
                );

                if (validationErrors.length) {
                    showUploadError(validationErrors.join(', '));
                    return false;
                }

                let elName = element.prop('name');
                $(`[name="${elName}"]`).closest('div').find('.error').html('');
                element.closest('div').find('.error').html('');

                return true;
            }

            function getFormData($form) {
                const formData = $form.serializeArray();
                
                formData.push({
                    name: 'action',
                    value: 'fluentform_file_upload'
                });

                formData.push({
                    name: 'formId',
                    value: form.id
                });

                return formData;
            }

            function getFieldCropSettings() {
                if (!form.file_upload_settings || !form.file_upload_settings[fieldName]) {
                    return null;
                }

                return normalizeCropSettings(form.file_upload_settings[fieldName]);
            }

            function normalizeCropSettings(settings) {
                if (!settings) {
                    return null;
                }

                const mode = settings.mode || settings.crop_mode || (
                    settings.enforce_image_dimensions === 'yes' ? 'dimensions' : 'ratio'
                );

                const width = Number(
                    typeof settings.width !== 'undefined' ? settings.width : settings.crop_width
                ) || 0;
                const height = Number(
                    typeof settings.height !== 'undefined' ? settings.height : settings.crop_height
                ) || 0;

                return {
                    enabled: typeof settings.enabled !== 'undefined'
                        ? settings.enabled
                        : settings.enable_crop === 'yes',
                    mode: mode,
                    crop_ratio: settings.crop_ratio || 'free',
                    enforce_size: typeof settings.enforce_size !== 'undefined'
                        ? settings.enforce_size
                        : mode === 'dimensions',
                    width: width,
                    height: height,
                    button_ui: settings.button_ui || settings.upload_bttn_ui || ''
                };
            }

            function getCropAspectRatio(settings) {
                if (!settings) {
                    return NaN;
                }

                if (
                    settings.enforce_size &&
                    Number(settings.width) > 0 &&
                    Number(settings.height) > 0
                ) {
                    return Number(settings.width) / Number(settings.height);
                }

                if (!settings.crop_ratio || settings.crop_ratio === 'free') {
                    return NaN;
                }

                const ratioParts = settings.crop_ratio.split(':');
                if (ratioParts.length !== 2) {
                    return NaN;
                }

                const width = Number(ratioParts[0]);
                const height = Number(ratioParts[1]);

                if (!width || !height) {
                    return NaN;
                }

                return width / height;
            }

            function getCropRatioOptions(settings) {
                if (!settings || settings.enforce_size) {
                    return [];
                }

                if (settings.crop_ratio && settings.crop_ratio !== 'free') {
                    return [];
                }

                return [
                    {
                        value: 'free',
                        label: fluentFormVars.crop_ratio_free_txt || 'Free'
                    },
                    {
                        value: '1:1',
                        label: '1:1'
                    },
                    {
                        value: '4:3',
                        label: '4:3'
                    },
                    {
                        value: '16:9',
                        label: '16:9'
                    },
                    {
                        value: '3:4',
                        label: '3:4'
                    }
                ];
            }

            function isFixedDimensionCrop(settings, width, height) {
                return Boolean(
                    settings &&
                    settings.enforce_size &&
                    Number(width) > 0 &&
                    Number(height) > 0
                );
            }

            function maybeCropFile(file, cropSettings) {
                if (!cropSettings || !cropSettings.enabled || !file.type.match('image')) {
                    return Promise.resolve(file);
                }

                return new Promise((resolve, reject) => {
                    const CropperLib = window.Cropper;
                    const lityLib = window.lity;

                    if (!CropperLib || !lityLib) {
                        reject(
                            new Error(
                                fluentFormVars.crop_invalid_image_txt ||
                                'Unable to process the selected image.'
                            )
                        );
                        return;
                    }

                    const modalId = `ff-cropper-modal-${form.id}-${Date.now()}`;
                    const modal = document.createElement('div');
                    modal.id = modalId;
                    modal.className = 'lity-hide ff-cropper-lightbox';
                    modal.innerHTML = `
                        <div class="ff-cropper-lightbox__dialog" role="dialog" aria-modal="true">
                            <div class="ff-cropper-lightbox__header">
                                <h3 class="ff-cropper-lightbox__title">${fluentFormVars.crop_image_title || 'Crop Image'}</h3>
                                <button type="button" class="lity-close ff-cropper-lightbox__close" data-lity-close aria-label="${fluentFormVars.crop_close_txt || 'Close'}">×</button>
                            </div>
                            <div class="ff-cropper-lightbox__body">
                                <div class="ff-cropper-lightbox__canvas">
                                    <img alt="">
                                </div>
                                <div class="ff-cropper-lightbox__hint"></div>
                                <div class="ff-cropper-lightbox__error" aria-live="polite"></div>
                            </div>
                            <div class="ff-cropper-lightbox__footer">
                                <button type="button" class="ff-cropper-lightbox__btn" data-action="reset">${fluentFormVars.crop_reset_txt || 'Reset'}</button>
                                <button type="button" class="ff-cropper-lightbox__btn" data-action="cancel">${fluentFormVars.crop_cancel_txt || 'Cancel'}</button>
                                <button type="button" class="ff-cropper-lightbox__btn ff-cropper-lightbox__btn--primary" data-action="confirm">${fluentFormVars.crop_confirm_txt || 'Crop & Upload'}</button>
                            </div>
                        </div>
                    `;

                    document.body.appendChild(modal);

                    const image = modal.querySelector('img');
                    image.alt = file.name;
                    const errorEl = modal.querySelector('.ff-cropper-lightbox__error');
                    const hintEl = modal.querySelector('.ff-cropper-lightbox__hint');
                    const requiredWidth = Number(cropSettings.width) || 0;
                    const requiredHeight = Number(cropSettings.height) || 0;
                    const ratioOptions = getCropRatioOptions(cropSettings);
                    const aspectRatio = getCropAspectRatio(cropSettings);
                    const imageUrl = URL.createObjectURL(file);
                    const lityInstance = lityLib(`#${modalId}`, {
                        esc: true,
                        template: '<div class="lity ff-cropper-lity" role="dialog" aria-label="Dialog Window" tabindex="-1"><div class="lity-wrap" role="document"><div class="lity-loader" aria-hidden="true">Loading...</div><div class="lity-container"><div class="lity-content"></div></div></div></div>'
                    });
                    let cropper = null;
                    let selectedRatio = cropSettings.crop_ratio || 'free';
                    let completion = null;
                    let isCleanedUp = false;
                    const isFixedSizeCrop = isFixedDimensionCrop(
                        cropSettings,
                        requiredWidth,
                        requiredHeight
                    );

                    function cleanup() {
                        if (isCleanedUp) {
                            return;
                        }

                        isCleanedUp = true;

                        if (cropper) {
                            cropper.destroy();
                            cropper = null;
                        }

                        URL.revokeObjectURL(imageUrl);
                        modal.remove();
                    }

                    function finalize(result) {
                        if (completion) {
                            return;
                        }

                        completion = result;
                        lityInstance.close();
                    }

                    function applyFixedCropSelection() {
                        if (!cropper || !isFixedSizeCrop) {
                            return;
                        }

                        const imageData = cropper.getImageData();
                        if (
                            !imageData ||
                            imageData.naturalWidth < requiredWidth ||
                            imageData.naturalHeight < requiredHeight
                        ) {
                            return;
                        }

                        const cropX = (imageData.naturalWidth - requiredWidth) / 2;
                        const cropY = (imageData.naturalHeight - requiredHeight) / 2;

                        cropper.setData({
                            x: cropX,
                            y: cropY,
                            width: requiredWidth,
                            height: requiredHeight,
                        });
                    }

                    if (requiredWidth && requiredHeight && cropSettings.enforce_size) {
                        const instructionTemplate = fluentFormVars.crop_dimension_instruction_txt
                            || 'Crop the image to exactly %1$s px x %2$s px.';

                        hintEl.textContent = instructionTemplate
                            .replace('%1$s', requiredWidth)
                            .replace('%2$s', requiredHeight);
                    }

                    if (ratioOptions.length) {
                        const toolbar = document.createElement('div');
                        toolbar.className = 'ff-cropper-lightbox__toolbar';
                        toolbar.innerHTML = `
                            <span class="ff-cropper-lightbox__toolbar-label">${fluentFormVars.crop_ratio_txt || 'Crop ratio'}</span>
                            <div class="ff-cropper-lightbox__ratio-list">
                                ${ratioOptions.map(option => `
                                    <button
                                        type="button"
                                        class="ff-cropper-lightbox__ratio-btn${option.value === selectedRatio ? ' is-active' : ''}"
                                        data-ratio-value="${option.value}"
                                    >${option.label}</button>
                                `).join('')}
                            </div>
                        `;

                        modal.querySelector('.ff-cropper-lightbox__body').insertBefore(
                            toolbar,
                            modal.querySelector('.ff-cropper-lightbox__canvas')
                        );
                    }

                    function updateRatioButtons() {
                        modal.querySelectorAll('.ff-cropper-lightbox__ratio-btn').forEach(button => {
                            button.classList.toggle(
                                'is-active',
                                button.getAttribute('data-ratio-value') === selectedRatio
                            );
                        });
                    }

                    lityInstance.element().one('lity:remove', () => {
                        cleanup();

                        if (completion && completion.type === 'reject') {
                            reject(completion.error);
                            return;
                        }

                        resolve(completion ? completion.value : null);
                    });

                    modal.querySelectorAll('.ff-cropper-lightbox__ratio-btn').forEach(button => {
                        button.addEventListener('click', () => {
                            selectedRatio = button.getAttribute('data-ratio-value') || 'free';
                            updateRatioButtons();

                            if (!cropper) {
                                return;
                            }

                            const ratio = selectedRatio === 'free'
                                ? NaN
                                : getCropAspectRatio({
                                    crop_ratio: selectedRatio,
                                    enforce_size: false,
                                    width: 0,
                                    height: 0
                                });

                            cropper.setAspectRatio(ratio);
                        });
                    });

                    modal.querySelector('[data-action="cancel"]').addEventListener('click', () => {
                        finalize({
                            type: 'resolve',
                            value: null
                        });
                    });

                    modal.querySelector('[data-action="reset"]').addEventListener('click', () => {
                        errorEl.textContent = '';
                        if (cropper) {
                            cropper.reset();
                            if (isFixedSizeCrop) {
                                window.setTimeout(() => {
                                    applyFixedCropSelection();
                                }, 0);
                            }
                        }
                    });

                    modal.querySelector('[data-action="confirm"]').addEventListener('click', () => {
                        errorEl.textContent = '';

                        if (!cropper) {
                            errorEl.textContent = fluentFormVars.crop_loading_txt || 'Preparing image...';
                            return;
                        }

                        const imageData = cropper.getImageData();
                        const cropData = cropper.getData(true);
                        if (
                            cropSettings.enforce_size &&
                            requiredWidth &&
                            requiredHeight &&
                            (
                                imageData.naturalWidth < requiredWidth ||
                                imageData.naturalHeight < requiredHeight ||
                                cropData.width < requiredWidth ||
                                cropData.height < requiredHeight
                            )
                        ) {
                            errorEl.textContent = fluentFormVars.crop_invalid_dimensions_txt || 'The selected image is smaller than the required crop size.';
                            return;
                        }

                        const canvasOptions = {
                            fillColor: '#fff',
                            imageSmoothingEnabled: true,
                            imageSmoothingQuality: 'high',
                        };

                        if (cropSettings.enforce_size && requiredWidth && requiredHeight) {
                            canvasOptions.width = requiredWidth;
                            canvasOptions.height = requiredHeight;
                        }

                        const canvas = cropper.getCroppedCanvas(canvasOptions);
                        if (!canvas) {
                            finalize({
                                type: 'reject',
                                error: new Error(fluentFormVars.crop_invalid_image_txt || 'Could not crop image')
                            });
                            return;
                        }

                        if (
                            cropSettings.enforce_size &&
                            requiredWidth &&
                            requiredHeight &&
                            (canvas.width !== requiredWidth || canvas.height !== requiredHeight)
                        ) {
                            errorEl.textContent = fluentFormVars.crop_exact_dimensions_txt || 'The cropped image must match the required width and height.';
                            return;
                        }
                        const outputType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
                            ? file.type
                            : 'image/png';

                        canvas.toBlob(blob => {
                            if (!blob) {
                                finalize({
                                    type: 'reject',
                                    error: new Error(fluentFormVars.crop_invalid_image_txt || 'Could not crop image')
                                });
                                return;
                            }

                            const croppedFile = new File([blob], file.name, {
                                type: outputType,
                                lastModified: Date.now()
                            });

                            finalize({
                                type: 'resolve',
                                value: croppedFile
                            });
                        }, outputType, 0.92);
                    });

                    image.onload = function () {
                        cropper = new CropperLib(image, {
                            aspectRatio: aspectRatio,
                            autoCropArea: 1,
                            viewMode: 1,
                            dragMode: 'move',
                            responsive: true,
                            restore: false,
                            background: false,
                            movable: true,
                            zoomable: !isFixedSizeCrop,
                            zoomOnTouch: !isFixedSizeCrop,
                            zoomOnWheel: !isFixedSizeCrop,
                            scalable: false,
                            rotatable: false,
                            cropBoxResizable: !isFixedSizeCrop,
                            cropBoxMovable: !isFixedSizeCrop,
                            ready: function () {
                                applyFixedCropSelection();
                            }
                        });
                    };

                    image.src = imageUrl;
                });
            }

            const $el = $(el);

            // Init the uploader
            element.fileupload({
                dataType: 'json',
                dropZone: element.closest('.ff-el-group'),
                url: fluentFormVars.ajaxUrl,
                formData: getFormData,
                change: changeValidation,
                add: function (e, data) {
                    if (!changeValidation(e, data)) {
                        return;
                    }
                    maybeCropFile(data.files[0], getFieldCropSettings()).then(function (processedFile) {
                        if (!processedFile) {
                            return;
                        }

                        const validationErrors = validateFile(processedFile, form.rules[element.prop('name')]);
                        if (validationErrors.length) {
                            showUploadError(validationErrors.join(', '));
                            return;
                        }

                        data.files[0] = processedFile;

                        var previewContainer = $('<div/>', {
                            class: 'ff-upload-preview' + (maxColumnWidth ? ' ff-upload-container-small-column-image' : '')
                        });
                        data.context = previewContainer;

                        var previewThumb = $('<div/>', {
                            class: 'ff-upload-thumb'
                        });

                        var previewDetails = $('<div/>', {
                            class: 'ff-upload-details'
                        });

                        var thumb = $('<div/>', {
                            class: 'ff-upload-preview-img',
                            style: `background-image: url('${getThumbnail(data.files[0])}');`
                        });

                        var errorInline = $('<div>', {
                            class: 'ff-upload-error',
                            style: 'color:red;'
                        });

                        var fileProgress = $('<span/>', {
                            html: fluentFormVars.upload_start_txt,
                            class: 'ff-upload-progress-inline-text ff-inline-block'
                        });

                        var progressBarInline = $(`
									<div class="ff-upload-progress-inline ff-el-progress">
										<div class="ff-el-progress-bar"></div>
									</div>
								`);

                        var fileName = $('<div/>', {
                            class: 'ff-upload-filename',
                            text: data.files[0].name
                        });

                        var removeBtn = $('<span/>', {
                            'data-href': '#',
                            'data-attachment-id':'',
                            'html': '&times;',
                            'class': 'ff-upload-remove'
                        });

                        var fileSize = $('<div>', {
                            class: 'ff-upload-filesize ff-inline-block',
                            html: getFileSize(data.files[0].size)
                        });

                        previewThumb.append(thumb);
                        previewDetails.append(fileName, progressBarInline, fileProgress, fileSize, errorInline, removeBtn);
                        previewContainer.append(previewThumb, previewDetails);

                        uploadedList.append(previewContainer);

                        if (!maxColumnWidth) {
                            maxWidth = maxWidth - 91;
                        }
                        fileName.css({
                            maxWidth: maxWidth + 'px'
                        });
                        data.submit();
                        data.context.addClass('ff_uploading');
                    }).catch(function (error) {
                        showUploadError(error.message || fluentFormVars.crop_invalid_image_txt || 'Unable to crop image');
                    });
                },
                progress: function (e, data) {
                    let progress = parseInt(data.loaded / data.total * 100, 10);
                    data.context
                        .find('.ff-el-progress-bar')
                        .css('width', progress + '%');
                    data.context
                        .find('.ff-upload-progress-inline-text')
                        .text(fluentFormVars.uploading_txt);
                },
                done: function (e, data) {
                    data.context.removeClass('ff_uploading');
                    if (data.result && 'data' in data.result && 'files' in data.result.data) {
                        if ('error' in data.result.data.files[0]) {
                            // Error given by WP (wp_handle_upload)
                            showUploadError('Upload Error: ' + data.result.data.files[0].error);
                            data.context.remove();
                        } else {
                            data.context
                                .find('.ff-upload-progress-inline-text')
                                .text(fluentFormVars.upload_completed_txt);

                            rules['max_file_count']['remaining'] -= 1;
                            data.context.attr('data-src', data.result.data.files[0].url);
                            data.context.find('.ff-upload-remove').attr({
                                'data-href': data.result.data.files[0].file,
                                'data-attachment-id': data.result.data.files[0].attachment_id
                            });
                            data.context.addClass('ff_uploading_complete');
                            $form.find('input[name=' + $el.data('name') + ']').trigger('change');
                        }
                    } else {
                        // For debugging purpose to catch devlopment erros,
                        // this check might not be needing in production.
                        let message = getUploadMessage('upload_failed_text', 'Sorry! The upload failed for some unknown reason.');

                        if (data.messages) {
                            let keys = Object.keys(data.messages);
                            if (keys.length) {
                                message = data.messages[keys[0]];
                            }
                        }
                        showUploadError(message);
                        data.context.remove();
                    }
                },
                fail: function (e, data) {
                    let errors = [];
                    data.context?.remove();
                    if (data.jqXHR?.responseJSON && data.jqXHR?.responseJSON.errors) {
                        $.each(data.jqXHR.responseJSON.errors, function (key, error) {
                            if (typeof error == 'object') {
                                $.each(error, function (i, msg) {
                                    errors.push(msg);
                                });
                            } else {
                                errors.push(error);
                            }
                        });
                    } else if (data.jqXHR?.responseText) {
                        errors.push(data.jqXHR.responseText);
                    } else {
                        errors.push(getUploadMessage('upload_error_text', 'Something is wrong when uploading the file! Please try again'));
                    }
                    showUploadError(errors.join(', '));
                }
            });

            $el.on('change_remaining', function (e, data) {
                rules['max_file_count']['remaining'] += data;
            });

        });

        // handling accessibility
        $form.find('.ff_upload_btn').on('keyup click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (e.type === 'click' || (e.type === 'keyup' && e.keyCode === 32)) {
                $(this).siblings('input[type=file]').trigger('click');
            }
        });
    };

    /**
     * Get thumbnail image for file upload preview
     * @param  {file} file
     * @return {mixed}
     */
    var getThumbnail = function (file) {
        if (!!file.type.match('image')) {
            return URL.createObjectURL(file);
        }

        var canvas = document.createElement('canvas');
        canvas.width = 60;
        canvas.height = 60;
        canvas.style.zIndex = 8;
        canvas.style.position = "absolute";
        canvas.style.border = "1px solid";

        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, 60, 60);
        ctx.font = "13px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(file.name.substr(file.name.lastIndexOf('.') + 1), 30, 30, 60);
        return canvas.toDataURL();
    };

    /**
     * Get formatted file size to show in preview
     * @param  {int} size
     * @return {string}
     */
    var getFileSize = function returnFileSize(size) {
        if (size < 1024) {
            return size + 'bytes';
        } else if (size >= 1024 && size <= 1048576) {
            return (size / 1024).toFixed(1) + 'KB';
        } else if (size > 1048576) {
            return (size / 1048576).toFixed(1) + 'MB';
        }
    };

    /**
     * Register event handler to delete uploaded file
     * @return {void}
     */
    var registerFileRemove = function () {
        $form.find('.ff-uploaded-list').on('click', '.ff-upload-remove', function (e) {
            e.preventDefault();
            var elFiles,
                $this = $(this),
                parent = $this.closest('.ff-uploaded-list'),
                $el = parent.closest('.ff-el-input--content').find('input[type=file]'),
                filePath = $this.attr('data-href'),
                attachmentId = $this.attr('data-attachment-id');
            if (filePath == '#') {
                $this.closest('.ff-el-input--content').find('.error').remove();
                $this.closest('.ff-upload-preview').remove();
                if (!parent.find('.ff-upload-preview').length) {
                    parent.siblings('.ff-upload-progress').addClass('ff-hidden');
                }
                $el.trigger('change_remaining', 1);
            } else {
                $.post(fluentFormVars.ajaxUrl, {
                    path: filePath,
                    attachment_id : attachmentId,
                    action: 'fluentform_delete_uploaded_file',
                    _fluentform_file_delete_nonce: fluentFormVars.file_delete_nonce
                })
                    .then(function (response) {
                        var element = $this.closest('.ff-el-input--content').find('input');
                        $el.trigger('change_remaining', 1);
                        $this.closest('.ff-el-input--content').find('.error').remove();
                        $this.closest('.ff-upload-preview').remove();
                        if (!parent.find('.ff-upload-preview').length) {
                            parent.siblings('.ff-upload-progress').addClass('ff-hidden');
                        }
                        $el.trigger('change');
                    });
            }
        });
    };

    /**
     * Validate a file before uploading
     * @param  {file}
     * @return {array}
     */
    var validateFile = function (file, rules) {
        // return [];
        var validationErrors = [];

        // Accepted file types validation
        var fileTypes = '';
        var fileTypesMessage = '';
        if ('allowed_file_types' in rules) {
            fileTypes = rules['allowed_file_types']['value'];
            fileTypesMessage = rules['allowed_file_types']['message'];
        } else if ('allowed_image_types' in rules) {
            fileTypes = rules['allowed_image_types']['value'];
            fileTypesMessage = rules['allowed_image_types']['message'];
        }

        if (fileTypes) {
            var acceptFileTypes = new RegExp('(' + fileTypes.join('|') + ')', 'i');
            var fileExt = file['name'].split('.').pop();
            fileExt = fileExt.toLowerCase();
            if (!acceptFileTypes.test(fileExt)) {
                validationErrors.push(fileTypesMessage);
            }
        }

        // Maximum file size validation
        if ('max_file_size' in rules && rules['max_file_size']['value'] > 0 && file['size'] > rules['max_file_size']['value']) {
            validationErrors.push(rules['max_file_size']['message']);
        }

        return validationErrors;
    };


    initUploader();
    registerFileRemove();

    $(document.body).on('fluentform_reset', function () {
        initUploader();
    });
};

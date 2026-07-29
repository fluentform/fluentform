const initRepeatButtons = function ($, $form) {
    var repeat = $form.find('.fluentform .js-repeat'); // this is the old version
    $.each(repeat, (index, repeatItem) => {
        let $repeatItem = $(repeatItem);
        let repeatCols = $repeatItem.find('.ff-t-cell').length;

        if (repeatCols > 1) {
            let containerHeight = $repeatItem.find('.ff-el-group').height();
            let elementHeight = $repeatItem.find('.ff-el-group').find('.ff-el-input--content').height();
            let marginTop = containerHeight - elementHeight;
            $repeatItem.find('.js-repeat-buttons').css('margin-top', marginTop + 'px');
        }

        let elementInputHeight = $repeatItem.find('.ff-el-group').find('.ff-el-input--content .ff-el-form-control').outerHeight();
        $repeatItem.find('.ff-el-repeat-buttons').height(elementInputHeight);
    });
};

const registerRepeaterButtonsOldVersion = function ($theForm) {
    $theForm.on('click', '.js-repeat .repeat-plus', function (e) {
        let btnPlus = jQuery(this);
        let repeatParent = btnPlus.closest('.ff-el-repeat');
        let maxRepeat = parseInt(repeatParent.data('max_repeat'));
        let currentRepeatItems = repeatParent.find('.ff-t-cell:first-child .ff-el-input--content > input').length;

        if (maxRepeat && maxRepeat <= currentRepeatItems) {
            return;
        }

        if (maxRepeat && maxRepeat - currentRepeatItems == 1) {
            repeatParent.find('.repeat-plus').hide();
        }

        let btnSet = btnPlus.closest('div');
        let index = btnSet.index();
        let itemLength = btnPlus
            .closest('.ff-el-input--content')
            .find('.ff-t-cell').length;

        btnPlus
            .closest('.ff-el-input--content')
            .find('.ff-t-cell')
            .each(function (i, div) {
                var el = jQuery(this).find('.ff-el-form-control:last-child');
                var tabIndex = el.attr('tabindex');
                var cloned = el.clone();
                var newId = 'ffrpt-' + (new Date()).getTime() + i;

                var itemProp = {
                    value: '',
                    id: newId
                };

                if (tabIndex) {
                    itemProp.tabIndex = parseInt(tabIndex) + itemLength;
                }

                cloned.prop(itemProp);
                cloned.insertAfter(el);
            });

        btnSet.clone().insertAfter(btnSet);
        btnPlus
            .closest('.ff-el-input--content')
            .find('.ff-t-cell').eq(0)
            .find(`input:eq(${index + 1})`).focus();
    });
    $theForm.on('click', '.js-repeat .repeat-minus', function (e) {
        let isDeleted = false;
        let btnMinus = jQuery(this);
        let btnSet = btnMinus.closest('div');

        let repeatParent = btnMinus.closest('.ff-el-repeat');
        repeatParent.find('.repeat-plus').show();

        btnMinus
            .closest('.ff-el-input--content')
            .find('.ff-t-cell')
            .each(function () {
                var index = btnSet.index();
                var el = jQuery(this).find('.ff-el-form-control:eq(' + index + ')');
                if (btnSet.siblings().length) {
                    isDeleted = el.remove().length;
                }
            });
        isDeleted && btnSet.remove();
    });
};

const registerRepeaterHandler = function ($theForm) {
    // Get the screen type from local storage
    let screenType = window.localStorage.getItem('ff_window_type');

    // Add screen type classes
    if (jQuery('.ff_form_preview').length){
        jQuery('.ff_flexible_table').addClass(screenType);
    }

    // Add mobile class to repeater fields on screen mobile view
    $theForm.on('screen-change', function(e, width){
        if (jQuery('.ff_form_preview').length){
            if (width === '375px'){
                jQuery('.ff_flexible_table').addClass('mobile');
            } else {
                jQuery('.ff_flexible_table').removeClass('mobile');
            }
        }
    });

    // Name fixing event handler for repeater container
    $theForm.on('repeater-container-names-update', function(e, $repeaterList) {
        let rootName = $repeaterList.attr('data-root_name');
        let firstTabIndex = 0;
        $repeaterList.find('.ff_repeater_cont_row').each(function (i, row) {
            var els = jQuery(this).find('.ff-el-form-control');
            els.each(function (index, el) {
                let $el = jQuery(el);
                if(i == 0) {
                    firstTabIndex = $el.attr('tabindex');
                }
                $el.prop({
                    'name': rootName+'['+i+'][]'
                });
                $el.attr('data-name', rootName+'_'+index+'_'+i);
                if(firstTabIndex) {
                    $el.attr('tabindex', firstTabIndex);
                }
            });
        });
    });

    $theForm.on('click', '.js-repeater .repeat-plus', function (e) {
        let $btnPlus = jQuery(this);
        let $table = $btnPlus.closest('table');
        let $tr = $btnPlus.closest('tr');
        let maxRepeat = parseInt($table.attr('data-max_repeat'));

        let existingCount = $table.find('tbody tr').length;

        if(maxRepeat && existingCount == maxRepeat) {
            $table.addClass('repeat-maxed');
            return;
        }

        var $freshCopy = $tr.clone();

        $freshCopy.find('td').each(function (i, td) {
            var el = jQuery(this).find('.ff-el-form-control:last-child');
            var newId = 'ffrpt-' + (new Date()).getTime() + i;
            var itemProp = {
                value: el.attr('data-default') || '',
                id: newId
            };
            el.prop(itemProp);
            var dataMask = el.attr('data-mask');
            if (dataMask) {
                el.mask(dataMask);
            }
        });
        $freshCopy.insertAfter($tr);

        // Now let's fix the name
        let rootName = $table.attr('data-root_name');
        let firstTabIndex = 0;
        $table.find('tbody tr').each(function (i, td) {
            var els = jQuery(this).find('.ff-el-form-control');
            els.each(function (index, el) {
                let $el = jQuery(el);
                if(i == 0) {
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

        $freshCopy.find('.ff-el-form-control')[0].focus();

        $table.trigger('repeat_change');


        if(maxRepeat && existingCount+1 == maxRepeat) {
            $table.addClass('repeat-maxed');
        }
    });

    $theForm.on('click', '.js-repeater .repeat-minus', function (e) {
        let $btnMinus = jQuery(this);
        let $table = $btnMinus.closest('table');
        let existingCount = $table.find('tbody tr').length;
        if(existingCount == 1) {
            return;
        }

        $btnMinus.closest('tr').remove();
        $table.removeClass('repeat-maxed');

        // Now let's fix the name
        let rootName = $table.attr('data-root_name');
        $table.find('tbody tr').each(function (i, td) {
            var els = jQuery(this).find('.ff-el-form-control');
            els.each(function (index, el) {
                jQuery(el).prop({
                    'name': rootName + '[' + i + '][]'
                });
            });
        });
        $table.trigger('repeat_change');
    });

    //repeater container

    $theForm.on('click', '.js-container-repeat-buttons .repeat-plus', function (e) {
        let $btnPlus = jQuery(this);

        let $repeaterList = $btnPlus.closest('.ff-repeater-container');
        let $row = $btnPlus.closest('.ff_repeater_cont_row');
        let maxRepeat = parseInt($repeaterList.attr('data-max_repeat'));

        let existingCount = $repeaterList.find('.ff_repeater_cont_row').length;

        if(maxRepeat && existingCount == maxRepeat) {
            $repeaterList.addClass('repeat-maxed');
            return;
        }

        var $freshCopy = $row.clone();

        $freshCopy.find('.ff_repeater_cell').each(function (i, cell) {
            var el = jQuery(this).find('.ff-el-form-control:last-child');
            var newId = 'ffrpt-' + (new Date()).getTime() + i;
            var itemProp = {
                value: el.attr('data-default') || '',
                id: newId
            };
            el.prop(itemProp);
            var dataMask = el.attr('data-mask');
            if (dataMask) {
                el.mask(dataMask);
            }

            // Update the 'for' attribute of the label
            jQuery(this).find('label').attr('for', newId);
        });
        $freshCopy.insertAfter($row);

        // Trigger name fixing event
        $theForm.trigger('repeater-container-names-update', [$repeaterList]);
        $freshCopy.find('.ff-el-form-control')[0].focus();
        $repeaterList.trigger('repeat_change');

        if(maxRepeat && existingCount+1 == maxRepeat) {
            $repeaterList.addClass('repeat-maxed');
        }
    });

    // Remove row functionality
    $theForm.on('click', '.js-container-repeat-buttons .repeat-minus', function (e) {
        let $btnMinus = jQuery(this);
        let $repeaterList = $btnMinus.closest('.ff-repeater-container');
        let $row = $btnMinus.closest('.ff_repeater_cont_row');
        if ($repeaterList.find('.ff_repeater_cont_row').length > 1) {
            $row.remove();
            $repeaterList.removeClass('repeat-maxed');
            
            // Trigger name fixing event
            $theForm.trigger('repeater-container-names-update', [$repeaterList]);
            $repeaterList.trigger('repeat_change');
        }
    });
};
const registerKeyboardShort = function ($theForm) {

    $theForm.on('keydown', '.repeat-plus', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            jQuery(this).click();
        }
    });

    $theForm.on('keydown', '.repeat-minus', function (event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            jQuery(this).click();
        }
    });
}
const initRepeater = function($theForm) {
    registerRepeaterButtonsOldVersion($theForm);
    registerRepeaterHandler($theForm);
    registerKeyboardShort($theForm);
};

export {initRepeatButtons, initRepeater};

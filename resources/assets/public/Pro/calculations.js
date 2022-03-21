export default function ($, $theForm) {
    var calculationFields = $theForm.find('.ff_has_formula');

    if (!calculationFields.length) {
        return;
    }

    let repeaterTriggerCache = {};
    let repeaterInputsTriggerCache = {};

    mexp.addToken([
        {
            type: 8,
            token: 'round',
            show: 'round',
            value: function (value, decimals = 0) {
                if (!decimals && decimals !== 0) {
                    decimals = 2;
                }

                value = parseFloat(value).toFixed(decimals);
                return parseFloat(value);
            }
        },
        {
            type: 0,
            token: 'ceil',
            show: 'ceil',
            value: function (a) {
                return Math.ceil(a);
            }
        },
        {
            type: 0,
            token: 'floor',
            show: 'floor',
            value: function (a) {
                return Math.floor(a);
            }
        },
        {
            type: 8,
            token: 'max',
            show: 'max',
            value: function (a, b) {
                if (a > b)
                    return a;
                return b;
            }
        }
    ]);

    // polyfill for matchAll
    function findAll(regexPattern, sourceString) {
        let output = [];
        let match;
        // make sure the pattern has the global flag
        let regexPatternWithGlobal = RegExp(regexPattern, "g")
        while (match = regexPatternWithGlobal.exec(sourceString)) {
            // get rid of the string copy
            delete match.input
            // store the match data
            output.push(match)
        }
        return output
    }

    var doCalculation = function () {
        jQuery.each(calculationFields, (index, field) => {
            var $field = jQuery(field);
            var formula = $field.data('calculation_formula');
            let regEx = /{(.*?)}/g;
            // let matches = [...formula.matchAll(regEx)];
            let matches = findAll(regEx, formula);
            let replaces = {};

            jQuery.each(matches, (index, match) => {
                let itemKey = match[0];
                if (itemKey.indexOf('{input.') != -1) {
                    let inputName = itemKey.replace(/{input.|}/g, '');
                    let $el = $theForm.find('input[name=' + inputName + ']');
                    let value = 0;
                    if (isAccessible($el)) {
                        value = window.ff_helper.numericVal($el);
                    }
                    replaces[itemKey] = value;
                } else if (itemKey.indexOf('{select.') != -1) { // select Field
                    let inputName = itemKey.replace(/{select.|}/g, '');
                    let itemValue = getDataCalcValue('select[data-name=' + inputName + '] option:selected');
                    $theForm.find('select[data-name=' + inputName + ']').attr('data-calc_value', itemValue);
                    replaces[itemKey] = itemValue;
                } else if (itemKey.indexOf('{checkbox.') != -1) { // checkboxes Field
                    let inputName = itemKey.replace(/{checkbox.|}/g, '');
                    replaces[itemKey] = getDataCalcValue('input[data-name=' + inputName + ']:checked');
                } else if (itemKey.indexOf('{radio.') != -1) { // Radio Fields
                    let inputName = itemKey.replace(/{radio.|}/g, '');
                    let $el = $theForm.find('input[name=' + inputName + ']:checked');
                    let value = 0;
                    if (isAccessible($el)) {
                        value = $el.attr('data-calc_value') || 0;
                    }
                    replaces[itemKey] = value;
                } else if (itemKey.indexOf('{repeat.') != -1) { // Repeater Fields
                    let tableName = itemKey.replace(/{repeat.|}/g, '');
                    // We may have column index here
                    const splits = tableName.split('.');
                    let indexName = false;
                    if(splits.length > 1) {
                        tableName = splits[0];
                        indexName = splits[1];
                    }

                    let $targetTable = $theForm.find('table[data-root_name=' + tableName + ']');
                    if (!repeaterTriggerCache[tableName]) {
                        repeaterTriggerCache[tableName] = true;
                        $targetTable.on('repeat_change', () => {
                            doCalculation();
                        });
                    }

                    if(!indexName) {
                        let value = 0;
                        if (isAccessible($targetTable)) {
                            value = $targetTable.find('tbody tr').length
                        }
                        replaces[itemKey] = value;
                    } else {
                        let value = 0;
                        if (isAccessible($targetTable)) {
                            const tds = $targetTable.find('tbody tr td:nth-child('+indexName+')');
                            $.each(tds, (tdIndex, td) => {
                                const $tdInput = $(td).find(':input');
                                const cacheName = tableName+'_'+indexName + '_' + $tdInput.attr('id');
                                if (!repeaterInputsTriggerCache[cacheName]) {
                                    repeaterInputsTriggerCache[cacheName] = true;
                                    $tdInput.on('change', () => {
                                        doCalculation();
                                    });
                                }

                                let parsedValue = 0;
                                if($tdInput.attr('type') == 'select') {
                                    parsedValue = parseFloat($tdInput.find('option:selected').attr('data-calc_value'));
                                } else {
                                     parsedValue = parseFloat($tdInput.val());
                                }

                                if(!isNaN(parsedValue)) {
                                    value += parsedValue;
                                }
                            });
                            if(value) {
                                value = value.toFixed(2);
                            }
                        }
                        // We have to calculate the child values
                        replaces[itemKey] = value;
                    }

                } else if (itemKey.indexOf('{payment.') != -1) {
                    let inputName = itemKey.replace(/{payment.|}/g, '');
                    let $elem = $theForm.find(':input[data-name=' + inputName + ']');
                    let value = 0;
                    if ($elem.length && isAccessible($elem)) {
                        let elementType = $elem[0].type;
                        if (elementType == 'radio') {
                            let $element = $theForm.find('input[name=' + inputName + ']:checked');
                            value = $element.attr('data-payment_value');
                        } else if (elementType == 'hidden') {
                            value = $elem.attr('data-payment_value');
                        } else if (elementType == 'number' || elementType == 'text') {
                            value = window.ff_helper.numericVal($elem);
                        } else if (elementType == 'checkbox') {
                            let groupId = $elem.data('group_id');
                            let groups = $theForm.find('input[data-group_id="' + groupId + '"]:checked');
                            let groupTotal = 0;
                            groups.each((index, group) => {
                                let itemPrice = jQuery(group).data('payment_value');
                                if (itemPrice) {
                                    groupTotal += parseFloat(itemPrice);
                                }
                            });
                            value = groupTotal;
                        } else if (elementType == 'select-one') {
                            let $element = $theForm.find('select[name=' + inputName + '] option:selected');
                            value = $element.data('payment_value');
                        }
                    }
                    replaces[itemKey] = value;
                }
            });

            jQuery.each(replaces, (key, value) => {
                if (!value) {
                    value = 0;
                }
                formula = formula.split(key).join(value);
            });
            let calculatedValue = '';
            try {
                formula = formula.replace(/\n/g, "");
                calculatedValue = mexp.eval(formula);
                if (isNaN(calculatedValue)) {
                    calculatedValue = '';
                }
            } catch (error) {
                console.log(error, field);
            }

            if ($field[0].type == 'text') {
                const $fieldDom = $($field);
                const prevValue = $fieldDom.val();

                const formattedValue = window.ff_helper.formatCurrency($fieldDom, calculatedValue);

                $fieldDom.val(formattedValue)
                        .prop('defaultValue', formattedValue);

                if (prevValue == '') {
                    return;
                }

                if (prevValue != formattedValue) {
                    $fieldDom.trigger('change');
                }
            } else {
                $field.text(calculatedValue);
            }
        });
    };

    function isAccessible($el) {
        if ($el.closest('.ff_excluded.has-conditions').length) {
            return false;
        }
        return true;
    }

    function getDataCalcValue(selector) {
        let itemValue = 0;
        let selectedItems = $theForm.find(selector);

        if (selectedItems.closest('.ff_excluded.has-conditions').length) {
            return itemValue;
        }

        $.each(selectedItems, (indexItem, item) => {
            let eachItemValue = $(item).attr('data-calc_value');
            if (eachItemValue && !isNaN(eachItemValue)) {
                itemValue += Number(eachItemValue);
            }
        });
        return itemValue;
    }

    /**
     * Init Calculation input number fild
     */
    var initNumberCalculations = function () {
        $theForm.find(
            'input[type=number],input[data-calc_value],select[data-calc_value],.ff_numeric,.ff_payment_item'
        ).on('change keyup', doCalculation);

        doCalculation();

        $theForm.on('do_calculation', () => {
            doCalculation();
        });

    };

    initNumberCalculations();
}
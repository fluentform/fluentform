(($) => {

    function enablePrimarySelects(elements) {
        $.each(elements, (i , el) => {
            let $el = $(el);
            if ($el.data('index') === 0) {
                $el.prop('disabled',0)
                if ($el.hasClass('ff_el-chained-select-smart-search')) {
                    el.choices = new Choices(el);
                }
            }
        })
    };

    function onChange(e) {
        let $el = $(this);

        let $nextElement = getNextElement($el);

        if ($nextElement) {
            if ($el.val()) {
                return populate($el, $nextElement);
            }

            resetNextElement($nextElement, 1).trigger('change');
        }
    };

    function getNextElement($el) {
        let index = $el.data('index') + 1;
        let selector = '.ff-chained-select-field-wrapper';
        let $next = $el.closest(selector).find("select[data-index='"+index+"']");
        return $next.length ? $next : undefined;
    }

    function getPreviousElement($el) {
        let index = $el.data('index') - 1;
        let selector = '.ff-chained-select-field-wrapper';
        let $next = $el.closest(selector).find("select[data-index='"+index+"']");
        return $next.length ? $next : undefined;
    }

    function populate($element, $nextElement) {
        let data = {
            params: getParams($element),
            name: $element.attr('data-name'),
            type: $element.attr('data-source-type') ?? 'url',
            url: $element.attr('data-source-url')??'',
            meta_key: $element.attr('data-meta_key'),
            target_field: $nextElement.attr('data-key'),
            form_id: $element.closest('form').attr('data-form_id'),
            action: 'fluentform_get_chained_select_options'
        };

        $nextElement.html('<option>Loading...</option>');

        $.getJSON(fluentFormVars.ajaxUrl, data).then(response => {
            resetNextElement($nextElement, 0);
            appendOptions(response, $nextElement);
            if ($nextElement = getNextElement($nextElement)) {
                resetNextElement($nextElement, 1).trigger('change');
            }
        });
    }

    function getParams($element) {

        let params = [
            {
                value: $element.val(),
                key: $element.attr('data-key')
            }
        ];

        if ($element.attr('data-index')) {
            while ($previousElement = getPreviousElement($element)) {
                $element = $previousElement;
                params.push({
                    value: $element.val(),
                    key: $element.attr('data-key')
                });
            }
        }

        return params;
    }

    function resetNextElement($nextElement, isDisabled) {
        if (!$nextElement) return;

        if ($nextElement.hasClass('ff_el-chained-select-smart-search') && $nextElement[0].choices) {
            $nextElement[0].choices.destroy();
        }
        return $nextElement
        .empty()
        .prop('disabled', isDisabled)
        .append($('<option />', {
            value: '', text: $nextElement.attr('data-key')
        }));
    }

    function appendOptions(response, $nextElement) {
        let smartSearch = $nextElement.hasClass('ff_el-chained-select-smart-search');
        let choices;
        if (smartSearch) {
            choices = new Choices($nextElement[0]);
            $nextElement[0].choices = choices;
        }

        let options = [];
        $.each(response.data, (key, value) => {
            if (smartSearch) {
                options.push({ value: value, label: value })
            } else {
                $nextElement.append($('<option />', {
                    value: value, text: value
                }));
            }
        });
        if (smartSearch) {
            choices.setChoices(options)
        }
    }

    const init = () => {
        $.each($('.frm-fluent-form'), (formIndex, form) => {
            const elements = $(form).find('select.el-chained-select');
            elements.on('change', onChange);
            enablePrimarySelects(elements);

            $(document).on('reInitExtras', '#formId', function () {
                elements.on('change', onChange);
                enablePrimarySelects(elements);
            });
        });
    };

    setTimeout(() => {
        if ($('.frm-fluent-form')) {
            init();
        }
    },100)

    $(document).on('elementor/popup/show', () => {
        init()
    })

})(jQuery);

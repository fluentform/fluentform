export default function ($, $form) {
    /**
     * Rating element
     */
    let ratingDoms = $form.find(".jss-ff-el-ratings");

    if(!ratingDoms.length) {
        return;
    }

    $.each(ratingDoms, (index, ratingDom) => {
        let $ratingDom = $(ratingDom);
        let updateTabStops = function($activeLabel = null) {
            let $labels = $ratingDom.find('label');
            let baseTabIndex = $ratingDom.attr('data-base-tabindex') || '0';

            $labels.attr('tabindex', '-1');

            if (!$activeLabel || !$activeLabel.length) {
                $activeLabel = $ratingDom.find('input:checked').parent('label');
            }

            if (!$activeLabel.length) {
                $activeLabel = $labels.eq(0);
            }

            if ($activeLabel.length) {
                $activeLabel.attr('tabindex', baseTabIndex);
            }
        };

        let updateAria = function() {
            $ratingDom.find('label').each((index, label) => {
                let $label = $(label);
                let checked = $label.find('input').is(':checked');
                $label.attr('aria-checked', checked ? 'true' : 'false');
            });
        };

        let showRatingText = function(targetId) {
            let ratingTextSelector = targetId ? "[data-id=" + targetId + "]" : null;

            $ratingDom
                .closest(".ff-el-input--content")
                .find(".ff-el-rating-text")
                .css('display', 'none');

            if (ratingTextSelector) {
                $ratingDom
                    .closest(".ff-el-input--content")
                    .find(ratingTextSelector)
                    .css("display", "inline-block");
            }
        };

        let previewSelection = function($label) {
            $label.addClass("active");
            $label.prevAll().addClass("active");
            $label.nextAll().removeClass("active");
            showRatingText($label.find('input').attr('id'));
        };

        let restoreSelection = function() {
            let $checkedLabel = $ratingDom.find("input:checked").parent("label");

            if (!$checkedLabel.length) {
                $ratingDom.find('label').removeClass('active');
                showRatingText(null);
            } else {
                previewSelection($checkedLabel);
            }

            updateTabStops($checkedLabel);
            updateAria();
        };

        let moveFocus = function($label, direction) {
            let $labels = $ratingDom.find('label');
            let currentIndex = $labels.index($label);
            let nextIndex = Math.max(0, Math.min($labels.length - 1, currentIndex + direction));
            let $target = $labels.eq(nextIndex);

            if ($target.length) {
                let $input = $target.find('input');

                $input.prop('checked', true).trigger('change');
                updateTabStops($target);
                $target.trigger('focus');
                restoreSelection();
            }
        };

        restoreSelection();

        $ratingDom.on('mouseenter', 'label', function(e) {
            previewSelection($(this));
        }).on('focusin', 'label', function() {
            let $label = $(this);
            updateTabStops($label);
            previewSelection($label);
        })
            // When clicked on the icon
            .on('click', 'label', function(e) {
                var $this = $(this);
                var $input = $this.find('input');
                var $icon = $this.find(".jss-ff-svg");

                $input.prop('checked', true).trigger('change');
                restoreSelection();

                $icon.addClass('scale');
                $icon.addClass('scalling');

                setTimeout( _ => {
                    $icon.removeClass('scalling');
                    $icon.removeClass('scale');
                }, 150);
            }).on('keydown', 'label', function(e) {
                let $this = $(this);

                if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    moveFocus($this, 1);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    moveFocus($this, -1);
                } else if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    $this.trigger('click');
                }
            })
            // When mouse leaved from the rating icons
            .on('mouseleave', function(e) {
                restoreSelection();
            }).on('focusout', 'label', function() {
                setTimeout(() => {
                    if (!$ratingDom.find('label:focus').length) {
                        restoreSelection();
                    }
                }, 0);
            }).on('change', 'input', function() {
                restoreSelection();
            });
    });
}

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
        // Default selected icons
        $ratingDom.find("label.active").prevAll().addClass("active");

        // Track current keyboard focus index (-1 = none)
        $ratingDom.data('ff-focus-index', -1);

        $ratingDom.on('mouseenter', 'label', function(e) {
            var $this = $(this);
            var targetId = $this.find('input').attr('id');
            var ratingTextSelector = "[data-id="+ targetId +"]";

            /**
             * Mark active to all previous and currently hovered elements
             * And mark inactive to the next ones!
             */
            $this.addClass("active");
            $this.prevAll().addClass("active");
            $this.nextAll().removeClass("active");

            $this
                .closest(".ff-el-input--content")
                .find(".ff-el-rating-text")
                .css('display', 'none');

            $this
                .closest(".ff-el-input--content")
                .find(ratingTextSelector)
                .css("display", "inline-block");
        })
            // When clicked on the icon
            .on('click', 'label', function(e) {
                var $this = $(this);
                var $icon = $this.find(".jss-ff-svg");

                $icon.addClass('scale');
                $icon.addClass('scalling');

                setTimeout( _ => {
                    $icon.removeClass('scalling');
                    $icon.removeClass('scale');
                }, 150);
            })
            // When mouse leaved from the rating icons
            .on('mouseleave', function(e) {
                var $this = $(this);
                var targetId = $this.find("input:checked").attr("id");
                var ratingTextSelector = "[data-id=" + targetId + "]";
                var checkedStar = $this.find("input:checked").parent("label");

                /**
                 * Only checked item's prior elements will be marked
                 * And rest will be unmarked
                 */
                if (!checkedStar.length) {
                    $this.find('label').removeClass('active');
                } else {
                    checkedStar.addClass("active");
                    checkedStar.prevAll().addClass("active");
                    checkedStar.nextAll().removeClass("active");
                }

                $this
                    .closest(".ff-el-input--content")
                    .find(".ff-el-rating-text")
                    .css("display", "none");

                $this
                    .closest(".ff-el-input--content")
                    .find(ratingTextSelector)
                    .css("display", "inline-block");
            });

        // Keyboard navigation on the radiogroup container (only when a11y is enabled)
        if (window.fluentFormVars && window.fluentFormVars.a11yEnabled) {
            $ratingDom.on('keydown', function(e) {
                var $group = $(this);
                var $labels = $group.find('label');
                var totalStars = $labels.length;
                if (!totalStars) return;

                var currentIndex = $group.data('ff-focus-index');
                if (typeof currentIndex !== 'number' || currentIndex < 0) {
                    // Start from checked star or first star
                    var $checked = $group.find('input:checked').closest('label');
                    currentIndex = $checked.length ? $labels.index($checked) : -1;
                }

                var targetIndex = currentIndex;

                switch (e.which) {
                    case 39: // Right arrow
                    case 40: // Down arrow
                        targetIndex = currentIndex + 1;
                        if (targetIndex >= totalStars) targetIndex = 0;
                        break;
                    case 37: // Left arrow
                    case 38: // Up arrow
                        targetIndex = currentIndex - 1;
                        if (targetIndex < 0) targetIndex = totalStars - 1;
                        break;
                    case 13: // Enter
                    case 32: // Space
                        if (currentIndex >= 0) {
                            e.preventDefault();
                            selectStar($group, $labels, currentIndex);
                        }
                        return;
                    default:
                        return;
                }

                e.preventDefault();
                // Move visual focus indicator
                $group.data('ff-focus-index', targetIndex);
                $labels.removeClass('ff-rating-kbd-focus');
                $labels.eq(targetIndex).addClass('ff-rating-kbd-focus');

                // Select the star immediately on arrow key (standard radiogroup behavior)
                selectStar($group, $labels, targetIndex);
            });

            // Clear keyboard focus indicator when leaving the widget
            $ratingDom.on('blur', function() {
                $(this).find('label').removeClass('ff-rating-kbd-focus');
                $(this).data('ff-focus-index', -1);
            });

            // Set initial focus index on focus
            $ratingDom.on('focus', function() {
                var $group = $(this);
                var $labels = $group.find('label');
                var $checked = $group.find('input:checked').closest('label');
                var idx = $checked.length ? $labels.index($checked) : 0;
                $group.data('ff-focus-index', idx);
                $labels.removeClass('ff-rating-kbd-focus');
                $labels.eq(idx).addClass('ff-rating-kbd-focus');
            });
        }
    });

    function selectStar($group, $labels, index) {
        var $targetLabel = $labels.eq(index);
        var $targetInput = $targetLabel.find('input');

        // Check the radio
        $targetInput.prop('checked', true).trigger('change');

        // Visual animation
        var $icon = $targetLabel.find('.jss-ff-svg');
        $icon.addClass('scale').addClass('scalling');
        setTimeout(function() {
            $icon.removeClass('scalling').removeClass('scale');
        }, 150);

        // Update active state
        $targetLabel.addClass('active');
        $targetLabel.prevAll('label').addClass('active');
        $targetLabel.nextAll('label').removeClass('active');

        // Update rating text
        var targetId = $targetInput.attr('id');
        $group.closest('.ff-el-input--content')
            .find('.ff-el-rating-text').css('display', 'none');
        $group.closest('.ff-el-input--content')
            .find('[data-id=' + targetId + ']').css('display', 'inline-block');
    }
}

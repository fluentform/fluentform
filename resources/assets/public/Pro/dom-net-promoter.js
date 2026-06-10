const initNetPromoter = function ($, $form) {
    /**
     * Rating element
     */
    let netPromoterDoms = $form.find(".jss-ff-el-net-promoter");

    if(!netPromoterDoms.length) {
        return;
    }

    $.each(netPromoterDoms, (index, netPromoterDom) => {
        let $netPromoterDoms = $(netPromoterDom);
        // Default selected icons
        // $netPromoterDoms.find("label.active").prevAll().addClass("active");
        $netPromoterDoms.on('click', 'label', function(e) {
            var $this = $(this);
            /**
             * Mark active to all previous and currently hovered elements
             * And mark inactive to the next ones!
             */
            $this.addClass("active");
            $this.prevAll().removeClass("active");
            $this.nextAll().removeClass("active");
        })
        // Keyboard support for NPS navigation
        .on('keydown', 'input[type="radio"]', function(e) {
            var $input = $(this);
            var $td = $input.closest('td');
            var $tds = $td.closest('tr').find('td');
            var currentIndex = $tds.index($td);
            var targetIndex = -1;

            switch (e.which) {
                case 39: // Right arrow
                case 40: // Down arrow
                    targetIndex = currentIndex + 1;
                    if (targetIndex >= $tds.length) targetIndex = 0;
                    break;
                case 37: // Left arrow
                case 38: // Up arrow
                    targetIndex = currentIndex - 1;
                    if (targetIndex < 0) targetIndex = $tds.length - 1;
                    break;
                case 13: // Enter
                case 32: // Space
                    $input.prop('checked', true).trigger('change');
                    $td.find('label').trigger('click');
                    e.preventDefault();
                    return;
                default:
                    return;
            }

            e.preventDefault();
            var $targetTd = $tds.eq(targetIndex);
            var $targetInput = $targetTd.find('input');
            $targetInput.prop('checked', true).trigger('change').focus();

            // Update visual state
            var $targetLabel = $targetTd.find('label');
            $targetLabel.addClass('active');
            $targetLabel.prevAll().removeClass('active');
            $targetLabel.nextAll().removeClass('active');
        });
    });
};

export default initNetPromoter;
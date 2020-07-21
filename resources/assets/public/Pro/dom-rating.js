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
    });
}
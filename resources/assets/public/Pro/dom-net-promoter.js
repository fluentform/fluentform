const initNetPromoter = function ($) {
    /**
     * Rating element
     */
    let netPromoterDoms = $(".jss-ff-el-net-promoter");

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
    });
};

export default initNetPromoter;
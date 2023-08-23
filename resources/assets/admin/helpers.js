/*
    Funciton Type: Array Function
    Usage: Helps to clone an item next to it.
 */
if (typeof Array.prototype.pushAfter === "undefined") {
    Array.prototype.pushAfter = function(index, item) {
        var deepClone = JSON.parse(JSON.stringify(item));
        this.splice(index + 1, 0, deepClone);
    };
}

if (typeof String.prototype.ucFirst === "undefined") {
    String.prototype.ucFirst = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
}

if (typeof String.prototype.ucWords === "undefined") {
    String.prototype.ucWords = function() {
        return this.split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1)
        }).join(' ');
    }
}

// import lodash methods
// and assign it as prefixed property to window object
window._ff = {
    includes: require('lodash/includes'),
    startCase: require('lodash/startCase'),
    map: require('lodash/map'),
    each: require('lodash/each'),
    chunk: require('lodash/chunk'),
    has: require('lodash/has'),
    snakeCase: require('lodash/snakeCase'),
    cloneDeep: require('lodash/cloneDeep'),
    filter: require('lodash/filter'),
    isEmpty: require('lodash/isEmpty'),
    unique: (value, index, self) => self.indexOf(value) === index
};

export const scrollTop = (scrollTop = 0, milliSecond = 300, selector = 'html, body') => (
    jQuery(selector).animate({ scrollTop }, milliSecond).promise()
);

export const handleSidebarActiveLink = ($link, init = false) => {
    //make current link active and others deactivate
    $link.addClass('active').siblings().removeClass('active');

    // toggle sub-links if curren link has sub-links
    if ($link.hasClass('has_sub_menu')) {
        $link.toggleClass('is-submenu'); // toggle sub-link icon
        $link.find('.ff_list_submenu').slideToggle();
    }

    // make first sub-link active if it has submenu
    const $subMenuFirstItem = $link.find('ul.ff_list_submenu li:first');
    if ($subMenuFirstItem.length) {
        $subMenuFirstItem.addClass('active').siblings().removeClass('active');
    }

    if (init) {
        const $parentLink = $link.closest('li.ff_list_button_item');
        if ($parentLink.length && $parentLink.hasClass('has_sub_menu')) {
            $parentLink.addClass('is-submenu active'); // toggle sub-link icon
            $parentLink.find('.ff_list_submenu').slideToggle();
        }
    }

    // close all others sub-links if it has
    if ($link.siblings().hasClass('has_sub_menu')) {
        $link.siblings().removeClass('is-submenu'); // sub-link icon close
        $link.siblings().find('.ff_list_submenu').slideUp();
    }
}

/**
 * Helper function for show/hide dependent elements
 & @return {Boolean}
 */
export function dependencyPass(dependency, targetObj) {
    if (Array.isArray(dependency)) {
        for (let i = 0; i < dependency.length; i++) {
            if (!isDependencyPass(dependency[i], targetObj)) {
                return false;
            }
        }
        return true;
    } else {
        return isDependencyPass(dependency, targetObj);
    }
}

function isDependencyPass(dependency, targetObj) {
    let optionPaths = dependency.depends_on.split('/');
    let dependencyVal = optionPaths.reduce((obj, prop) => {
        return obj[prop]
    }, targetObj);
    return compare(dependency.value, dependency.operator, dependencyVal);
}

function compare(operand1, operator, operand2) {
    switch(operator) {
        case '==':
            return operand1 == operand2;
        case '!=':
            return operand1 != operand2;
        default:
            return false;
    }
}

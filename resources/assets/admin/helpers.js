import moment from 'moment';

/*
    Funciton Type: Array Function
    Usage: Helps to clone an item next to it.
 */
if (typeof Array.prototype.pushAfter === "undefined") {
    Array.prototype.pushAfter = function (index, item) {
        var deepClone = JSON.parse(JSON.stringify(item));
        this.splice(index + 1, 0, deepClone);
    };
}

if (typeof String.prototype.ucFirst === "undefined") {
    String.prototype.ucFirst = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }
}

if (typeof String.prototype.ucWords === "undefined") {
    String.prototype.ucWords = function () {
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

export const handleSidebarActiveLink = ($link, init = false, firstLoad = false) => {
    //make current link active and others deactivate
    $link.addClass('active').siblings().removeClass('active');

    // toggle sub-links if curren link has sub-links
    if ($link.hasClass('has_sub_menu')) {

        if (firstLoad) {
            $link.find('.ff_list_submenu').show();
        } else {
            $link.toggleClass('is-submenu'); // toggle sub-link icon
            $link.find('.ff_list_submenu').slideToggle();
        }
    }

    // make first sub-link active if it has submenu
    const $subMenuFirstItem = $link.find('ul.ff_list_submenu li:first');
    if ($subMenuFirstItem.length) {
        $subMenuFirstItem.addClass('active').siblings().removeClass('active');
    }

    if (init) {
        const $parentLink = $link.closest('li.ff_list_button_item.has_sub_menu');
        if ($parentLink.length) {
            if (firstLoad) {
                $parentLink.addClass('active'); // toggle sub-link icon
                $parentLink.find('.ff_list_submenu').show();

            } else {
                $parentLink.find('.ff_list_submenu').slideToggle();
                $parentLink.addClass('is-submenu active'); // toggle sub-link icon
            }
        }
    }

    // close all others sub-links if it has
    if ($link.siblings().hasClass('has_sub_menu')) {
        $link.siblings().removeClass('is-submenu'); // sub-link icon close
        $link.siblings().find('.ff_list_submenu').slideUp();
    }
}


/**
 * Converts a date to human-readable relative time or wp default date string - based on global settings.
 * @param {timestamp} date - The date to convert
 * @returns {string} Human-readable time difference or formatted date
 */

export const humanDiffTime  = (date)=> {
    const dateString = (date === undefined) ? null : date;
    if (!dateString) {
        return '';
    }
    if (window.fluent_forms_global_var.disable_time_diff) {
        const dateMoment = moment(dateString);
        return dateMoment.format(window.fluent_forms_global_var.wp_date_time_format);
    }

    const endTime = new Date();
    const appStartTime = new Date();
    const timeDiff = endTime - appStartTime;
    const dateObj = moment(dateString);
    return dateObj.from(moment(window.fluent_forms_global_var.server_time).add(timeDiff, 'milliseconds'));
}

export const tooltipDateTime  = (date)=> {
    if (!date) {
        return '';
    }

    const dateMoment = moment(date);
    const globalConfig = window.fluent_forms_global_var;

    if (globalConfig.disable_time_diff) {
        // Calculate time difference between current time and application start
        const currentTime = new Date();
        const serverTime = window.fluent_forms_global_var.server_time;
        const timeDifference = currentTime - serverTime;

        const adjustedServerTime = moment(globalConfig.server_time)
            .add(timeDifference, 'milliseconds');

        return dateMoment.from(adjustedServerTime);
    }

    return dateMoment.format(globalConfig.wp_date_time_format);
}
export function _$t(string, ...args) {
    if (args.length === 0) {
        return string;
    }

    // Prepare the arguments, excluding the first one (the string itself)
     args = Array.prototype.slice.call(args, 1);

    // Regular expression to match %s, %d, or %1s, %2s, etc.
    const regex = /%(\d*)s|%d/g;

    // Replace function to handle each match found by the regex
    let argIndex = 0; // Keep track of the argument index for non-numbered placeholders
    string = string.replace(regex, (match, number) => {
        // If it's a numbered placeholder, use the number to find the corresponding argument
        if (number) {
            const index = parseInt(number, 10) - 1; // Convert to zero-based index
            return index < args.length ? args[index] : match; // Replace or keep the placeholder
        } else {
            // For non-numbered placeholders, use the next argument in the array
            return argIndex < args.length ? args[argIndex++] : match; // Replace or keep the placeholder
        }
    });

    return string;
}


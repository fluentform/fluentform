import moment from 'moment';
import includes from 'lodash/includes';
import startCase from 'lodash/startCase';
import map from 'lodash/map';
import each from 'lodash/each';
import chunk from 'lodash/chunk';
import has from 'lodash/has';
import snakeCase from 'lodash/snakeCase';
import cloneDeep from 'lodash/cloneDeep';
import filter from 'lodash/filter';
import isEmpty from 'lodash/isEmpty';

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

// lodash methods as prefixed property on window object
window._ff = {
    includes,
    startCase,
    map,
    each,
    chunk,
    has,
    snakeCase,
    cloneDeep,
    filter,
    isEmpty,
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

export const isKeyboardSaveShortcut = (event) => {
    if (!event) {
        return false;
    }

    const key = (event.key || '').toLowerCase();
    const isSaveKey = key === 's' || event.keyCode === 83;
    if (!isSaveKey || event.altKey || event.shiftKey) {
        return false;
    }

    const platform = window.navigator && window.navigator.platform ? window.navigator.platform : '';
    const isMac = /Mac|iPhone|iPad|iPod/.test(platform);

    return isMac ? event.metaKey : event.ctrlKey;
}

export const getKeyboardSaveShortcutLabel = () => {
    const platform = window.navigator && window.navigator.platform ? window.navigator.platform : '';
    const isMac = /Mac|iPhone|iPad|iPod/.test(platform);

    return isMac ? '⌘S' : 'Ctrl+S';
}

export const bindKeyboardSaveShortcut = (handler, options = {}) => {
    const target = options.target || document;
    const enabled = options.enabled || (() => true);
    const ignoreRepeat = options.ignoreRepeat !== false;
    const preventDefaultWhenDisabled = !!options.preventDefaultWhenDisabled;

    const listener = (event) => {
        if (!isKeyboardSaveShortcut(event) || event.defaultPrevented) {
            return;
        }

        const canHandle = typeof handler === 'function' && enabled(event);
        if (!canHandle) {
            if (preventDefaultWhenDisabled) {
                event.preventDefault();
            }
            return;
        }

        event.preventDefault();

        if (ignoreRepeat && event.repeat) {
            return;
        }

        handler(event);
    };

    target.addEventListener('keydown', listener);

    return () => target.removeEventListener('keydown', listener);
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

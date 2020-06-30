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

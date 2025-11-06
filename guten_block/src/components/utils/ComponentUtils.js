/**
 * Checks if props have changed for component memoization
 *
 * @param {Object} prevStyles Previous props
 * @param {Object} nextStyles New props
 * @param {Array} stylesNames Array of styles names to check
 * @return {Boolean} True if props are equal (no update needed)
 */
export const areStylesEqual = (prevStyles, nextStyles, stylesNames = []) => {
    if ((!prevStyles && !nextStyles) || prevStyles === nextStyles || !stylesNames.length) {
        return true;
    }
    if (!prevStyles || !nextStyles) {
        return false;
    }

    for (const attr of stylesNames) {
        if (!prevStyles?.[attr] && !nextStyles?.[attr]) {
            continue;
        }
        if (!prevStyles?.[attr] || !nextStyles?.[attr]) {
            return false;
        }
        if (JSON.stringify(prevStyles[attr]) !== JSON.stringify(nextStyles[attr])) {
            return false;
        }
    }
    return true;
};

/**
 * Checks if props have changed for component memoization
 *
 * @param {Object} prevProps Previous props
 * @param {Object} nextProps New props
 * @param {Array} propsNames Array of props names to check
 * @return {Boolean} True if props are equal (no update needed)
 */
export const arePropsEqual = (prevProps, nextProps, propsNames = []) => {
    if (!propsNames.length) {
        return true;
    }
    for (const key of propsNames) {
        const prev = prevProps[key];
        const next = nextProps[key];
        if (typeof prev === 'object' && typeof next === 'object') {
            if (JSON.stringify(prev) !== JSON.stringify(next)) {
                return false;
            }
            continue;
        }
        if (prev !== next) {
            return false;
        }
    }
    return true;
};
/**
 * Checks if props have changed for component memoization
 *
 * @param {Object} prevProps Previous props
 * @param {Object} nextProps New props
 * @param {Array} attributesToCheck Array of attribute names to check
 * @return {Boolean} True if props are equal (no update needed)
 */
export const arePropsEqual = (prevProps, nextProps, attributesToCheck = []) => {
    if (prevProps.attributes?.styles !== nextProps.attributes?.styles) {
        return false;
    }
    if (attributesToCheck.length === 0) {
        return true;
    }
    const prevAttrs = prevProps.attributes || {};
    const nextAttrs = nextProps.attributes || {};
    for (const attr of attributesToCheck) {
        if (!prevAttrs?.styles?.[attr] && !nextAttrs?.styles?.[attr]) {
            continue;
        }
        if (!prevAttrs?.styles?.[attr] || !nextAttrs?.styles?.[attr]) {
            return false;
        }
        if (JSON.stringify(prevAttrs.styles[attr]) !== JSON.stringify(nextAttrs.styles[attr])) {
            return false;
        }
    }

    return true;
};
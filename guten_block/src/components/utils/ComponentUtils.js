/**
 * Checks if props have changed for component memoization
 *
 * @param {Object} prevProps Previous props
 * @param {Object} nextProps New props
 * @param {Array} attributesToCheck Array of attribute names to check
 * @param {Boolean} checkState Whether to check state properties
 * @return {Boolean} True if props are equal (no update needed)
 */
export const arePropsEqual = (prevProps, nextProps, attributesToCheck = [], checkState = false) => {
    const { attributes: prevAttrs } = prevProps;
    const { attributes: nextAttrs } = nextProps;

    // Check specific attributes
    for (const attr of attributesToCheck) {
        if (JSON.stringify(prevAttrs[attr]) !== JSON.stringify(nextAttrs[attr])) {
            return false; // Props are not equal, should update
        }
    }

    // Check state if needed
    if (checkState && prevProps.state && nextProps.state) {
        if (prevProps.state.customizePreset !== nextProps.state.customizePreset ||
            prevProps.state.selectedPreset !== nextProps.state.selectedPreset) {
            return false; // State changed, should update
        }
    }

    return true; // Props are equal, no need to update
};
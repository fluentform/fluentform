// In guten_block/src/components/utils/TypographyUtils.js

/**
 * Updates typography settings with only changed values to avoid unnecessary rerenders
 * @param {Object} changedTypo - Object containing only the changed typography property
 * @param {Object} currentAttributes - Current attributes object
 * @param {string} typographyKey - Key for the typography attribute to update
 * @returns {Object} The updated typography object or empty object for reset
 */
export const getUpdatedTypography = (changedTypo, currentAttributes, typographyKey) => {
    // Check if this is a reset operation
    if (changedTypo.reset) {
        return {};
    }

    // Create a new typography object based on current attributes
    const updatedTypography = {...currentAttributes[typographyKey] || {}};

    // Get the property that changed (there should be only one)
    const changedProperty = Object.keys(changedTypo)[0];
    const newValue = changedTypo[changedProperty];

    // Update only the changed property
    switch (changedProperty) {
        case 'fontSize':
            updatedTypography.size = {lg: newValue};
            break;
        case 'fontWeight':
            updatedTypography.weight = newValue;
            break;
        case 'lineHeight':
            updatedTypography.lineHeight = newValue;
            break;
        case 'letterSpacing':
            updatedTypography.letterSpacing = newValue;
            break;
        case 'textTransform':
            updatedTypography.textTransform = newValue;
            break;
    }
    return updatedTypography;
};
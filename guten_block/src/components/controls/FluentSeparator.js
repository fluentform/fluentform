/**
 * Fluent Forms Separator Component
 */

const { __ } = wp.i18n;

/**
 * Fluent Forms Separator Component
 *
 * @param {Object} props Component props
 * @param {string} props.label Optional label to display in the separator
 * @param {string} props.className Additional CSS class
 * @param {string} props.style Style of separator (default, dashed, dotted)
 */
const FluentSeparator = ({
    label = '',
    className = '',
    style = 'default'
}) => {
    const separatorClass = `fluent-separator fluent-separator-${style} ${className}`;

    if (label) {
        return (
            <div className={separatorClass}>
                <span className="fluent-separator-label">{label}</span>
            </div>
        );
    }

    return <hr className={separatorClass} />;
};

export default FluentSeparator;

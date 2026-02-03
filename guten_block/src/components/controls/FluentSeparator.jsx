const { __ } = wp.i18n;
const { memo } = wp.element;
import { arePropsEqual } from "../utils/ComponentUtils";
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

export default memo(FluentSeparator, (prevProps, nextProps) => {
    return arePropsEqual(prevProps, nextProps, ['label', 'className', 'style']);
});

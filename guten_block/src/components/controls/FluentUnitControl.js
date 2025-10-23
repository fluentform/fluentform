const { BaseControl, SelectControl } = wp.components;
const { __ } = wp.i18n;

const FluentUnitControl = ({
                               label,
                               value,
                               onChange,
                               unit,
                               onUnitChange,
                               min = -100,
                               max = 100,
                               placeholder = "0",
                               units = [
                                   { label: 'px', value: 'px' },
                                   { label: 'em', value: 'em' },
                                   { label: '%', value: '%' }
                               ]
                           }) => {
    const unitOptions = units.map(unit => ({
        label: unit.label,
        value: unit.value
    }));

    return (
        <BaseControl label={label}>
            <div className="fluent-form-unit-control">
                <input
                    type="number"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    min={min}
                    max={max}
                    placeholder={placeholder}
                />
                <SelectControl
                    value={unit || 'px'}
                    options={unitOptions}
                    onChange={onUnitChange}
                />
            </div>
        </BaseControl>
    );
};

export default FluentUnitControl;
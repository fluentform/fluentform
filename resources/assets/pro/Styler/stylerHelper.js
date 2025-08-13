export class AroundItem {
    constructor() {
        this.type = 'px';
        this.top = '';
        this.left = '';
        this.right = '';
        this.bottom = '';
        this.linked = 'yes';
    }
}
export class TypeValue {
    constructor(value = '', type = 'px') {
        this.type = type;
        this.value = value;
    }
}

export class Color {
    constructor(key = 'color', label = 'Color', value = '') {
        this.label = label;
        this.key = key;
        this.element = 'ff_color';
        this.value = value;
    }
}

export class UnitValue {
    constructor(key, label = '', value = {}) {
        this.key = key;
        this.label = label;
        this.element = 'ff_unit_value';
        if (value.units) {
            this.units = value.units;
        }
        if (value.config) {
            this.config = value.config;
        }
        this.value = new TypeValue(value.value || '', value.type || 'px');
    }
}

export class BackgroundColor {
    constructor(key = 'backgroundColor', label = 'Background Color', value = '') {
        this.label = label;
        this.key = key;
        this.element = 'ff_color';
        this.value = value;
    }
}

export class BackgroundImage {
    constructor(key = 'backgroundImage', label = 'Background Image') {
        this.label = label;
        this.key = key;
        this.element = 'ff_background_image';
        this.value = {
            type: 'classic',
            image: {
                url: '',
                position: {
                    value: '',
                    valueX: new TypeValue(),
                    valueY: new TypeValue(),
                },
                size: {
                    value: '',
                    valueX: new TypeValue(),
                    valueY: new TypeValue(),
                },
                attachment: '',
                repeat: '',
            },
            gradient: {
                type: 'radial',
                position: 'center center',
                angle: new TypeValue(0, 'deg'),
                primary: {
                    color: '',
                    location: new TypeValue(50 , '%')
                },
                secondary: {
                    color: '',
                    location: new TypeValue(50 , '%')
                }
            }
        };
    }
}

export class Padding {
    constructor(key = 'padding', label = 'Padding') {
        this.label = label;
        this.element = 'ff_around_item';
        this.key = key;
        this.value = new AroundItem();
        this.type = 'px';
    }
}

export class Margin {
    constructor(key = 'margin', label = 'Margin') {
        this.label = label;
        this.element = 'ff_around_item';
        this.key = key;
        this.value = new AroundItem();
        this.type = 'px';
    }
}

export class Border {
    constructor(key = 'border', label = 'Border', status_label = 'Custom Border', value = {}) {
        this.label = label;
        this.key = key;
        this.status_label = status_label;
        this.element = 'ff_border_config';
        this.value = {
            border_radius: new AroundItem(),
            border_width: new AroundItem(),
            border_type: 'solid',
            border_color: '',
            status: '',
            ...value
        }
        this.type = 'px';
    }
}

export class Typography {
    constructor(key = 'typography', label = 'Typography') {
        this.label = label;
        this.key = key;
        this.element = 'ff_typography';
        this.value = {
            fontSize: {
                type : 'px',
                value : ''
            },
            fontWeight: '',
            transform: '',
            fontStyle: '',
            textDecoration: '',
            lineHeight: {
                type : 'px',
                value : ''
            },
            letterSpacing: {
                type : 'px',
                value : ''
            },
            wordSpacing: {
                type : 'px',
                value : ''
            },
        }
    }
}

export class Boxshadow {
    constructor(key = 'boxshadow', label = 'Box Shadow', value = {}) {
        this.key = key;
        this.element = 'ff_boxshadow_config';
        this.label = label;
        this.value = {
            horizontal: {
                type : 'px',
                value : '0'
            },
            vertical: {
                type : 'px',
                value : '0'
            },
            blur: {
                type : 'px',
                value : '0'
            },
            spread: {
                type : 'px',
                value : '0'
            },
            color: '',
            position: '',
            ...value
        }
    }
}

export class TabPart {
    constructor(key, label, newValue = {}, replaceExisting = false) {
        this.key = key;
        this.label = label;
        if (Array.isArray(newValue)) {
            this.value = {};
            newValue.forEach(prop => {
                const className = prop.charAt(0).toUpperCase() + prop.slice(1);
                try {
                    this.value[prop] = eval(`new ${ className }()`);
                } catch (e) {
                }
            })
        } else {
            this.value = {
                color: new Color(),
                backgroundColor: new BackgroundColor(),
                ...newValue,
                typography: new Typography(),
                boxshadow: new Boxshadow(),
                border: new Border()
            }
        }
        if (replaceExisting) {
            this.value = {
                ...this.value,
                ...replaceExisting
            }
        }
    }
}

export function resetWithDefault(targetObj, defaultObj) {
    for (const prop in defaultObj) {
        const value = defaultObj[prop];
        if (typeof value !== 'object' && targetObj[prop] !== undefined) {
            targetObj[prop] = value;
        } else if (targetObj[prop] !== undefined) {
            for (const subProp in value) {
                if (typeof subProp !== 'object' && targetObj[prop][subProp] !== undefined) {
                    targetObj[prop][subProp] = value[subProp];
                }
            }
        }
    }
}
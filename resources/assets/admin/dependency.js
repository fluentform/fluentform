export const compareDependencyValue = (expectedValue, operator, actualValue) => {
    switch (operator) {
        case '==':
            return expectedValue == actualValue;
        case '!=':
            return expectedValue != actualValue;
        default:
            return true;
    }
};

export const getDependencyValue = (target, dependency, resolveSpecialValue = null) => {
    if (!dependency || !dependency.depends_on) {
        return undefined;
    }

    if (typeof resolveSpecialValue === 'function') {
        const resolvedValue = resolveSpecialValue(dependency, target);

        if (typeof resolvedValue !== 'undefined') {
            return resolvedValue;
        }
    }

    return dependency.depends_on.split('/').reduce((obj, prop) => {
        if (typeof obj === 'undefined' || obj === null) {
            return undefined;
        }

        return obj[prop];
    }, target);
};

export const normalizeDependencies = rawDependencies => {
    if (!rawDependencies) {
        return [];
    }

    return Array.isArray(rawDependencies) ? rawDependencies : [rawDependencies];
};

export const dependencyPasses = (rawDependencies, target, resolveSpecialValue = null) => {
    const dependencies = normalizeDependencies(rawDependencies);

    if (!dependencies.length) {
        return true;
    }

    return dependencies.every(dependency => {
        if (!dependency || !dependency.depends_on || !dependency.operator) {
            return true;
        }

        const dependencyValue = getDependencyValue(target, dependency, resolveSpecialValue);

        return compareDependencyValue(
            dependency.value,
            dependency.operator,
            dependencyValue
        );
    });
};

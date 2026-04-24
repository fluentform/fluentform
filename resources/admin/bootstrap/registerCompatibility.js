import registerGlobals from '@compat/registerGlobals';
import registerFilters from '@compat/registerFilters';

export default function registerCompatibility(app, services = {}) {
    registerGlobals(app, services);
    registerFilters(app, services);
}

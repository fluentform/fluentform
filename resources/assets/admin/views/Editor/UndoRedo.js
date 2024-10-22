import Vue from 'vue';
import debounce from 'lodash/debounce';

const MAX_HISTORY_LENGTH = 20;
const DEBOUNCE_DELAY = 300; // milliseconds

class UndoRedo {
    constructor() {
        this.past = [];
        this.present = null;
        this.future = [];
        this.isPerformingAction = false;
        this.eventBus = new Vue();
        this.timestamp = Date.now();
        this.debouncedPushChange = debounce(this._pushChange.bind(this), DEBOUNCE_DELAY);
    }

    _cloneContent(content) {
        // Handle null or undefined
        if (content === null || content === undefined) {
            return content;
        }

        // Handle primitive types
        if (typeof content !== 'object') {
            return content;
        }

        // Handle Date objects
        if (content instanceof Date) {
            return new Date(content);
        }

        // Handle Arrays
        if (Array.isArray(content)) {
            const clonedArray = content.map(item => this._cloneContent(item));
            return Vue.observable(clonedArray);
        }

        // Handle Objects
        const clone = {};
        Object.keys(content).forEach(key => {
            // Skip Vue internal properties
            if (key.startsWith('_') || key === '__ob__') {
                return;
            }

            const value = content[key];

            // Special handling for fields object
            if (key === 'fields') {
                clone[key] = this._cloneFieldsObject(value);
            } else {
                clone[key] = this._cloneContent(value);
            }
        });

        // Make the object reactive
        return Vue.observable(clone);
    }

    _cloneFieldsObject(fields) {
        if (!fields || typeof fields !== 'object') {
            return fields;
        }

        const clonedFields = {};
        Object.keys(fields).forEach(fieldKey => {
            const field = fields[fieldKey];
            if (field && typeof field === 'object') {
                clonedFields[fieldKey] = {
                    ...this._cloneContent(field),
                    settings: this._cloneSettings(field.settings)
                };
            } else {
                clonedFields[fieldKey] = field;
            }
        });

        return Vue.observable(clonedFields);
    }

    _cloneSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return settings;
        }

        const clonedSettings = {
            ...settings,
            visible: settings.visible, // Ensure this property is explicitly copied
            label: settings.label
        };

        // Make settings reactive
        return Vue.observable(clonedSettings);
    }

    pushChange(content, clearFuture = false) {
        // Ensure we're working with the latest state
        Vue.nextTick(() => {
            this.debouncedPushChange(content, clearFuture);
        });
    }

    _pushChange(content, clearFuture) {
        if (this.present !== null) {
            this.past.push(this._cloneContent(this.present));
            this.past = this.past.slice(-MAX_HISTORY_LENGTH);
        }
        this.present = this._cloneContent(content);
        if (clearFuture) {
            this.future = [];
        }
        this.timestamp = Date.now();
        this.isPerformingAction = false;
        this.emitUpdate();
    }
    canUndo() {
        return this.past.length > 0;
    }

    getTime() {
        return this.timestamp;
    }

    canRedo() {
        return this.future.length > 0;
    }

    undo() {
        if (!this.canUndo()) return;

        if (this.present !== null) {
            this.future.unshift(this._cloneContent(this.present));
        }

        const previous = this.past.pop();
        this.present = this._cloneContent(previous);
        this.isPerformingAction = true;

        Vue.nextTick(() => {
            this.emitUpdate();
            this.eventBus.$emit('undo', this);
        });
    }

    redo() {
        if (!this.canRedo()) return;

        if (this.present !== null) {
            this.past.push(this._cloneContent(this.present));
        }

        const next = this.future.shift();
        this.present = this._cloneContent(next);
        this.isPerformingAction = true;

        Vue.nextTick(() => {
            this.emitUpdate();
            this.eventBus.$emit('redo', this);
        });
    }


    emitUpdate() {
        this.eventBus.$emit('update', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            currentContent: this.present
        });
        this.timestamp = Date.now();
    }

    on(event, callback) {
        this.eventBus.$on(event, callback);
    }

    off(event, callback) {
        this.eventBus.$off(event, callback);
    }
}

export default UndoRedo;

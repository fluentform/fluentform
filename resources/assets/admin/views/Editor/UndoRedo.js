import Vue from 'vue';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';

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

    pushChange(content, clearFuture = false) {
        // Ensure you pass a plain object
        this.debouncedPushChange(this._cloneContent(content), clearFuture);
    }

    _pushChange(content, clearFuture) {

        if (this.present !== null) {
            this.past.push(this._cloneContent(this.present));
            this.past = this.past.slice(-MAX_HISTORY_LENGTH); // Keep the past array within the max length
        }

        this.present = this._cloneContent(content);

        if (clearFuture) {
            this.future = [];
        }
        this.timestamp = Date.now();
        this.isPerformingAction = false;
        this.emitUpdate();
    }

    _cloneContent(content) {
        return cloneDeep(content);
        // Use JSON methods to clone state without reactivity
        return JSON.parse(JSON.stringify(content));
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

        var parsedobj = JSON.parse(JSON.stringify(this.past))
        console.log(parsedobj)
        const previous = this.past.pop();

        var parsedobj = JSON.parse(JSON.stringify(this.past))
        console.log(parsedobj)

        this.present = this._cloneContent(previous);

        this.isPerformingAction = true;
        this.emitUpdate();
        this.eventBus.$emit('undo', this);
    }

    redo() {
        if (!this.canRedo()) return;

        if (this.present !== null) {
            this.past.push(this._cloneContent(this.present));
        }

        const next = this.future.shift();
        this.present = this._cloneContent(next);

        this.isPerformingAction = true;
        this.emitUpdate();
        this.eventBus.$emit('redo', this);
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

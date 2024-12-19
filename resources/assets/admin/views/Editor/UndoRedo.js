import Vue from 'vue';
import debounce from 'lodash/debounce';

class UndoRedo {
    constructor(maxHistory = 10) {
        this.stack = [];
        this.currentIndex = -1;
        this.currentState = null;
        this.isPerformingAction = false;
        this.eventBus = new Vue();
        this.pushDebounced = debounce(this.pushImmediate.bind(this), 300);
    }

    createSnapshot(content) {
        if (content == null) return content;

        if (typeof content !== 'object' || content instanceof Date) {
            return content instanceof Date ? new Date(content) : content;
        }

        if (Array.isArray(content)) {
            return content.map(item => this.createSnapshot(item));
        }

        const snapshot = {};
        for (const [key, value] of Object.entries(content)) {
            // Skip Vue internals
            if (key.startsWith('_') || key === '__ob__') continue;

            // Handle special cases
            if (key === 'form_fields' && typeof value === 'string') {
                try {
                    snapshot[key] = JSON.stringify(
                        JSON.parse(value)
                    );
                } catch {
                    snapshot[key] = value;
                }
            } else {
                snapshot[key] = this.createSnapshot(value);
            }
        }

        return Vue.observable(snapshot);
    }

    pushChange(state) {
        if (!this.isPerformingAction) {
            Vue.nextTick(() => this.pushDebounced(state));
        }
    }

    pushImmediate(state) {
        if (this.isPerformingAction) return;

        const snapshot = this.createSnapshot(state);

        // Clear future states if not at the end
        if (this.currentIndex < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.currentIndex + 1);
        }

        // Add new state and maintain history limit
        this.stack.push(snapshot);
        if (this.stack.length > 10) {
            this.stack = this.stack.slice(-10);
        }

        this.currentIndex = this.stack.length - 1;
        this.currentState = snapshot;
        this.emitUpdate();
    }

    undo() {
        if (!this.canUndo()) return;

        this.isPerformingAction = true;
        this.currentIndex--;
        this.currentState = this.createSnapshot(this.stack[this.currentIndex]);

        Vue.nextTick(() => {
            this.emitUpdate();
            this.eventBus.$emit('undo', { state: this.currentState });
            this.isPerformingAction = false;
        });
    }

    redo() {
        if (!this.canRedo()) return;

        this.isPerformingAction = true;
        this.currentIndex++;
        this.currentState = this.createSnapshot(this.stack[this.currentIndex]);

        Vue.nextTick(() => {
            this.emitUpdate();
            this.eventBus.$emit('redo', { state: this.currentState });
            this.isPerformingAction = false;
        });
    }

    canUndo() {
        return this.currentIndex > 0;
    }

    canRedo() {
        return this.currentIndex < this.stack.length - 1;
    }

    getCurrentState() {
        return this.currentState;
    }

    emitUpdate() {
        this.eventBus.$emit('update', {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            currentContent: this.currentState
        });
    }

    on(event, callback) {
        this.eventBus.$on(event, callback);
    }

    off(event, callback) {
        this.eventBus.$off(event, callback);
    }

    clear() {
        this.stack = [];
        this.currentIndex = -1;
        this.currentState = null;
        this.emitUpdate();
    }
}

export default UndoRedo;

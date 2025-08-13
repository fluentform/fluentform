import notifier from './notifier';

export default {
    /**
     * Translate a string
     * @param str
     * @return {String}
     */
    methods: {
        $t(str) {
            let transString = window.FluentFormApp.form_editor_str[str];
            if (transString) {
                return transString;
            }
            return str;
        },

        /**
         * Toggle vertically among editor sidebar sections
         * @param section
         */
        toggleFieldsSection(section) {
            if (this.optionFieldsSection === section) {
                this.optionFieldsSection = '';
            } else {
                this.optionFieldsSection = section;
            }
        },

        /**
         * Find appropriate vue component dynamically
         * it looks form `template` property in the item object
         * @param item
         * @return {string}
         */
        guessElTemplate(item) {
            let template = 'ff_';
            template += item.template || item.editor_options.template;
            return template;
        },

        // recursive for map through elements
        /**
         * Recursively map through elements
         * triggers a callback function
         * @param allElements
         * @param callback
         */
        mapElements(allElements, callback) {
            _ff.map(allElements, existingItem => {
                if (existingItem.element != 'container') {
                    callback(existingItem);
                }
                if (existingItem.element == 'container') {
                    _ff.map(existingItem.columns, column => {
                        this.mapElements(column.fields, callback);
                    });
                }
            });
        },

        /**
         * generates an unique key and assign it to element
         * @param item
         */
        uniqElKey(item) {
            const uniqueKey = 'el_' + Date.now() + Math.floor(Math.random() * 100);
            item.uniqElKey = uniqueKey; // Directly set the key on the original item
            this.$store.commit('setUniqueKey', { element: item, key: uniqueKey });
        },

        /**
         * Helper method of `makeUniqueNameAttr`
         * @param existingNames {Array}
         * @param item
         * @return {string} new unique name
         */
        getUniqueNameAttr(existingNames, item) {
            let baseName = item.attributes.name || item.element;
            let uniqueName = baseName;
            let counter = 1;

            // Ensure unique name
            while (existingNames.includes(uniqueName)) {
                uniqueName = `${baseName}_${counter++}`;
            }

            return uniqueName;
        },

        /**
         * helper method
         * which helps `insertItemOnClick/handleDrop` to perform its work
         * @param allElements
         * @param newItem
         */
        makeUniqueNameAttr(allElements, newItem) {
            // generate unique key for each element
            this.uniqElKey(newItem);

            if (newItem.attributes.name || newItem.element === 'container') {
                let existingAttrNames = [];

                // Collect existing attribute names
                _ff.map(allElements, existingItem => {
                    if (existingItem.attributes.name) {
                        existingAttrNames.push(existingItem.attributes.name);
                    }
                });

                if (newItem.element === 'container') {
                    _ff.map(newItem.columns, column => {
                        _ff.map(column.fields, field => {
                            let name = this.getUniqueNameAttr(existingAttrNames, field);
                            this.uniqElKey(field);
                            field.attributes.name = name;
                            existingAttrNames.push(name);
                        });
                    });
                } else {
                    let name = this.getUniqueNameAttr(existingAttrNames, newItem);
                    this.$store.commit('setUniqueName', { element: newItem, name });
                }
            }

            // Commit the updated newItem to Vuex
            const index = allElements.indexOf(newItem);
            if (index !== -1) {
                this.$store.commit('updateElement', { index, element: newItem });
            }
        },

        ...notifier,
        // Converted filters to methods for Vue 3 compatibility
        ucFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        },
        _startCase(string) {
            return _ff.startCase(string);
        },
    },
    data() {
        return {
            is_conversion_form: !!window.FluentFormApp.is_conversion_form,
        };
    },
};

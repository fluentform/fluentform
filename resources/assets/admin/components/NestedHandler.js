import {mapMutations} from 'vuex';

import select from './templates/select.vue'
import taxonomy from './templates/taxonomy.vue'
import chainedSelect from './templates/chainedSelect.vue'
import ratings from './templates/ratings.vue'
import netPromoter from './templates/netPromoter.vue'
import dynamicField from './templates/dynamicField.vue'
import formStep from './templates/formStep.vue'
import recaptcha from './templates/recaptcha.vue'
import hcaptcha from './templates/hcaptcha.vue'
import turnstile from './templates/turnstile.vue'
import inputText from './templates/inputText.vue'
import inputSlider from './templates/inputSlider'
import inputFile from './templates/inputFile.vue'
import shortcode from './templates/shortcode.vue'
import inputRadio from './templates/inputRadio.vue'
import inputCheckable from './templates/inputCheckable.vue'
import nameFields from './templates/nameFields.vue'
import actionHook from './templates/actionHook.vue'
import customHTML from './templates/customHTML.vue'
import inputHidden from './templates/inputHidden.vue'
import buttonSubmit from './templates/buttonSubmit.vue'
import sectionBreak from './templates/sectionBreak.vue'
import welcomeScreen from './templates/welcomeScreen.vue'
import repeatFields from './templates/repeatFields.vue'
import selectCountry from './templates/selectCountry.vue'
import inputTextarea from './templates/inputTextarea.vue'
import addressFields from './templates/addressFields.vue'
import termsCheckbox from './templates/termsCheckbox.vue'
import inputCheckbox from './templates/inputCheckbox.vue'
import checkableGrids from './templates/checkableGrids.vue'
import removeElConfirm from './modals/deleteFormElConfirm.vue'
import imagePlaceholder from './templates/imagePlaceholder.vue'
import customButton from './templates/customButton.vue'
import product from './templates/product.vue'
import paymentMethodHolder from './templates/paymentMethodHolder.vue'
import inputMultiPayment from './templates/inputMultiPayment.vue';
import inputSubscriptionPayment from './templates/inputSubscriptionPayment.vue';
import inputCalendar from './templates/inputCalendar.vue';
import CustomEditorField from './editor-field-settings/templates/CustomSettingsField.vue';

import { Splitpanes, Pane } from 'splitpanes'
import ActionBtn from "@/admin/components/ActionBtn/ActionBtn";
import ActionBtnRemove from "@/admin/components/ActionBtn/ActionBtnRemove";
import ActionBtnAdd from "@/admin/components/ActionBtn/ActionBtnAdd";

export default {
    name: 'list',
    props: [
        'item',
        'index',
        'wrapper',
        'editItem',
        'handleDrop',
        'handleEdit',
        'allElements',
        'handleDragend',
        'handleDragstart',
        'editorInserterInContainer',
        'editorInserterInContainerRepeater',
        'fieldNotSupportInContainerRepeater',
    ],
    components: (function() {
        const components = {
            ff_select: select,
            ff_taxonomy: taxonomy,
            ff_chainedSelect: chainedSelect,
            ff_ratings: ratings,
            ff_net_promoter: netPromoter,
            ff_dynamic_field: dynamicField,
            ff_formStep: formStep,
            ff_inputFile: inputFile,
            ff_inputText: inputText,
            ff_inputSlider: inputSlider,
            ff_shortcode: shortcode,
            ff_recaptcha: recaptcha,
            ff_hcaptcha: hcaptcha,
            ff_turnstile: turnstile,
            ff_inputRadio: inputRadio,
            ff_inputCheckable: inputCheckable,
            ff_nameFields: nameFields,
            ff_actionHook: actionHook,
            ff_customHTML: customHTML,
            ff_inputHidden: inputHidden,
            ff_buttonSubmit: buttonSubmit,
            ff_repeatFields: repeatFields,
            ff_sectionBreak: sectionBreak,
            ff_welcomeScreen: welcomeScreen,
            ff_selectCountry: selectCountry,
            ff_inputTextarea: inputTextarea,
            ff_addressFields: addressFields,
            ff_termsCheckbox: termsCheckbox,
            ff_inputCheckbox: inputCheckbox,
            ff_checkableGrids: checkableGrids,
            ff_removeElConfirm: removeElConfirm,
            ff_imagePlaceholder: imagePlaceholder,
            ff_product: product,
            ff_inputPaymentMethods: paymentMethodHolder,
            ff_customButton: customButton,
            ff_inputMultiPayment: inputMultiPayment,
            ff_inputSubscriptionPayment: inputSubscriptionPayment,
            ff_fieldsRepeatSettings: repeatFields,
            ff_inputCalendar: inputCalendar,
            ff_CustomEditorField: CustomEditorField,
            ActionBtn, ActionBtnRemove, ActionBtnAdd,
            Splitpanes, Pane
        };
        
        if (typeof window !== 'undefined' && window.ffEditorTemplates) {
            Object.keys(window.ffEditorTemplates).forEach(key => {
                const componentName = 'ff_' + key;
                components[componentName] = window.ffEditorTemplates[key];
            });
        }
        
        return components;
    })(),
    data() {
        return {
            showRemoveElConfirm: false,
            removeElIndex: null,
        }
    },
    methods: {
        ...mapMutations(['changeFieldMode', 'updateSidebar']),

        /**
         * To check if element template is registered.
         */
        hasRegistered(item) {
            if(!item || !item.editor_options) {
                return false;
            }
            const dynamicComponent = 'ff_' + item.editor_options.template;
            const registeredComponents = Object.keys(this.$options.components);

            return registeredComponents.includes(dynamicComponent);
        },

        maybeConditionIcon(settings) {
            let status = settings && settings.conditional_logics && settings.conditional_logics.status;
            if(status) {
                return '<i class="el-icon el-icon-guide"></i>';
            }
            return '';
        },

        /**
         * Fire an event on close of editor item inserter popup
         */
        editorInserterDismiss(e) {
            FluentFormEditorEvents.$emit('editor-inserter-dismiss', e);
        },

        /**
         * Remove the moved item from it's old place
         * @param {Object} vddl options
         */
        handleMoved({index, list, draggable}) {
            if (('container' === draggable?.element || 'repeater_container' === draggable?.element) && this.editorInserterInContainer) {
                FluentFormEditorEvents.$emit('editor-inserter-in-container', false);
                FluentFormEditorEvents.$emit('editor-inserter-in-container-repeater', false);
                return;
            }

            if (this.fieldNotSupportInContainerRepeater) {
                FluentFormEditorEvents.$emit('not-supported-in-container-repeater', false);
                return;
            }

            list.splice(index, 1);
        },

        /**
         * Action for clicking on edit icon
         * from an element
         * @param index
         * @param item
         */
        editSelected(index, item) {
            this.editorInserterDismiss();
            this.handleEdit(item);
            this.resetContextMenu();
        },

        /**
         * Action for clicking on copy icon
         * from an element
         * @param index
         * @param item
         */
        duplicateSelected(index, item) {
            let freshCopy = JSON.parse(JSON.stringify(item));
            this.makeUniqueNameAttr(this.allElements, freshCopy);
            if (index > -1) {
                this.wrapper.splice(index + 1, 0, freshCopy);
            }
            this.contextMenuIndex = {};
        },

        /**
         * Action for clicking up down from an element
         * @param index
         * @param delta up/down index
         */
        handleUpDown(index, delta) {
            const [firstIndex, lastIndex] = [index, index + delta].sort();
            this.wrapper.splice(firstIndex, 2, this.wrapper[lastIndex], this.wrapper[firstIndex]);
        },

        /**
         * Action for clicking on trash icon
         * from an element
         * @param index
         */
        askRemoveConfirm(index) {
            this.showRemoveElConfirm = true;
            this.removeElIndex = index;
        },

        /**
         * Editor element remove confirmation action
         */
        onRemoveElConfirm() {
            if (this.removeElIndex > -1) {
                const el = this.wrapper[this.removeElIndex];
                FluentFormEditorEvents.$emit('onElRemoveSuccess', el.attributes.name);
                this.wrapper.splice(this.removeElIndex, 1);
                this.showRemoveElConfirm = false;
            }
        },

        /**
         * Editor inserter popup show event
         */
        editorInserterPopup(index, wrapper) {
            FluentFormEditorEvents.$emit('editor-inserter-popup', index, wrapper, this.$el);

            if (jQuery(event.target).closest('.item-container').length) {
                FluentFormEditorEvents.$emit('editor-inserter-in-container', true);
            }
            if (jQuery(event.target).closest('.repeater-item-container').length) {
                FluentFormEditorEvents.$emit('editor-inserter-in-container-repeater', true);
            }
        },

        resize(event) {
            this.item.columns.forEach((item, i) => {
                item.width = this.getNumber(event[i].size);
            })
            // Update modified flag
            const perColumnWidth = this.getNumber(100 / this.item.columns.length);
            this.item.modified = false;
            this.item.columns.forEach(column => {
                if ( column.width != perColumnWidth ){
                    this.item.modified = true;
                }
            })
        },

        resetContainer() {
            const perColumnWidth = this.getNumber(100 / this.item.columns.length);
            this.item.columns.forEach(column => {
                column.width = perColumnWidth;
            })
            this.item.modified = false;
        },

        getNumber(value) {
            value = value || 0;

            return parseFloat(parseFloat(value).toFixed(2));
        },
        maybeHideContainerActions(e) {
            let element = e.target;
            if (element.classList.contains('hover-action-middle')) {
                const topRightElements = document.querySelectorAll('.hover-action-top-right');
                topRightElements.forEach((el) => {
                    el.style.opacity = '0';
                });
            }
            this.resetContextMenu();
        },
        maybeShowContainerActions(e) {
            let element = e.target;
            if (element.classList.contains('hover-action-middle')) {
                const topRightElements = document.querySelectorAll('.hover-action-top-right');
                topRightElements.forEach((el) => {
                    el.style.opacity = '1';
                });
            }
            //re adjust pane css for context menu
            if (jQuery(e.target).closest('.splitpanes__pane').length) {
                let selectedPane = jQuery(e.target).closest('.splitpanes__pane')[0];
                selectedPane.style.overflow = 'hidden';
            }
        },
        showContextMenu(index, e){

            this.$set(this.contextMenuIndex, index, !this.contextMenuIndex[index]);

            if (this.contextMenuIndex[index]) {
                const rect = e.target.getBoundingClientRect();
                this.$set(this.contextMenuStyle, index, {
                    display: 'flex',
                    position: 'absolute',
                    left: `${e.clientX - rect.left}px`,
                    top: `${e.clientY - rect.top}px`,
                });
            } else {
                this.resetContextMenu(index);
            }
            this.adjustPaneCssForContextMenu(e,index);
        },
        resetContextMenu(index = false){
            if (index){
                this.$set(this.contextMenuStyle, index, {
                    display: 'none'
                });
            }
            this.contextMenuIndex = {};
            this.contextMenuStyle = {};
        },
        adjustPaneCssForContextMenu(e, index = false){
            if (jQuery(e.target).closest('.splitpanes__pane').length) {
                let selectedPane = jQuery(e.target).closest('.splitpanes__pane')[0];
                selectedPane.style.overflow = this.contextMenuIndex[index] ? 'visible' : 'hidden';
            }
        },

        /**
         * Handle keyboard delete event for selected item
         */
        handleKeyboardDelete(selectedItem) {
            if (this.item.uniqElKey === selectedItem.uniqElKey) {
                this.askRemoveConfirm(this.index);
            }
        }
    }
};

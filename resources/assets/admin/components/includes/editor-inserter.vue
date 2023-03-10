<template>
    <div v-show="visible"
        :style="editorInserterStyle"
        class="editor-inserter__wrapper search-popup-wrapper" 
        :class="inserterPos"
        @click.stop
        id="js-editor-inserter--popup">

        <div style="padding: 20px;">
            <div class="ff-input-wrap">
                <span class="el-icon el-icon-search"></span>
                <input
                    autocomplete="off"
                    type="text"
                    ref="editor-inserter__search"
                    v-model="inserterSearchStr"
                    :placeholder="$t('Search for a block')"
                    class="editor-inserter__search"
                    id="editor-inserter__search" />
            </div>
        </div>
        
        <template v-if="! inserterSearchResult.length">
            <ul class="nav-tab-list editor-inserter__tabs toggle-fields-options">
                <li :class="editorInserterTab == 'recent' ? 'active' : ''">
                    <a href="#" @click.prevent="changeEditorInserterTab('recent')">Recent</a>
                </li>
                <li :class="editorInserterTab == 'general' ? 'active' : ''">
                    <a href="#" @click.prevent="changeEditorInserterTab('general')">General</a>
                </li>
                <template v-if="!is_conversion_form">
                    <li :class="editorInserterTab == 'advanced' ? 'active' : ''">
                        <a href="#" @click.prevent="changeEditorInserterTab('advanced')">Advanced</a>
                    </li>
                    <li :class="editorInserterTab == 'container' ? 'active' : ''">
                        <a href="#" @click.prevent="changeEditorInserterTab('container')">Container</a>
                    </li>
                </template>
            </ul>

            <div class="editor-inserter__contents">
                <template v-if="editorInserterTab == 'recent'">
                    <listItems :list="recentElements" :insertItemOnClick="insertItemOnClick" />
                </template>

                <template v-if="editorInserterTab == 'general'">
                    <listItems :list="generalMockList" :insertItemOnClick="insertItemOnClick" />
                </template>

                <template v-if="editorInserterTab == 'advanced'">
                    <listItems :list="advancedMockList" :insertItemOnClick="insertItemOnClick" />
                </template>
                
                <template v-if="editorInserterTab == 'container'">
                    <listItems :list="containerMockList" :insertItemOnClick="insertItemOnClick" />
                </template>
            </div>
        </template>

        <template v-else>
            <div class="editor-inserter__contents">
                <listItems :list="inserterSearchResult" :insertItemOnClick="insertItemOnClick" />
            </div>
        </template>
    </div>
</template>

<script>
import listItems from './el-list-items.vue';

export default {
    name: 'editor-inserter',
    components: {
        listItems
    },
    props: {
        visible: {
            type: Boolean,
            required: true
        },
        dropzone: {
            type: Array,
            required: true
        },
        postMockList: {
            type: Array,
            required: true
        },
        taxonomyMockList: {
            type: Array,
            required: true
        },
        generalMockList: {
            type: Array,
            required: true
        },
        advancedMockList: {
            type: Array,
            required: true
        },
        containerMockList: {
            type: Array,
            required: true
        },
        paymentsMockList: {
            type: Array,
            required: true
        },
        insertItemOnClick: {
            type: Function,
            required: true
        }
    },
    data() {
        return {
            editorInserterStyle: {
                width: "444px",
                height: "370px",
                'z-index': 9999
            },
            inserterPos: 'is-bottom',
            topOffset: 0,
            bodyScrollPos: 0,
            editorInserterTab: 'general',
            inserterSearchStr: '',
            inserterSearchResult: [],
            tags: window.FluentFormApp.element_search_tags
        }
    },
    watch: {
        inserterSearchStr() {
            const inserterSearchStr = this.inserterSearchStr.trim().toLowerCase();
            const tags = this.tags;
            let searchResult = [];

            if (inserterSearchStr) {
                searchResult = this.allMockElements.filter((item) => {
                    if (tags[item.element]) {
                        return tags[item.element].toString().toLowerCase().includes(inserterSearchStr);
                    }
                });
            }
            this.inserterSearchResult = searchResult;
        }
    },
    computed: {
        allMockElements() {
            return [
                ...this.postMockList,
                ...this.taxonomyMockList,
                ...this.generalMockList,
                ...this.advancedMockList,
                ...this.containerMockList,
                ...this.paymentsMockList
            ];
        },

        /**
         * @description 
         * computes the latest inserted elements
         * @returns {Array}
        */
        recentElements() {
            const defaultElNames = [
                'input_text',
                'textarea',
                'input_email',
                'select',
                'input_radio',
                'input_checkbox',
                'input_date',
                'input_hidden',
                'container'
            ];

            /**
             * Prepare for flatten all the items
            */
            const flatAllEls = [];
            this.mapElementsRecursively(this.dropzone.slice(), flatAllEls);

            /**
             * Filter names for all unique recent items
            */
            const recentElNames = flatAllEls
            // sorting for most recent elements
            .sort((prev, curr) => (
                curr.uniqElKey.substr(3) - prev.uniqElKey.substr(3)
            ))
            .map(item => item.element)
            // fill rest slots with predefined default elements
            .concat(defaultElNames)
            .filter(_ff.unique)
            // allowing only first "9" elements
            .slice(0, 9);

            // fetch elements from the listed mock items
            const allMockElements = this.allMockElements;
            const allMockElNames = allMockElements.map( item => item.element );

            return recentElNames.map(value => (
                allMockElements[allMockElNames.indexOf( value )]
            ));
        },

        inserterHeight() {
            return parseInt(this.editorInserterStyle.height);
        },

        inserterWidth() {
            return parseInt(this.editorInserterStyle.width);
        }
    },
    methods: {
        /** 
         * Helper method for determining the most recently added elements
         * @returns void
         */
        mapElementsRecursively(allElements, flatArr) {
            _ff.map(allElements, (existingItem) => {
                if (existingItem.element != 'container') {
                    flatArr.push(existingItem);
                }
                if (existingItem.element == 'container') {
                    flatArr.push(existingItem);
                    _ff.map(existingItem.columns, (column) => {
                        this.mapElementsRecursively(column.fields, flatArr);
                    });
                }
            });
        },

        changeEditorInserterTab(tabName) {
            this.editorInserterTab = tabName;
        },

        editorInserterPopup() {
            const leftOffset = event.clientX - this.inserterWidth / 2;
            this.inserterSearchStr = '';
            this.topOffset = event.clientY + 20;
            this.bodyScrollPos = jQuery('#js-form-editor--body').scrollTop();

            // Focusing on search input box
            setTimeout( _ => this.$refs['editor-inserter__search'].focus() );

            // Show on above if 2/3 can not be shown below
            if (jQuery(window).height() < this.topOffset + (this.inserterHeight * 2 / 3)) {
                this.topOffset = event.clientY - 20 - this.inserterHeight;
                this.inserterPos = 'is-top';
            } else {
                this.inserterPos = 'is-bottom';
            }

            this.editorInserterStyle = Object.assign({}, this.editorInserterStyle, {
                top: this.topOffset + 'px',
                left: leftOffset + 'px'
            });
        }
    },
    created() {
        FluentFormEditorEvents.$on('editor-inserter-popup', this.editorInserterPopup);
    },
    mounted() {
        jQuery('#js-form-editor--body').scroll( target => {
            const scrollTopOffset = this.topOffset - (target.scrollTop - this.bodyScrollPos);
            this.editorInserterStyle.top = scrollTopOffset  + 'px';
        });
    }
}
</script>

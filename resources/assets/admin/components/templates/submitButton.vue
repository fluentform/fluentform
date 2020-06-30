<template>
    <div class="panel__body--item"
        :class="['text-' + submitButton.settings.align, {'selected': !!editItem.uniqElKey && editItem.uniqElKey == submitButton.uniqElKey}]">
        <div @click="editSelected(submitButton)" class="item-actions-wrapper hover-action-middle">
            <div class="item-actions">
                <i @click="editSelected(submitButton)" class="icon icon-pencil"></i>
            </div>
        </div>
        <!-- ADDED IN v1.2.6 -->
        <template v-if="submitButton.settings.button_ui">
            <button 
                class="ff-btn"
                :class="[btnSize, btnStyleClass]"
                v-if="submitButton.settings.button_ui.type == 'default'"
                v-html="submitButton.settings.button_ui.text"
                :style="btnStyles">
            </button>
            <img v-else :src="submitButton.settings.button_ui.img_url" alt="Submit Button" style="max-width: 200px;">
        </template>

        <!-- Button before 1.2.6 -->
        <button
            class="ff-btn"
            :class="btnSize"
            v-if="submitButton.settings.btn_text"
            :style="btnStyles">
            {{ submitButton.settings.btn_text }}
        </button>
    </div>
</template>

<script>
export default {
    name: 'buttonSubmit',
    props: ['submitButton', 'editSelected', 'editItem'],
    computed: {
        btnStyles() {
            if(this.submitButton.settings.button_style != '') {
                return {
                    backgroundColor: this.submitButton.settings.background_color,
                    color: this.submitButton.settings.color,
                }
            }

            let defaultStyles = this.submitButton.settings.normal_styles;

            let currentState = 'normal_styles';
            if(this.submitButton.settings.current_state == 'hover_styles' && this.editItem.element == 'button') {
                currentState = 'hover_styles';
            }

            if(!this.submitButton.settings[currentState]) {
                return defaultStyles;
            }

            let styles = JSON.parse(JSON.stringify(this.submitButton.settings[currentState]));

            if(styles.borderRadius) {
                styles.borderRadius = styles.borderRadius+'px';
            } else {
                delete(styles.borderRadius);
            }

            if(!styles.minWidth) {
                delete(styles.minWidth);
            }

            return { ...defaultStyles, ...styles};
        },
        btnStyleClass() {
            return this.submitButton.settings.button_style;
        },
        btnSize() {
            return 'ff-btn-' + this.submitButton.settings.button_size
        }
    }
}
</script>

<style lang="scss">
.ff {
    &-btn {
        display: inline-block;
        font-weight: 400;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        user-select: none;
        border: 1px solid transparent;
        padding: 6px 12px;
        font-size: 16px;
        line-height: 1.5;
        border-radius: 4px;
        transition: background-color 0.15s ease-in-out,
                    border-color 0.15s ease-in-out,
                    box-shadow 0.15s ease-in-out;

        &:focus,
        &:hover {
            outline: 0;
            text-decoration: none;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        &:disabled,
        &.disabled {
            opacity: .65;
        }

        // button sizes
        &-lg {
            padding: 8px 16px;
            font-size: 18px;
            line-height: 1.5;
            border-radius: 6px;
        }

        &-sm {
            padding: 4px 8px;
            font-size: 13px;
            line-height: 1.5;
            border-radius: 3px;
        }

        // full width button
        &-block {
            display: block;
            width: 100%;
        }

        &-primary {
            background-color: #409EFF;
            color: #fff;
        }

        &-green {
            background-color: #67C23A;
            color: #fff;
        }

        &-orange {
            background-color: #E6A23C;
            color: #fff;
        }

        &-red {
            background-color: #F56C6C;
            color: #fff;
        }
        
        &-gray {
            background-color: #909399;
            color: #fff;
        }
    }
}
</style>

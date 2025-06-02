<template>
    <div class="field_general">
        <input-popover
            :fieldType="field_type"
            :placeholder="placeholder"
            v-model="fieldValue"
            icon="el-icon-arrow-down"
            :data="editorShortcodes"
        ></input-popover>
    </div>
</template>

<script type="text/babel">
    import inputPopover from '../../input-popover.vue';

    export default {
        name: 'fieldGeneral',
        components: {
            inputPopover
        },
        props: {
            value: [String, Number, Boolean],
            editorShortcodes: Array,
            field_type: {
                type: String,
                default: 'text'
            },
            placeholder : {
                type: String,
                default: 'Select a Field or Type Custom value'
            }

        },
	    computed : {
		    fieldValue: {
			    get() {
				    return this.value;
			    },
			    set(value) {
				    this.$emit('input', value);
			    }
		    }
	    }
    }
</script>

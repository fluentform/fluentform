<template>
    <span>
        <el-popover
            ref="popover"
            placement="top"
            :width="180"
            v-model="visible"
        >
            <p>{{ $t('Are you sure to delete this?') }}</p>
            <div class="text-right">
                <el-button size="mini" type="text" @click="visible = false">
                    {{ $t('Cancel') }}
                </el-button>
                <el-button type="primary" size="mini" @click="confirmAction">
                    {{ $t('Confirm') }}
                </el-button>
            </div>
        </el-popover>

        <span v-popover:popover>
            <slot><i class="el-icon el-icon-delete" style="cursor: pointer"></i></slot>
        </span>
    </span>
</template>

<script>
    export default {
        name: 'confirmRemove',
        props: ['text'],
        data() {
            return {
                visible: false
            };
        },
        methods: {
            confirmAction() {
                this.visible = false;
                this.$emit('on-confirm');
            }
        }
    };
</script>

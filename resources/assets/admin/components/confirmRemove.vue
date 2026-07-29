<template>
    <span>
        <el-popover
            ref="popover"
            placement="top"
            :width="190"
            v-model="visible"
        >
            <p class="text-right">{{ $t('Are you sure to delete this?') }}</p>
            <div class="text-right">
                <el-button size="mini" type="info" class="el-button--soft" @click="visible = false">
                    {{ $t('Cancel') }}
                </el-button>
                <el-button type="danger" size="mini" @click="confirmAction">
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

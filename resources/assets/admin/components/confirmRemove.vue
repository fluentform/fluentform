<template>
    <el-popconfirm
        :title="text || $t('Are you sure to delete this?')"
        @confirm="confirmAction"
    >
        <template #reference>
            <slot>
                <p class="text-right">{{ $t('Are you sure to delete this?') }}</p>
                <div class="text-right">
                    <el-button size="small" type="info" class="el-button--soft" @click="visible = false">
                        {{ $t('Cancel') }}
                    </el-button>
                    <el-button type="danger" size="small" @click="confirmAction">
                        {{ $t('Confirm') }}
                    </el-button>
                </div>
            </slot>
        </template>
    </el-popconfirm>
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

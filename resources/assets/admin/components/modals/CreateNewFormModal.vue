<template>
    <div :class="{'ff_backdrop': visibility}">
        <el-dialog
            class="create_new_form_modal"
            :visible="visibility"
            :before-close="close"
        >
            <div slot="title" class="ff_row align_items_center">
                <div class="ff_section_title mr-3">{{ $t('Create A New Form') }}</div>
                <el-button type="primary" plain>
                    {{ $t('Import Form')}}
                </el-button>
            </div>
            <div class="ff_card_wrap mt-5">
                <el-row :gutter="20">
                    <el-col :sm="8">
                        <div class="ff_card">
                            <div class="ff_card_img mb-4">
                                <img :src="blankFormImage" alt="blank-form">
                            </div>
                            <div class="ff_card_body">
                                <h6 class="mb-2">New Blank Form</h6>
                                <p>Create a New Blank form from scratch</p>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </div>
        </el-dialog>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'CreateNewFormModal',
    props: {
        visibility: Boolean
    },
    data() {
        return {
            blankFormImage: FluentFormApp.plugin_public_url + 'img/blank-form-img.png'
        }
    },
    methods: {
        close() {
            this.$emit('update:visibility', false);
        }
    }
};
</script>

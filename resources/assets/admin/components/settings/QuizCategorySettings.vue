<template>
    <el-form-item class="ff-form-item">
        <template slot="label">
            {{ $t('Quiz Categories') }}
            <el-tooltip class="item" effect="dark" :content="$t('Organize quiz questions into categories for better reporting')" placement="top">
                <i class="el-icon-info"></i>
            </el-tooltip>
        </template>
        <table class="ff_entry_table">
            <tr>
                <th>{{ $t('Category Name') }}</th>
                <th>{{ $t('Color') }}</th>
                <th>{{ $t('Actions') }}</th>
            </tr>
            <tr v-for="(category, categoryIndex) in categories" :key="categoryIndex">
                <td>
                    <el-input 
                        size="small" 
                        v-model="category.name" 
                        :placeholder="$t('Category Name')"
                        @input="updateCategories"
                    />
                </td>
                <td>
                    <el-color-picker 
                        v-model="category.color"
                        @change="updateCategories"
                    ></el-color-picker>
                </td>
                <td>
                    <action-btn class="ml-2 mb-1">
                        <action-btn-add @click="addCategory(categoryIndex)"></action-btn-add>
                        <action-btn-remove 
                            v-if="categories.length > 1" 
                            @click="removeCategory(categoryIndex)"
                        ></action-btn-remove>
                    </action-btn>
                </td>
            </tr>
        </table>
    </el-form-item>
</template>

<script>
import ActionBtn from '@/admin/components/ActionBtn/ActionBtn.vue';
import ActionBtnAdd from '@/admin/components/ActionBtn/ActionBtnAdd.vue';
import ActionBtnRemove from '@/admin/components/ActionBtn/ActionBtnRemove.vue';

export default {
    name: 'QuizCategorySettings',
    components: {
        ActionBtn,
        ActionBtnAdd,
        ActionBtnRemove
    },
    props: {
        value: {
            type: Array,
            default: () => [{
                name: 'General',
                color: '#1a7efb'
            }]
        }
    },
    data() {
        return {
            categories: this.value
        };
    },
    watch: {
        value: {
            handler(newVal) {
                this.categories = newVal;
            },
            deep: true
        }
    },
    methods: {
        addCategory(index) {
            this.categories.splice(index + 1, 0, {
                name: 'Category',
                color: '#1a7efb'
            });
            this.updateCategories();
        },
        removeCategory(index) {
            this.categories.splice(index, 1);
            this.updateCategories();
        },
        updateCategories() {
            this.$emit('input', this.categories);
        }
    }
};
</script>


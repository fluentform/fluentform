<template>
    <el-pagination 
        class="ff_pagination"
        background
        layout="total, sizes, prev, pager, next"
        @current-change="changePage"
        @size-change="changeSize"
        :current-page.sync="pagination.current_page"
        :page-sizes="page_sizes"
        :page-size="parseInt(pagination.per_page)"
        :total="pagination.total"
    />
</template>

<script type="text/babel">
import { scrollTop } from '@fluentform/admin/helpers'

export default {
    name: 'Pagination',
    props: {
        pagination: {
            required: true,
            type: Object
        },
        storePerPageAs: {
            required: false,
            type : String
        }
    },
    computed: {
        page_sizes() {
            const sizes = [];
            if (this.pagination.per_page < 10) {
                sizes.push(this.pagination.per_page);
            }

            const defaults = [
                10,
                20,
                50,
                80,
                100,
                120,
                150
            ];

            return [...sizes, ...defaults];
        }
    },
    methods: {
        changePage(page) {
            this.pagination.current_page = page;
            this.fetch();
        },
        changeSize(size) {
            this.pagination.per_page = size;
            if (this.storePerPageAs) {
                localStorage.setItem(this.storePerPageAs, size)
            }
            this.fetch();
        },
        fetch() {
            scrollTop().then(_ => {
                this.$emit('fetch');
            });
        }
    }
}
</script>

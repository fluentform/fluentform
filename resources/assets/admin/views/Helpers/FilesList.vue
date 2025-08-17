<template>
    <div class="wpf_entry_value">
        <el-row v-if="dataItems[itemKey]" v-for="(row, index) in getChunk(dataItems[itemKey])"
                :gutter="10" :key="index"
        >
            <el-col v-for="(file, index) in row" :md="6" :key="index">
                <el-card class="input_file" :body-style="{ padding: '0' }">
                    <span class="input_file_ext"><i class="el-icon-document"></i>{{ file | fileExtension }}</span>
                    <div style="padding: 10px; text-align: center;">
                        <a :href="file" target="_blank">{{ file | filename }}</a>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script>
    export default {
        name: 'EntryFileList',
        props: ['itemKey', 'dataItems'],
        filters: {
            filename(url) {
                return url ? url.split('/').pop().split('#')[0].split('?')[0].split('.').shift() : '';
            },
            fileExtension(url) {
                return url ? url.split('/').pop().split('#')[0].split('?')[0].split('.').pop() : '';
            }
        },
        methods: {
            getChunk(items, chunkSize = 4) {
                return items ? _ff.chunk(items, chunkSize) : [];
            }
        }
    }
</script>
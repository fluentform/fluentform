<template>
    <div class="wpf_entry_value">
        <el-row v-if="dataItems[itemKey]" v-for="(row, index) in getChunk(dataItems[itemKey])"
                :gutter="10" :key="index"
        >
            <el-col v-for="(file, index) in row" :md="6" :key="index">
                <el-card class="input_file" :body-style="{ padding: '0' }">
                    <span class="input_file_ext"><el-icon><Document /></el-icon>{{ fileExtension(file) }}</span>
                    <div style="padding: 10px; text-align: center;">
                        <a :href="file" target="_blank">{{ filename(file) }}</a>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script type="text/babel">
import { Document } from '@element-plus/icons-vue';
import { ElIcon } from 'element-plus';

export default {
    name: 'EntryFileList',
    components: {
        Document,
        ElIcon,
    },
    props: ['itemKey', 'dataItems'],
    methods: {
        filename(url) {
            return url ? url.split('/').pop().split('#')[0].split('?')[0].split('.').shift() : '';
        },
        fileExtension(url) {
            return url ? url.split('/').pop().split('#')[0].split('?')[0].split('.').pop() : '';
        },
        getChunk(items, chunkSize = 4) {
            return items ? _ff.chunk(items, chunkSize) : [];
        }
    }
}
</script>
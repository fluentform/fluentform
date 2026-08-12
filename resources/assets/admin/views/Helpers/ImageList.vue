<template>
    <div class="wpf_entry_value">
        <el-row
            v-for="(row, index) in getChunk(dataItems[itemKey])"
            :gutter="10"
            :key="index"
            style="margin-bottom: 10px;"
        >
            <el-col v-for="(file, index) in row" :md="6" :key="index">
                <a :href="safeUrl(file)" target="_blank" class="input-image">
                    <img :src="safeUrl(file)" alt="">
                </a>
            </el-col>
        </el-row>
    </div>
</template>

<script type="text/babel">
    export default {
        name: 'EntryImageList',
        props: ['itemKey', 'dataItems'],
        methods: {
            getChunk(items, chunkSize = 4) {
                if(typeof items == 'string') {
                    return [[items]];
                }
                return items ? _ff.chunk(items, chunkSize) : [];
            },
            // SECURITY (FINDING-23): block javascript:/data:/vbscript: schemes on the submitted
            // upload value before binding it into :href/:src (see FilesList.vue).
            safeUrl(url) {
                if (!url) {
                    return '';
                }
                if (/^\s*(javascript|data|vbscript):/i.test(String(url))) {
                    return '#';
                }
                return url;
            }
        }
    }
</script>
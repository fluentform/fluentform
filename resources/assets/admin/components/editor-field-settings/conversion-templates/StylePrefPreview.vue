<template>
    <div class="ff_conv_media_preview">
        <div class="fcc_block_media_attachment" :class="'fc_i_layout_' + pref.layout">
            <picture class="fc_image_holder">
                <img :src="pref.media" />
            </picture>
        </div>
    </div>
</template>

<script type="text/babel">
export default {
    name: 'StylePrefPreview',
    props: ['pref']
}
</script>

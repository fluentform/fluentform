<template>
    <div class="ff_conv_media_preview">
        <img :src="pref.media" />
    </div>
</template>

<script type="text/babel">
export default {
    name: 'StylePrefPreview',
    props: ['pref']
}
</script>

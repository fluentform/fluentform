<template>
    <div class="ff_step_wrapper">
        <div class="ff_step text-center">
            <div class="ff_step_indicator_text">
                {{ $t('End of last page') }}
            </div>

            <div class="ff_step_indicator_title ff_title_separetor">
                <span>{{ $t('page break') }}</span>
            </div>

            <div class="ff_step_indicator_text">
                {{ $t('Top of new page') }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'formStep',
    props: ['item'],
}
</script>
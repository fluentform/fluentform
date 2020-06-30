<template>

    <div class="form-step__wrapper">
        <div class="step-start text-center">
            <div class="end-of-page">
                End of page
            </div>

            <div class="step-start__indicator">
                <strong>PAGE BREAK</strong>
                <hr>
            </div>

            <div class="start-of-page">
                Top of new page
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
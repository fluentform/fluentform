function getFormElement(formReference) {
    if (!formReference) {
        return null;
    }

    if (formReference.nodeType === 1) {
        return formReference;
    }

    if (formReference[0] && formReference[0].nodeType === 1) {
        return formReference[0];
    }

    return null;
}

function updateActiveLabels(currentLabel) {
    const ratingLabels = Array.from(currentLabel.parentElement.querySelectorAll('label'));
    const activeIndex = ratingLabels.indexOf(currentLabel);

    ratingLabels.forEach((label, index) => {
        label.classList.toggle('active', index <= activeIndex);
    });
}

function updateSelectedLabels(ratingElement) {
    const checkedInput = ratingElement.querySelector('input:checked');
    const checkedLabel = checkedInput ? checkedInput.closest('label') : null;
    const ratingLabels = Array.from(ratingElement.querySelectorAll('label'));

    if (!checkedLabel) {
        ratingLabels.forEach((label) => label.classList.remove('active'));
        return;
    }

    const activeIndex = ratingLabels.indexOf(checkedLabel);
    ratingLabels.forEach((label, index) => {
        label.classList.toggle('active', index <= activeIndex);
    });
}

function showRatingText(labelElement) {
    const contentElement = labelElement.closest('.ff-el-input--content');
    if (!contentElement) {
        return;
    }

    const targetInput = labelElement.querySelector('input');
    const targetId = targetInput ? targetInput.id : '';

    contentElement.querySelectorAll('.ff-el-rating-text').forEach((ratingText) => {
        ratingText.style.display = 'none';
    });

    if (!targetId) {
        return;
    }

    const targetText = contentElement.querySelector(`[data-id="${targetId}"]`);
    if (targetText) {
        targetText.style.display = 'inline-block';
    }
}

export default function (formReference) {
    const formElement = getFormElement(formReference);
    if (!formElement) {
        return;
    }

    const ratingElements = formElement.querySelectorAll('.jss-ff-el-ratings');
    if (!ratingElements.length) {
        return;
    }

    ratingElements.forEach((ratingElement) => {
        updateSelectedLabels(ratingElement);

        ratingElement.addEventListener('mouseover', function (event) {
            const labelElement = event.target.closest('label');
            if (!labelElement || !ratingElement.contains(labelElement)) {
                return;
            }

            updateActiveLabels(labelElement);
            showRatingText(labelElement);
        });

        ratingElement.addEventListener('click', function (event) {
            const labelElement = event.target.closest('label');
            if (!labelElement || !ratingElement.contains(labelElement)) {
                return;
            }

            const iconElement = labelElement.querySelector('.jss-ff-svg');
            if (!iconElement) {
                return;
            }

            iconElement.classList.add('scale');
            iconElement.classList.add('scalling');

            setTimeout(() => {
                iconElement.classList.remove('scalling');
                iconElement.classList.remove('scale');
            }, 150);
        });

        ratingElement.addEventListener('mouseleave', function () {
            updateSelectedLabels(ratingElement);

            const checkedInput = ratingElement.querySelector('input:checked');
            const checkedId = checkedInput ? checkedInput.id : '';
            const contentElement = ratingElement.closest('.ff-el-input--content');

            if (!contentElement) {
                return;
            }

            contentElement.querySelectorAll('.ff-el-rating-text').forEach((ratingText) => {
                ratingText.style.display = 'none';
            });

            if (!checkedId) {
                return;
            }

            const checkedText = contentElement.querySelector(`[data-id="${checkedId}"]`);
            if (checkedText) {
                checkedText.style.display = 'inline-block';
            }
        });
    });
}

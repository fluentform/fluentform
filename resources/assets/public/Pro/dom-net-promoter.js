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

const initNetPromoter = function (formReference) {
    const formElement = getFormElement(formReference);
    if (!formElement) {
        return;
    }

    const netPromoterElements = formElement.querySelectorAll('.jss-ff-el-net-promoter');
    if (!netPromoterElements.length) {
        return;
    }

    netPromoterElements.forEach((netPromoterElement) => {
        netPromoterElement.addEventListener('click', function (event) {
            const labelElement = event.target.closest('label');
            if (!labelElement || !netPromoterElement.contains(labelElement)) {
                return;
            }

            netPromoterElement.querySelectorAll('label').forEach((label) => {
                label.classList.toggle('active', label === labelElement);
            });
        });
    });
};

export default initNetPromoter;

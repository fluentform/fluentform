/**
 * Character Counter Module
 * Handles live character counting for text inputs with maxlength
 */
export default function initCharacterCounter($form) {
    const $fields = $form.find('[data-character-counter="true"]');
    
    if (!$fields.length) {
        return;
    }
    
    $fields.each(function() {
        const $field = jQuery(this);
        const $container = $field.closest('.ff-el-group');
        const $counter = $container.find('.ff-el-character-counter');
        
        if (!$counter.length) {
            return;
        }
        
        const maxLength = parseInt($field.attr('maxlength') || $counter.data('max-length'));
        const format = $field.data('counter-format') || $counter.data('format');
        
        // Update counter function
        function updateCounter() {
            const currentLength = $field.val().length;
            const remaining = maxLength - currentLength;
            const percentage = (currentLength / maxLength) * 100;
            
            let text = '';
            if (format === 'count_used') {
                text = currentLength + ' / ' + maxLength;
            } else {
                // count_remaining (default)
                text = remaining === 1 
                    ? remaining + ' character remaining'
                    : remaining + ' characters remaining';
            }
            
            $counter.text(text);
            
            // Update state classes
            $counter
                .removeClass('ff-counter-normal ff-counter-warning ff-counter-error')
                .addClass(getCounterStateClass(percentage));
        }
        
        function getCounterStateClass(percentage) {
            if (percentage >= 100) {
                return 'ff-counter-error';
            } else if (percentage >= 80) {
                return 'ff-counter-warning';
            }
            return 'ff-counter-normal';
        }
        
        // Bind events
        $field.on('input keyup paste', updateCounter);
        
        // Initialize
        updateCounter();
    });
}

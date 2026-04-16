/**
 * Fluent Forms Gutenberg Block Edit Component
 * Enhanced with custom UX controls
 */
import EditComponent from './components/EditComponent';
const { useBlockProps } = wp.blockEditor;

function Edit(props) {
    const blockProps = useBlockProps({
        className: 'fluentform-guten-wrapper'
    });

    return (
        <div {...blockProps}>
            <EditComponent {...props} />
        </div>
    );
}

export default Edit;
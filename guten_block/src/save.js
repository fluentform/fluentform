/**
 * Fluent Forms Gutenberg Block Save Component
 */
const { useBlockProps } = wp.blockEditor;

/**
 * Save component for the Fluent Forms block
 * 
 * Since we're using ServerSideRender in the edit component,
 * this component doesn't render anything on the client side.
 * The actual rendering happens on the server.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.attributes - Block attributes
 * @return {null} Returns null as we don't need to render anything
 */
const Save = ({ attributes }) => {
    // We don't need to render anything on the client side
    // The actual rendering happens on the server via ServerSideRender
    return null;
};

export default Save;
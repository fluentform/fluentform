/**
 * Fluent Forms Gutenberg Block Style Tab Component
 */
const { __ } = wp.i18n;
const {
    PanelBody,
    TextControl,
} = wp.components;

// Import custom components
import FluentTypography from '../controls/FluentTypography';
import FluentColorPicker from '../controls/FluentColorPicker';
import FluentSpaceControl from '../controls/FluentSpaceControl';



const TabMisc = ({ attributes, setAttributes }) => {
    return (
        <>
            <PanelBody title={__("Container Styles")} initialOpen={true}>

            </PanelBody>

        </>
    );
};

export default TabMisc;

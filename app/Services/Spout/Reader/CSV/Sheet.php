<?php

namespace FluentForm\Box\Spout\Reader\CSV;

use FluentForm\Box\Spout\Reader\SheetInterface;

/**
 * Class Sheet
 *
 * @package FluentForm\Box\Spout\Reader\CSV
 */
class Sheet implements SheetInterface
{
    /** @var \FluentForm\Box\Spout\Reader\CSV\RowIterator To iterate over the CSV's rows */
    protected $rowIterator;

    /**
     * @param resource $filePointer Pointer to the CSV file to read
     * @param \FluentForm\Box\Spout\Reader\CSV\ReaderOptions $options
     * @param \FluentForm\Box\Spout\Common\Helper\GlobalFunctionsHelper $globalFunctionsHelper
     */
    public function __construct($filePointer, $options, $globalFunctionsHelper)
    {
        $this->rowIterator = new RowIterator($filePointer, $options, $globalFunctionsHelper);
    }

    /**
     * @api
     * @return \FluentForm\Box\Spout\Reader\CSV\RowIterator
     */
    public function getRowIterator()
    {
        return $this->rowIterator;
    }

    /**
     * @api
     * @return int Index of the sheet
     */
    public function getIndex()
    {
        return 0;
    }

    /**
     * @api
     * @return string Name of the sheet - empty string since CSV does not support that
     */
    public function getName()
    {
        return '';
    }

    /**
     * @api
     * @return bool Always TRUE as there is only one sheet
     */
    public function isActive()
    {
        return true;
    }
}

<?php

namespace FluentForm\Box\Spout\Reader;

/**
 * Interface SheetInterface
 *
 * @package FluentForm\Box\Spout\Reader
 */
interface SheetInterface
{
    /**
     * Returns an iterator to iterate over the sheet's rows.
     *
     * @return \Iterator
     */
    public function getRowIterator();
}

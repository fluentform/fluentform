<?php

namespace FluentForm\Box\Spout\Reader;

/**
 * Interface ReaderInterface
 *
 * @package FluentForm\Box\Spout\Reader
 */
interface ReaderInterface
{
    /**
     * Prepares the reader to read the given file. It also makes sure
     * that the file exists and is readable.
     *
     * @param  string $filePath Path of the file to be read
     * @return void
     * @throws \FluentForm\Box\Spout\Common\Exception\IOException
     */
    public function open($filePath);

    /**
     * Returns an iterator to iterate over sheets.
     *
     * @return \Iterator To iterate over sheets
     * @throws \FluentForm\Box\Spout\Reader\Exception\ReaderNotOpenedException If called before opening the reader
     */
    public function getSheetIterator();

    /**
     * Closes the reader, preventing any additional reading
     *
     * @return void
     */
    public function close();
}

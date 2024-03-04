<?php

namespace FluentForm\Box\Spout\Reader;

use FluentForm\Box\Spout\Common\Exception\UnsupportedTypeException;
use FluentForm\Box\Spout\Common\Helper\GlobalFunctionsHelper;
use FluentForm\Box\Spout\Common\Type;

/**
 * Class ReaderFactory
 * This factory is used to create readers, based on the type of the file to be read.
 * It supports CSV and XLSX formats.
 *
 * @package FluentForm\Box\Spout\Reader
 */
class ReaderFactory
{
    /**
     * This creates an instance of the appropriate reader, given the type of the file to be read
     *
     * @api
     * @param  string $readerType Type of the reader to instantiate
     * @return ReaderInterface
     * @throws \FluentForm\Box\Spout\Common\Exception\UnsupportedTypeException
     */
    public static function create($readerType)
    {
        $reader = null;

        switch ($readerType) {
            case Type::CSV:
                $reader = new CSV\Reader();
                break;
            case Type::XLSX:
                $reader = new XLSX\Reader();
                break;
            case Type::ODS:
                $reader = new ODS\Reader();
                break;
            default:
                throw new UnsupportedTypeException('No readers supporting the given type: ' . $readerType);
        }

        $reader->setGlobalFunctionsHelper(new GlobalFunctionsHelper());

        return $reader;
    }
}

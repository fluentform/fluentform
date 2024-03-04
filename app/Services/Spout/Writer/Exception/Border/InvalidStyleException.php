<?php

namespace FluentForm\Box\Spout\Writer\Exception\Border;

use FluentForm\Box\Spout\Writer\Exception\WriterException;
use FluentForm\Box\Spout\Writer\Style\BorderPart;

class InvalidStyleException extends WriterException
{
    public function __construct($name)
    {
        $msg = '%s is not a valid style identifier for a border. Valid identifiers are: %s.';

        parent::__construct(sprintf($msg, $name, implode(',', BorderPart::getAllowedStyles())));
    }
}

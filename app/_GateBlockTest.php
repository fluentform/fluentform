<?php

namespace FluentForm\App;

class GateBlockTest
{
    public function run()
    {
        $date = new \DateTime();
        return $date->thisMethodDoesNotExist();
    }
}

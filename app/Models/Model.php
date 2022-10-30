<?php

namespace FluentForm\App\Models;

use FluentForm\Framework\Database\Orm\Model as BaseModel;

class Model extends BaseModel
{
    protected $guarded = ['id', 'ID'];
}

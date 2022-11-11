<?php

namespace FluentForm\App\Models;

class Submission extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'fluentform_submissions';

    /**
     * The attributes that aren't mass assignable.
     *
     * @var array
     */
    protected $guarded = ['id'];

    /**
     * A formMeta is owned by a form.
     *
     * @return \FluentForm\Framework\Database\Orm\Relations\BelongsTo
     */
    public function form()
    {
        return $this->belongsTo(Form::class, 'form_id', 'id');
    }
}

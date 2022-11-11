<?php

namespace FluentForm\App\Models;

class SubmissionMeta extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'fluentform_submission_meta';

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

<?php

namespace FluentForm\Framework\Database\Orm;

use BadMethodCallException;
use FluentForm\Framework\Support\Str;
use FluentForm\Framework\Database\Orm\Relations\HasMany;
use FluentForm\Framework\Database\Orm\Relations\MorphOneOrMany;

/**
 * @template TIntermediateModel of \FluentForm\Framework\Database\Orm\Model
 * @template TDeclaringModel of \FluentForm\Framework\Database\Orm\Model
 */
class PendingHasThroughRelationship
{
    /**
     * The root model that the relationship exists on.
     *
     * @var TDeclaringModel
     */
    protected $rootModel;

    /**
     * The local relationship.
     *
     * @var \FluentForm\Framework\Database\Orm\Relations\HasMany<TIntermediateModel, TDeclaringModel>|\FluentForm\Framework\Database\Orm\Relations\HasOne<TIntermediateModel, TDeclaringModel>
     */
    protected $localRelationship;

    /**
     * Create a pending has-many-through or has-one-through relationship.
     *
     * @param  TDeclaringModel  $rootModel
     * @param  \FluentForm\Framework\Database\Orm\Relations\HasMany<TIntermediateModel, TDeclaringModel>|\FluentForm\Framework\Database\Orm\Relations\HasOne<TIntermediateModel, TDeclaringModel>  $localRelationship
     */
    public function __construct($rootModel, $localRelationship)
    {
        $this->rootModel = $rootModel;

        $this->localRelationship = $localRelationship;
    }

    /**
     * Define the distant relationship that this model has.
     *
     * @template TRelatedModel of \FluentForm\Framework\Database\Orm\Model
     *
     * @param  string|(callable(TIntermediateModel): (\FluentForm\Framework\Database\Orm\Relations\HasOne<TRelatedModel, TIntermediateModel>|\FluentForm\Framework\Database\Orm\Relations\HasMany<TRelatedModel, TIntermediateModel>|\FluentForm\Framework\Database\Orm\Relations\MorphOneOrMany<TRelatedModel, TIntermediateModel>))  $callback
     * @return (
     *     $callback is string
     *     ? \FluentForm\Framework\Database\Orm\Relations\HasManyThrough<\FluentForm\Framework\Database\Orm\Model, TIntermediateModel, TDeclaringModel>|\FluentForm\Framework\Database\Orm\Relations\HasOneThrough<\FluentForm\Framework\Database\Orm\Model, TIntermediateModel, TDeclaringModel>
     *     : (
     *         $callback is callable(TIntermediateModel): \FluentForm\Framework\Database\Orm\Relations\HasOne<TRelatedModel, TIntermediateModel>
     *         ? \FluentForm\Framework\Database\Orm\Relations\HasOneThrough<TRelatedModel, TIntermediateModel, TDeclaringModel>
     *         : \FluentForm\Framework\Database\Orm\Relations\HasManyThrough<TRelatedModel, TIntermediateModel, TDeclaringModel>
     *     )
     * )
     */
    public function has($callback)
    {
        if (is_string($callback)) {
            $callback = fn () => $this->localRelationship->getRelated()->{$callback}();
        }

        $distantRelation = $callback($this->localRelationship->getRelated());

        if ($distantRelation instanceof HasMany) {
            $returnedRelation = $this->rootModel->hasManyThrough(
                $distantRelation->getRelated()::class,
                $this->localRelationship->getRelated()::class,
                $this->localRelationship->getForeignKeyName(),
                $distantRelation->getForeignKeyName(),
                $this->localRelationship->getLocalKeyName(),
                $distantRelation->getLocalKeyName(),
            );
        } else {
            $returnedRelation = $this->rootModel->hasOneThrough(
                $distantRelation->getRelated()::class,
                $this->localRelationship->getRelated()::class,
                $this->localRelationship->getForeignKeyName(),
                $distantRelation->getForeignKeyName(),
                $this->localRelationship->getLocalKeyName(),
                $distantRelation->getLocalKeyName(),
            );
        }

        if ($this->localRelationship instanceof MorphOneOrMany) {
            $returnedRelation->where($this->localRelationship->getQualifiedMorphType(), $this->localRelationship->getMorphClass());
        }

        return $returnedRelation;
    }

    /**
     * Handle dynamic method calls into the model.
     *
     * @param  string  $method
     * @param  array  $parameters
     * @return mixed
     */
    public function __call($method, $parameters)
    {
        if (Str::startsWith($method, 'has')) {
            return $this->has(Str::of($method)->after('has')->lcfirst()->toString());
        }

        throw new BadMethodCallException(sprintf(
            'Call to undefined method %s::%s()', static::class, $method
        ));
    }
}

<?php

namespace FluentForm\Framework\Database\Orm\Relations;

use Closure;
use FluentForm\Framework\Support\Arr;
use FluentForm\Framework\Database\Orm\Model;
use FluentForm\Framework\Database\Orm\Builder;
use FluentForm\Framework\Database\Orm\Collection;
use FluentForm\Framework\Database\Query\Expression;

abstract class Relation
{
    /**
     * The Eloquent query builder instance.
     *
     * @var \FluentForm\Framework\Database\Orm\Builder
     */
    protected $query;

    /**
     * The parent model instance.
     *
     * @var \FluentForm\Framework\Database\Orm\Model
     */
    protected $parent;

    /**
     * The related model instance.
     *
     * @var \FluentForm\Framework\Database\Orm\Model
     */
    protected $related;

    /**
     * Indicates if the relation is adding constraints.
     *
     * @var bool
     */
    protected static $constraints = true;

    /**
     * An array to map class names to their morph names in database.
     *
     * @var array
     */
    protected static $morphMap = [];

    /**
     * Create a new relation instance.
     *
     * @param  \FluentForm\Framework\Database\Orm\Builder  $query
     * @param  \FluentForm\Framework\Database\Orm\Model  $parent
     * @return void
     */
    public function __construct(Builder $query, Model $parent)
    {
        $this->query = $query;
        $this->parent = $parent;
        $this->related = $query->getModel();

        $this->addConstraints();
    }

    /**
     * Set the base constraints on the relation query.
     *
     * @return void
     */
    abstract public function addConstraints();

    /**
     * Set the constraints for an eager load of the relation.
     *
     * @param  array  $models
     * @return void
     */
    abstract public function addEagerConstraints(array $models);

    /**
     * Initialize the relation on a set of models.
     *
     * @param  array   $models
     * @param  string  $relation
     * @return array
     */
    abstract public function initRelation(array $models, $relation);

    /**
     * Match the eagerly loaded results to their parents.
     *
     * @param  array   $models
     * @param  \FluentForm\Framework\Database\Orm\Collection  $results
     * @param  string  $relation
     * @return array
     */
    abstract public function match(array $models, Collection $results, $relation);

    /**
     * Get the results of the relationship.
     *
     * @return mixed
     */
    abstract public function getResults();

    /**
     * Get the relationship for eager loading.
     *
     * @return \FluentForm\Framework\Database\Orm\Collection
     */
    public function getEager()
    {
        return $this->get();
    }

    /**
     * Touch all of the related models for the relationship.
     *
     * @return void
     */
    public function touch()
    {
        $column = $this->getRelated()->getUpdatedAtColumn();

        $this->rawUpdate([$column => $this->getRelated()->freshTimestampString()]);
    }

    /**
     * Run a raw update against the base query.
     *
     * @param  array  $attributes
     * @return int
     */
    public function rawUpdate(array $attributes = [])
    {
        return $this->query->update($attributes);
    }

    /**
     * Add the constraints for a relationship count query.
     *
     * @param  \FluentForm\Framework\Database\Orm\Builder  $query
     * @param  \FluentForm\Framework\Database\Orm\Builder  $parent
     * @return \FluentForm\Framework\Database\Orm\Builder
     */
    public function getRelationCountQuery(Builder $query, Builder $parent)
    {
        return $this->getRelationQuery($query, $parent, new Expression('count(*)'));
    }

    /**
     * Add the constraints for a relationship query.
     *
     * @param  \FluentForm\Framework\Database\Orm\Builder  $query
     * @param  \FluentForm\Framework\Database\Orm\Builder  $parent
     * @param  array|mixed $columns
     * @return \FluentForm\Framework\Database\Orm\Builder
     */
    public function getRelationQuery(Builder $query, Builder $parent, $columns = ['*'])
    {
        $query->select($columns);

        $key = $this->wrap($this->getQualifiedParentKeyName());

        return $query->where($this->getHasCompareKey(), '=', new Expression($key));
    }

    /**
     * Run a callback with constraints disabled on the relation.
     *
     * @param  \Closure  $callback
     * @return mixed
     */
    public static function noConstraints(Closure $callback)
    {
        $previous = static::$constraints;

        static::$constraints = false;

        // When resetting the relation where clause, we want to shift the first element
        // off of the bindings, leaving only the constraints that the developers put
        // as "extra" on the relationships, and not original relation constraints.
        try {
            $results = call_user_func($callback);
        } finally {
            static::$constraints = $previous;
        }

        return $results;
    }

    /**
     * Get all of the primary keys for an array of models.
     *
     * @param  array   $models
     * @param  string  $key
     * @return array
     */
    protected function getKeys(array $models, $key = null)
    {
        return array_unique(array_values(array_map(function ($value) use ($key) {
            return $key ? $value->getAttribute($key) : $value->getKey();
        }, $models)));
    }

    /**
     * Get the underlying query for the relation.
     *
     * @return \FluentForm\Framework\Database\Orm\Builder
     */
    public function getQuery()
    {
        return $this->query;
    }

    /**
     * Get the base query builder driving the Eloquent builder.
     *
     * @return \FluentForm\Framework\Database\Query\Builder
     */
    public function getBaseQuery()
    {
        return $this->query->getQuery();
    }

    /**
     * Get the parent model of the relation.
     *
     * @return \FluentForm\Framework\Database\Orm\Model
     */
    public function getParent()
    {
        return $this->parent;
    }

    /**
     * Get the fully qualified parent key name.
     *
     * @return string
     */
    public function getQualifiedParentKeyName()
    {
        return $this->parent->getQualifiedKeyName();
    }

    /**
     * Get the related model of the relation.
     *
     * @return \FluentForm\Framework\Database\Orm\Model
     */
    public function getRelated()
    {
        return $this->related;
    }

    /**
     * Get the name of the "created at" column.
     *
     * @return string
     */
    public function createdAt()
    {
        return $this->parent->getCreatedAtColumn();
    }

    /**
     * Get the name of the "updated at" column.
     *
     * @return string
     */
    public function updatedAt()
    {
        return $this->parent->getUpdatedAtColumn();
    }

    /**
     * Get the name of the related model's "updated at" column.
     *
     * @return string
     */
    public function relatedUpdatedAt()
    {
        return $this->related->getUpdatedAtColumn();
    }

    /**
     * Wrap the given value with the parent query's grammar.
     *
     * @param  string  $value
     * @return string
     */
    public function wrap($value)
    {
        return $this->parent->newQueryWithoutScopes()->getQuery()->getGrammar()->wrap($value);
    }

    /**
     * Set or get the morph map for polymorphic relations.
     *
     * @param  array|null  $map
     * @param  bool  $merge
     * @return array
     */
    public static function morphMap(array $map = null, $merge = true)
    {
        $map = static::buildMorphMapFromModels($map);

        if (is_array($map)) {
            static::$morphMap = $merge ? array_merge(static::$morphMap, $map) : $map;
        }

        return static::$morphMap;
    }

    /**
     * Builds a table-keyed array from model class names.
     *
     * @param  string[]|null  $models
     * @return array|null
     */
    protected static function buildMorphMapFromModels(array $models = null)
    {
        if (is_null($models) || Arr::isAssoc($models)) {
            return $models;
        }

        $tables = array_map(function ($model) {
            return (new $model)->getTable();
        }, $models);

        return array_combine($tables, $models);
    }

    /**
     * Handle dynamic method calls to the relationship.
     *
     * @param  string  $method
     * @param  array   $parameters
     * @return mixed
     */
    public function __call($method, $parameters)
    {
        $result = call_user_func_array([$this->query, $method], $parameters);

        if ($result === $this->query) {
            return $this;
        }

        return $result;
    }

    /**
     * Force a clone of the underlying query builder when cloning.
     *
     * @return void
     */
    public function __clone()
    {
        $this->query = clone $this->query;
    }
}

<?php

declare(strict_types=1);

namespace FluentFormDev\PHPStan;

use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\PropertiesClassReflectionExtension;
use PHPStan\Reflection\PropertyReflection;
use PHPStan\Type\ArrayType;
use PHPStan\Type\BooleanType;
use PHPStan\Type\FloatType;
use PHPStan\Type\IntegerType;
use PHPStan\Type\MixedType;
use PHPStan\Type\StringType;
use PHPStan\Type\Type;

/**
 * Teaches PHPStan about WPFluent ORM model properties.
 *
 * The ORM exposes properties via __get/__set (getAttribute/setAttribute) so
 * PHPStan cannot see $fillable fields, $casts-typed properties, accessor
 * methods (getXxxAttribute), or relationship methods as valid property access.
 *
 * This extension reads those sources at analysis time and declares the
 * resulting properties so that "Access to an undefined property" errors
 * are not raised for legitimate model attribute access.
 */
final class ModelPropertyExtension implements PropertiesClassReflectionExtension
{
    private const BASE_MODEL = 'FluentForm\\Framework\\Database\\Orm\\Model';

    private const CAST_TYPES = [
        'int'        => 'integer',
        'integer'    => 'integer',
        'real'       => 'float',
        'float'      => 'float',
        'double'     => 'float',
        'decimal'    => 'float',
        'string'     => 'string',
        'bool'       => 'boolean',
        'boolean'    => 'boolean',
        'array'      => 'array',
        'json'       => 'array',
        'collection' => 'array',
    ];

    // Always-present columns inherited from the base model / timestamps trait
    private const BASE_PROPERTIES = ['id', 'created_at', 'updated_at'];

    public function hasProperty(ClassReflection $classReflection, string $propertyName): bool
    {
        if (!$this->isOrmModel($classReflection)) {
            return false;
        }

        if (in_array($propertyName, self::BASE_PROPERTIES, true)) {
            return true;
        }

        return in_array($propertyName, $this->getFillable($classReflection), true)
            || $this->hasAccessorMethod($classReflection, $propertyName)
            || $this->hasRelationshipMethod($classReflection, $propertyName);
    }

    public function getProperty(ClassReflection $classReflection, string $propertyName): PropertyReflection
    {
        $type = $this->resolveType($classReflection, $propertyName);

        // Accessor-only properties (no matching mutator) are read-only
        $writable = !$this->hasAccessorMethod($classReflection, $propertyName)
            || $this->hasMutatorMethod($classReflection, $propertyName);

        return new ModelPropertyReflection($classReflection, $type, $writable);
    }

    private function isOrmModel(ClassReflection $classReflection): bool
    {
        return $classReflection->getName() === self::BASE_MODEL
            || $classReflection->isSubclassOf(self::BASE_MODEL);
    }

    private function getFillable(ClassReflection $classReflection): array
    {
        try {
            $defaults = $classReflection->getNativeReflection()->getDefaultProperties();
            return (array) ($defaults['fillable'] ?? []);
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function getCasts(ClassReflection $classReflection): array
    {
        try {
            $defaults = $classReflection->getNativeReflection()->getDefaultProperties();
            return (array) ($defaults['casts'] ?? []);
        } catch (\Throwable $e) {
            return [];
        }
    }

    private function hasAccessorMethod(ClassReflection $classReflection, string $propertyName): bool
    {
        return $classReflection->hasNativeMethod($this->toAccessorName($propertyName));
    }

    private function hasMutatorMethod(ClassReflection $classReflection, string $propertyName): bool
    {
        return $classReflection->hasNativeMethod($this->toMutatorName($propertyName));
    }

    private function hasRelationshipMethod(ClassReflection $classReflection, string $propertyName): bool
    {
        foreach ($this->relationshipCandidates($propertyName) as $candidate) {
            if ($classReflection->hasNativeMethod($candidate)) {
                return true;
            }
        }

        return false;
    }

    /**
     * A property like "order_items" may be loaded by a relationship method
     * named "order_items" (exact) or "orderItems" (camelCase).
     *
     * @return string[]
     */
    private function relationshipCandidates(string $propertyName): array
    {
        $candidates = [$propertyName];
        $camel = lcfirst(str_replace('_', '', ucwords($propertyName, '_')));
        if ($camel !== $propertyName) {
            $candidates[] = $camel;
        }

        return $candidates;
    }

    private function toAccessorName(string $propertyName): string
    {
        return 'get' . str_replace('_', '', ucwords($propertyName, '_')) . 'Attribute';
    }

    private function toMutatorName(string $propertyName): string
    {
        return 'set' . str_replace('_', '', ucwords($propertyName, '_')) . 'Attribute';
    }

    private function resolveType(ClassReflection $classReflection, string $propertyName): Type
    {
        $casts = $this->getCasts($classReflection);

        if (isset($casts[$propertyName])) {
            $castKey = strtolower(explode(':', (string) $casts[$propertyName])[0]);
            $phpType = self::CAST_TYPES[$castKey] ?? null;

            if ($phpType !== null) {
                switch ($phpType) {
                    case 'integer': return new IntegerType();
                    case 'float':   return new FloatType();
                    case 'string':  return new StringType();
                    case 'boolean': return new BooleanType();
                    case 'array':   return new ArrayType(new MixedType(), new MixedType());
                }
            }
        }

        return new MixedType();
    }
}

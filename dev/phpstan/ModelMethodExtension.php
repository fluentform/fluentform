<?php

declare(strict_types=1);

namespace FluentFormDev\PHPStan;

use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\MethodReflection;
use PHPStan\Reflection\MethodsClassReflectionExtension;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\Type\MixedType;

/**
 * Teaches PHPStan about WPFluent ORM model and query builder dynamic methods.
 *
 * The ORM uses __callStatic to forward two categories of call that PHPStan
 * cannot see through native reflection:
 *
 *   1. Native query-builder methods (where, find, create, …) that exist on
 *      Orm\Builder or Query\Builder but are reached via Model::__callStatic.
 *      Resolved dynamically: if Builder declares the method natively, it is
 *      accepted on any Model subclass too.
 *
 *   2. Local query scopes (scopeSearch, scopeBatchUpdate, …) defined on a
 *      Model subclass (including trait-provided ones). PHPStan can see the
 *      scope method, so we check for "scope" + ucfirst($methodName) on the
 *      specific class. This means Order::search() passes (Order has
 *      scopeSearch via CanSearch) but Order::nuhel() fails (no scopeNuhel).
 *
 * For Builder instances typed as Orm\Builder or Query\Builder, native Builder
 * methods plus the specific ORM-forwarded methods in BUILDER_ORM_METHODS are
 * accepted. The allowlist covers two patterns:
 *
 *   a. Scope methods forwarded via Builder::__call when the associated model
 *      cannot be determined statically (e.g. $builder->search() after a plain
 *      Builder variable assignment).
 *
 *   b. Model instance methods called on Builder|Model union variables — PHPStan
 *      infers this union when ORM return types are ambiguous, but at runtime
 *      the variable is always a Model. The method must exist on the Builder
 *      side of the union for PHPStan to accept the call.
 *
 * Typos on Builder are still caught: only the listed methods are accepted.
 */
final class ModelMethodExtension implements MethodsClassReflectionExtension
{
    private const BASE_MODEL    = 'FluentForm\\Framework\\Database\\Orm\\Model';
    private const ORM_BUILDER   = 'FluentForm\\Framework\\Database\\Orm\\Builder';
    private const QUERY_BUILDER = 'FluentForm\\Framework\\Database\\Query\\Builder';

    /**
     * Methods accepted on Builder that are forwarded via __call or called on
     * Builder|Model union types. Genuine typos are still caught.
     */
    private const BUILDER_ORM_METHODS = [
        // Scope methods (CanSearch / CanUpdateBatch traits, model-specific scopes)
        'search', 'searchBy', 'batchUpdate', 'productCategoryTaxOverrides', 'applyCustomSortBy',
        // Model instance methods reached via Builder|Model union type inference
        'updateMeta', 'getMeta', 'addLog', 'recountStat', 'soldIndividually',
        'canPurchase', 'canBeRefunded', 'canBeDeleted', 'isSubscription',
        'isBundleProduct', 'updatePaymentStatus', 'acceptDispute', 'performDuplicate',
        'userCan', 'userCanAny', 'getDownloads', 'getTermByType', 'media',
        'upgradeablePath', 'save',
    ];

    private ReflectionProvider $reflectionProvider;

    public function __construct(ReflectionProvider $reflectionProvider)
    {
        $this->reflectionProvider = $reflectionProvider;
    }

    public function hasMethod(ClassReflection $classReflection, string $methodName): bool
    {
        if ($this->isModel($classReflection)) {
            return $this->builderHasNativeMethod($methodName)
                || $this->hasScopeMethod($classReflection, $methodName);
        }

        if ($this->isBuilder($classReflection)) {
            return $this->builderHasNativeMethod($methodName)
                || in_array($methodName, self::BUILDER_ORM_METHODS, true);
        }

        return false;
    }

    public function getMethod(ClassReflection $classReflection, string $methodName): MethodReflection
    {
        // Model calls go through __callStatic → static; Builder calls are instance.
        $isStatic = $this->isModel($classReflection);
        return new AppFacadeMethodReflection($classReflection, $methodName, new MixedType(), $isStatic);
    }

    /**
     * Returns true when either Orm\Builder or Query\Builder declares $methodName
     * as a native (non-magic) method — i.e. the ORM actually has it.
     */
    private function builderHasNativeMethod(string $methodName): bool
    {
        foreach ([self::ORM_BUILDER, self::QUERY_BUILDER] as $builderClass) {
            if (!$this->reflectionProvider->hasClass($builderClass)) {
                continue;
            }

            $builder = $this->reflectionProvider->getClass($builderClass);

            if ($builder->hasNativeMethod($methodName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns true when the model class itself (including trait methods) declares
     * a local query scope for $methodName, e.g. "search" → "scopeSearch".
     */
    private function hasScopeMethod(ClassReflection $classReflection, string $methodName): bool
    {
        $scopeName = 'scope' . ucfirst($methodName);
        return $classReflection->hasNativeMethod($scopeName);
    }

    private function isModel(ClassReflection $classReflection): bool
    {
        return $classReflection->getName() === self::BASE_MODEL
            || $classReflection->isSubclassOf(self::BASE_MODEL);
    }

    private function isBuilder(ClassReflection $classReflection): bool
    {
        $name = $classReflection->getName();

        foreach ([self::ORM_BUILDER, self::QUERY_BUILDER] as $base) {
            if ($name === $base || $classReflection->isSubclassOf($base)) {
                return true;
            }
        }

        return false;
    }
}

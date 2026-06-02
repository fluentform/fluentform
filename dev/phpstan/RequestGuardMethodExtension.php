<?php

declare(strict_types=1);

namespace FluentFormDev\PHPStan;

use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\FunctionVariant;
use PHPStan\Reflection\MethodReflection;
use PHPStan\Reflection\MethodsClassReflectionExtension;
use PHPStan\Reflection\ReflectionProvider;
use PHPStan\TrinaryLogic;
use PHPStan\Type\Generic\TemplateTypeMap;
use PHPStan\Type\MixedType;
use PHPStan\Type\Type;

/**
 * Teaches PHPStan about WPFluent FormRequest (RequestGuard) forwarded methods.
 *
 * App FormRequest classes extend RequestGuard, which has __call($method, $params)
 * that forwards every unknown call verbatim to $this->request (an instance of
 * FluentForm\Framework\Http\Request\Request).
 *
 * This extension only accepts a method if Request actually declares it — natively
 * or via a trait (e.g. InputHelperMethodsTrait provides getSafe()). Unknown
 * methods on a FormRequest still fail the gate.
 *
 * Allowed examples: getSafe(), get(), all(), has(), input(), file(), …
 * Rejected examples: $request->nuhel() → "Call to an undefined method"
 */
final class RequestGuardMethodExtension implements MethodsClassReflectionExtension
{
    private const REQUEST_GUARD = 'FluentForm\\Framework\\Foundation\\RequestGuard';
    private const REQUEST_CLASS = 'FluentForm\\Framework\\Http\\Request\\Request';

    private ReflectionProvider $reflectionProvider;

    public function __construct(ReflectionProvider $reflectionProvider)
    {
        $this->reflectionProvider = $reflectionProvider;
    }

    public function hasMethod(ClassReflection $classReflection, string $methodName): bool
    {
        return $this->isRequestGuard($classReflection)
            && $this->requestHasMethod($methodName);
    }

    public function getMethod(ClassReflection $classReflection, string $methodName): MethodReflection
    {
        return new RequestGuardMethodReflection(
            $classReflection,
            $methodName,
            $this->resolveReturnType($methodName)
        );
    }

    private function isRequestGuard(ClassReflection $classReflection): bool
    {
        return $classReflection->isSubclassOf(self::REQUEST_GUARD);
    }

    /**
     * Returns true only when the proxied Request class declares $methodName
     * natively (including methods from traits it uses, e.g. InputHelperMethodsTrait).
     */
    private function requestHasMethod(string $methodName): bool
    {
        if (!$this->reflectionProvider->hasClass(self::REQUEST_CLASS)) {
            return false;
        }

        return $this->reflectionProvider
            ->getClass(self::REQUEST_CLASS)
            ->hasNativeMethod($methodName);
    }

    private function resolveReturnType(string $methodName): Type
    {
        if (!$this->reflectionProvider->hasClass(self::REQUEST_CLASS)) {
            return new MixedType();
        }

        $request = $this->reflectionProvider->getClass(self::REQUEST_CLASS);

        if (!$request->hasNativeMethod($methodName)) {
            return new MixedType();
        }

        try {
            $variants = $request->getNativeMethod($methodName)->getVariants();
            if (!empty($variants)) {
                return $variants[0]->getReturnType();
            }
        } catch (\Throwable $e) {
            // fall through
        }

        return new MixedType();
    }
}

/**
 * Represents one forwarded instance method on a RequestGuard subclass.
 */
final class RequestGuardMethodReflection implements MethodReflection
{
    private ClassReflection $declaringClass;
    private string $name;
    private Type $returnType;

    public function __construct(ClassReflection $declaringClass, string $name, Type $returnType)
    {
        $this->declaringClass = $declaringClass;
        $this->name           = $name;
        $this->returnType     = $returnType;
    }

    public function getDeclaringClass(): ClassReflection { return $this->declaringClass; }
    public function getName(): string { return $this->name; }
    public function isStatic(): bool { return false; }
    public function isPrivate(): bool { return false; }
    public function isPublic(): bool { return true; }
    public function getDocComment(): ?string { return null; }
    public function getPrototype(): \PHPStan\Reflection\ClassMemberReflection { return $this; }

    public function getVariants(): array
    {
        return [
            new FunctionVariant(
                TemplateTypeMap::createEmpty(),
                null,
                [],
                true,
                $this->returnType
            ),
        ];
    }

    public function isDeprecated(): TrinaryLogic { return TrinaryLogic::createNo(); }
    public function getDeprecatedDescription(): ?string { return null; }
    public function isFinal(): TrinaryLogic { return TrinaryLogic::createNo(); }
    public function isInternal(): TrinaryLogic { return TrinaryLogic::createNo(); }
    public function getThrowType(): ?Type { return null; }
    public function hasSideEffects(): TrinaryLogic { return TrinaryLogic::createMaybe(); }
}

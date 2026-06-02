<?php

declare(strict_types=1);

namespace FluentFormDev\PHPStan;

use PHPStan\Reflection\ClassMemberReflection;
use PHPStan\Reflection\ClassReflection;
use PHPStan\Reflection\FunctionVariant;
use PHPStan\Reflection\MethodReflection;
use PHPStan\Reflection\ParametersAcceptorWithPhpDocs;
use PHPStan\TrinaryLogic;
use PHPStan\Type\Generic\TemplateTypeMap;
use PHPStan\Type\MixedType;
use PHPStan\Type\Type;

/**
 * Represents one proxied method — either a static App facade call or an
 * instance-forwarded call (Builder, DatabaseManager).
 *
 * Pass $isStatic = true (default) for App::__callStatic calls so PHPStan
 * does not raise "Static call to instance method". Pass false for instance
 * __call forwarders (Builder, DatabaseManager) so PHPStan correctly models
 * them as instance methods.
 */
final class AppFacadeMethodReflection implements MethodReflection
{
    private ClassReflection $declaringClass;
    private string $name;
    private Type $returnType;
    private bool $static;

    public function __construct(ClassReflection $declaringClass, string $name, Type $returnType, bool $isStatic = true)
    {
        $this->declaringClass = $declaringClass;
        $this->name           = $name;
        $this->returnType     = $returnType;
        $this->static         = $isStatic;
    }

    public function getDeclaringClass(): ClassReflection
    {
        return $this->declaringClass;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function isStatic(): bool
    {
        return $this->static;
    }

    public function isPrivate(): bool
    {
        return false;
    }

    public function isPublic(): bool
    {
        return true;
    }

    public function getDocComment(): ?string
    {
        return null;
    }

    public function getPrototype(): ClassMemberReflection
    {
        return $this;
    }

    /**
     * @return ParametersAcceptorWithPhpDocs[]
     */
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

    public function isDeprecated(): TrinaryLogic
    {
        return TrinaryLogic::createNo();
    }

    public function getDeprecatedDescription(): ?string
    {
        return null;
    }

    public function isFinal(): TrinaryLogic
    {
        return TrinaryLogic::createNo();
    }

    public function isInternal(): TrinaryLogic
    {
        return TrinaryLogic::createNo();
    }

    public function getThrowType(): ?Type
    {
        return null;
    }

    public function hasSideEffects(): TrinaryLogic
    {
        return TrinaryLogic::createMaybe();
    }
}
